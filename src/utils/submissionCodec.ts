import LZString from 'lz-string';
import type { ShareState } from './sharePayload';
import { SongMetadata, SongSection } from '../types';
import { calculateSectionBars, SECTION_CONFIGS } from './musicTheory';

/**
 * Compact submission format.
 *
 * A student's work is packed before it is compressed:
 *   - sections become short rows instead of objects with long field names
 *   - things the app can rebuild are left out (section IDs, the bar explanation text,
 *     default colors, the YouTube link, empty fields)
 *   - the four slider "I touched this" flags and hasVocals share one number
 *
 * Unpacking rebuilds the full analysis, so grading and review see what the student saw.
 * Everything happens in the browser; nothing is uploaded or stored.
 */

const FORMAT_VERSION = 2;

const FLAG_VOCALS = 1;
const FLAG_ENERGY = 2;
const FLAG_RHYTHM = 4;
const FLAG_VOCAL_SCALE = 8;
const FLAG_TEXTURE = 16;

const round1 = (n: number) => Math.round(n * 10) / 10;
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const defaultColor = (type: string) => (SECTION_CONFIGS as Record<string, { colorName: string }>)[type]?.colorName || 'indigo';

// ---------- Pack ----------
export function packSubmission(state: ShareState): Record<string, unknown> {
  const md = state.songMetadata;
  const m: Record<string, unknown> = {};
  const put = (key: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== '' && value !== 0) m[key] = value;
  };
  put('t', md.title);
  put('a', md.artist);
  put('al', md.album);
  put('y', md.year);
  put('g', md.genre);
  if (md.timeSignature && md.timeSignature !== '4/4') put('ts', md.timeSignature);
  put('b', md.bpm === '' ? '' : Number(md.bpm));
  if (md.referenceBpm && md.referenceBpm !== 120) put('rb', md.referenceBpm);
  put('yt', md.youtubeId);
  put('d', typeof md.videoDuration === 'number' ? round1(md.videoDuration) : 0);
  put('ss', typeof md.songStartTime === 'number' ? round1(md.songStartTime) : 0);
  put('se', typeof md.songEndTime === 'number' ? round1(md.songEndTime) : 0);

  const out: Record<string, unknown> = { v: FORMAT_VERSION, m };
  out.s = state.sections.map((s) => {
    const flags =
      (s.hasVocals ? FLAG_VOCALS : 0) |
      (s.modifiedScales?.energyLevel ? FLAG_ENERGY : 0) |
      (s.modifiedScales?.rhythmicDrive ? FLAG_RHYTHM : 0) |
      (s.modifiedScales?.vocalComplexity ? FLAG_VOCAL_SCALE : 0) |
      (s.modifiedScales?.textureDensity ? FLAG_TEXTURE : 0);
    const row: unknown[] = [
      s.type,
      s.label,
      round1(s.startTime),
      round1(s.endTime),
      s.calculatedBars,
      s.energyLevel,
      s.rhythmicDrive,
      s.vocalComplexity,
      s.textureDensity,
      flags,
      s.instrumentationNotes || '',
    ];
    if (s.color && s.color !== defaultColor(s.type)) row.push(s.color);
    return row;
  });
  if (state.studentName) out.n = state.studentName;
  if (state.completedAt) {
    const seconds = Math.round(Date.parse(state.completedAt) / 1000);
    if (Number.isFinite(seconds)) out.c = seconds;
  }
  if (state.tapTempoUsed) out.tp = 1;
  return out;
}

// ---------- Unpack ----------
export function unpackSubmission(packed: Record<string, any>): ShareState | null {
  if (!packed || packed.v !== FORMAT_VERSION || typeof packed.m !== 'object' || !Array.isArray(packed.s)) return null;
  const m = packed.m || {};

  const songMetadata: SongMetadata = {
    title: str(m.t),
    artist: str(m.a),
    album: str(m.al),
    year: str(m.y),
    genre: str(m.g),
    timeSignature: str(m.ts) || '4/4',
    bpm: typeof m.b === 'number' && Number.isFinite(m.b) ? m.b : '',
    referenceBpm: num(m.rb, 120),
    youtubeUrl: m.yt ? `https://www.youtube.com/watch?v=${str(m.yt)}` : '',
    youtubeId: str(m.yt),
    videoDuration: num(m.d, 0),
  };
  if (m.ss !== undefined) songMetadata.songStartTime = num(m.ss, 0);
  if (m.se !== undefined) songMetadata.songEndTime = num(m.se, 0);

  const sections: SongSection[] = [];
  for (const row of packed.s) {
    if (!Array.isArray(row)) return null;
    const [type, label, start, end, bars, energy, rhythm, vocals, texture, flags, notes, color] = row;
    if (typeof start !== 'number' || typeof end !== 'number') return null;
    const f = num(flags, 0);
    const calc = calculateSectionBars(end - start, songMetadata.bpm, songMetadata.timeSignature, type, songMetadata.referenceBpm);
    sections.push({
      id: `sec-${sections.length}`,
      type,
      label: str(label),
      startTime: start,
      endTime: end,
      calculatedBars: num(bars, calc.bars),
      barExplanation: calc.explanation,
      energyLevel: num(energy, 5),
      rhythmicDrive: num(rhythm, 5),
      vocalComplexity: num(vocals, 5),
      hasVocals: (f & FLAG_VOCALS) !== 0,
      textureDensity: num(texture, 5),
      instrumentationNotes: str(notes),
      color: str(color) || defaultColor(type),
      modifiedScales: {
        energyLevel: (f & FLAG_ENERGY) !== 0,
        rhythmicDrive: (f & FLAG_RHYTHM) !== 0,
        vocalComplexity: (f & FLAG_VOCAL_SCALE) !== 0,
        textureDensity: (f & FLAG_TEXTURE) !== 0,
      },
    });
  }

  const state: ShareState = {
    songMetadata,
    sections,
    studentName: str(packed.n),
    tapTempoUsed: packed.tp === 1,
  };
  if (typeof packed.c === 'number') state.completedAt = new Date(packed.c * 1000).toISOString();
  return state;
}

// ---------- Code / link helpers ----------
// A short fingerprint that catches codes that were cut off or mistyped while copying.
// It is not a security feature.
function copyCheck(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36);
}

/** Student code: compressed work + "." + copy check. Safe to paste anywhere. */
export function encodeSubmission(state: ShareState): string {
  const json = JSON.stringify(packSubmission(state));
  return `${LZString.compressToEncodedURIComponent(json)}.${copyCheck(json)}`;
}

/** Returns the work, or null if the code is incomplete or mistyped. */
export function decodeSubmission(code: string): ShareState | null {
  const raw = code.trim().replace(/\s+/g, '');
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const json = LZString.decompressFromEncodedURIComponent(raw.slice(0, dot));
  if (!json || copyCheck(json) !== raw.slice(dot + 1)) return null;
  try {
    return unpackSubmission(JSON.parse(json));
  } catch {
    return null;
  }
}

/** Share links use the same packed data without the copy check, to stay shorter. */
export function encodeForLink(state: ShareState): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(packSubmission(state)));
}

export function decodeFromLink(encoded: string): ShareState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded.trim().replace(/\s+/g, ''));
    return json ? unpackSubmission(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}
