import { AssignmentEvaluation } from '../types';
import { ShareState, decodeShareState } from './sharePayload';
import { decodeSubmission } from './submissionCodec';
import { CHECKS, CheckKey, evaluateAssignment } from './evaluation';

export interface BatchEntry {
  id: number;
  submission: ShareState;
  evaluation: AssignmentEvaluation;
  /** True when the same student name appears with more than one different code. */
  hasMultipleSubmissions: boolean;
}

export interface BatchParseResult {
  entries: BatchEntry[];
  unreadable: string[]; // the name on that line, or a short preview of the code
  duplicatesRemoved: number;
}

// Every compact code starts with the same few characters, because every packed submission
// starts with the same JSON characters. Used to find codes glued to other text.
const CODE_START = 'N4Ig';
// Codes made before the compact format are plain base64 of the whole analysis.
const OLD_CODE_START = 'eyJzb25n';
// Codes are made only of these characters. Everything else separates words.
const NOT_CODE_CHAR = /[^A-Za-z0-9+\-$.%]+/;
// Long text without a code start (class links, IDs) is ignored unless it is this long.
const SUSPICIOUS_LENGTH = 60;
// Words that appear in Google Classroom lists but are never a student's name.
const CLASSROOM_WORDS = /^(turned in|handed in|done late|missing|assigned|graded|returned|draft|submitted|not turned in|private comments?|class comments?|add (class |private )?comment|student work|instructions|all students|view (submission|work)|see more|unsubmit|mark as done|late|done|points?|\d+\/\d+)$/i;

/** Turn pasted HTML-ish text (tags, <br>, &nbsp;, invisible characters) into plain lines. */
export function cleanPastedText(text: string): string {
  const decode = (t: string) =>
    t
      .replace(/&nbsp;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&amp;/gi, '&');
  let t = decode(decode(text)); // twice: handles "&amp;lt;br&amp;gt;" style double-escaping
  t = t
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|tr|h\d)\s*>/gi, '\n')
    .replace(/<[^>]{0,200}>/g, ' ')
    .replace(/\\n/g, '\n') // a literal backslash-n
    .replace(/[​-‍⁠﻿­]/g, '') // invisible characters
    .replace(/[   ]/g, ' '); // non-breaking spaces
  return t;
}

/** Try to read a code out of a piece of text that may have other text glued to either end. */
function readCode(piece: string): { code: string; submission: ShareState } | null {
  // Compact codes: code, ".", copy check (up to 7 lowercase letters/digits).
  const starts = new Set<number>([0]);
  for (let i = piece.indexOf(CODE_START); i >= 0; i = piece.indexOf(CODE_START, i + 1)) starts.add(i);
  for (const start of starts) {
    const candidate = piece.slice(start).replace(/^\.+/, '');
    const dot = candidate.lastIndexOf('.');
    if (dot <= 0) continue;
    const body = candidate.slice(0, dot);
    // Anything after the copy check is glued-on text.
    const tail = (candidate.slice(dot + 1).match(/^[a-z0-9]{1,7}/) || [''])[0];
    for (let len = tail.length; len >= 1; len--) {
      const code = `${body}.${tail.slice(0, len)}`;
      const submission = decodeSubmission(code);
      if (submission) return { code, submission };
    }
  }
  // Older plain-base64 codes.
  const oldAt = piece.indexOf(OLD_CODE_START);
  if (oldAt >= 0) {
    const code = piece.slice(oldAt);
    const submission = decodeShareState(code);
    if (submission && submission.songMetadata && Array.isArray(submission.sections)) {
      return { code, submission };
    }
  }
  return null;
}

const isNameLike = (line: string) => {
  const words = line.trim().split(/\s+/);
  return (
    words.length >= 2 &&
    words.length <= 4 &&
    !CLASSROOM_WORDS.test(line.trim()) &&
    words.every((w) => /^[A-Z][A-Za-z'À-ſ-]*\.?$/.test(w))
  );
};

export function gradeSubmission(submission: ShareState): AssignmentEvaluation {
  // Codes made before tap tempo was recorded can't say; don't mark those students down for it.
  const tapUsed = submission.tapTempoUsed ?? true;
  return evaluateAssignment(submission.songMetadata, submission.sections, tapUsed);
}

/**
 * Pull every submission code out of pasted text and grade it. Copes with what
 * Google Classroom and spreadsheets paste in: names, status text ("Turned in"),
 * HTML tags and <br>s, &nbsp;, links, invisible characters, text glued to the
 * start or end of a code, and codes broken across lines.
 */
export function parseBatch(text: string): BatchParseResult {
  const lines = cleanPastedText(text).split(/\r?\n/);

  // Flatten into pieces, remembering which line each came from.
  const pieces: { text: string; line: number }[] = [];
  lines.forEach((line, i) => {
    for (const t of line.split(NOT_CODE_CHAR)) if (t.replace(/\./g, '').length) pieces.push({ text: t, line: i });
  });

  const isAttempt = (t: string) => t.includes(CODE_START) || t.includes(OLD_CODE_START) || t.length >= SUSPICIOUS_LENGTH;

  // A student's name: on the code's own line, or the nearest name-like line above it.
  const nameFor = (lineIdx: number) => {
    const own = lines[lineIdx]
      .split(NOT_CODE_CHAR)
      .filter((w) => w.length < 30 && !w.includes(CODE_START) && /^[A-Za-z]/.test(w))
      .join(' ')
      .trim();
    if (isNameLike(own)) return own;
    for (let i = lineIdx - 1; i >= 0 && i >= lineIdx - 6; i--) if (isNameLike(lines[i])) return lines[i].trim();
    return '';
  };

  const seen = new Set<string>();
  const unreadable: string[] = [];
  const entries: BatchEntry[] = [];
  let duplicatesRemoved = 0;

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i].text;
    if (!isAttempt(piece)) continue; // names, status words, links, class IDs...

    let found = readCode(piece);
    // A code broken across lines or spaces: try joining the next few pieces.
    let used = 0;
    if (!found) {
      let joined = piece;
      for (let j = 1; j <= 6 && i + j < pieces.length; j++) {
        const next = pieces[i + j].text;
        if (next.includes(CODE_START) || next.includes(OLD_CODE_START)) break; // the next student's code
        joined += next;
        found = readCode(joined);
        if (found) {
          used = j;
          break;
        }
      }
    }
    if (!found) {
      unreadable.push(nameFor(pieces[i].line) || `code starting ${piece.slice(0, 10)}…`);
      continue;
    }
    i += used;
    if (seen.has(found.code)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(found.code);
    entries.push({
      id: entries.length,
      submission: found.submission,
      evaluation: gradeSubmission(found.submission),
      hasMultipleSubmissions: false,
    });
  }

  const nameCounts = new Map<string, number>();
  for (const e of entries) {
    const key = (e.submission.studentName || '').trim().toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  }
  for (const e of entries) {
    const key = (e.submission.studentName || '').trim().toLowerCase();
    e.hasMultipleSubmissions = key !== '' && (nameCounts.get(key) || 0) > 1;
  }

  return { entries, unreadable, duplicatesRemoved };
}

export interface ClassPattern {
  key: CheckKey;
  label: string;
  studentsMissing: number;
  total: number;
}

/** Requirements ranked by how many students did not meet them. */
export function classPatterns(entries: BatchEntry[]): ClassPattern[] {
  return CHECKS.map(({ key, label }) => ({
    key,
    label,
    studentsMissing: entries.filter((e) => e.evaluation.issueKeys?.includes(key)).length,
    total: entries.length,
  }))
    .filter((p) => p.studentsMissing > 0)
    .sort((a, b) => b.studentsMissing - a.studentsMissing);
}

/** Gradebook CSV, downloaded straight to the teacher's computer. */
export function downloadBatchCsv(entries: BatchEntry[]) {
  // A leading = + - @ can run as a formula when a CSV is opened in a spreadsheet.
  const esc = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['Student', 'Song', 'Artist', 'BPM', 'Sections', 'Score', 'Status', 'Issues', ...CHECKS.map((c) => c.label)];
  const rows = entries.map((e) => {
    const md = e.submission.songMetadata;
    return [
      e.submission.studentName,
      md.title,
      md.artist,
      md.bpm,
      e.submission.sections.length,
      e.evaluation.score,
      e.evaluation.isThorough ? 'Complete' : 'Needs work',
      e.evaluation.issueKeys?.length ?? 0,
      ...CHECKS.map((c) => (e.evaluation.issueKeys?.includes(c.key) ? 'Missing' : 'OK')),
    ]
      .map(esc)
      .join(',');
  });
  const blob = new Blob([[header.map(esc).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `song-analyzer-grades-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
