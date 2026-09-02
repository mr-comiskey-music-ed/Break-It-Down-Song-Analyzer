import type { CSSProperties } from 'react';
import { SectionType, SongSection } from '../types';

export function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimecode(str: string): number | null {
  const clean = str.trim();
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseFloat(parts[2]);
    if (!isNaN(hours) && !isNaN(mins) && !isNaN(secs)) {
      return hours * 3600 + mins * 60 + secs;
    }
  } else if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  } else if (parts.length === 1) {
    const secs = parseFloat(parts[0]);
    if (!isNaN(secs)) return secs;
  }
  return null;
}

/**
 * Calculates bar count based on section duration, tempo, time signature, and music theory heuristics.
 */
export function calculateSectionBars(
  durationSeconds: number,
  bpm: number | string | null | undefined,
  timeSignature: string = '4/4',
  sectionType: SectionType = 'verse',
  referenceBpm?: number | null
): { bars: number; explanation: string; rawBars: number; effectiveBpm: number } {
  // Use student's BPM or fallback to referenceBpm or 120 default
  const numBpm = typeof bpm === 'number' ? bpm : bpm ? Number(bpm) : null;
  const numRefBpm = typeof referenceBpm === 'number' ? referenceBpm : referenceBpm ? Number(referenceBpm) : null;
  const effectiveBpm = numBpm && numBpm > 30 && numBpm < 300 ? numBpm : numRefBpm && numRefBpm > 30 ? numRefBpm : 120;

  // Parse time signature beats per bar (default 4)
  let beatsPerBar = 4;
  if (timeSignature.includes('/')) {
    const num = parseInt(timeSignature.split('/')[0], 10);
    if (!isNaN(num) && num > 0) beatsPerBar = num;
  }

  // Seconds per beat = 60 / BPM
  // Seconds per bar = beatsPerBar * (60 / BPM)
  const secondsPerBar = beatsPerBar * (60 / effectiveBpm);
  const rawBars = durationSeconds / secondsPerBar;

  if (rawBars <= 0.5) {
    return {
      bars: 1,
      explanation: 'Short transition (< 1 bar)',
      rawBars,
      effectiveBpm,
    };
  }

  let finalBars: number;
  let explanation: string;

  // Heuristic rounding logic based on music theory
  // Standard pop lengths: Intro/Outro = 4 or 8 bars; Verse/Pre-Chorus/Chorus/Bridge = 8 or 16 bars
  const roundedTo4 = Math.round(rawBars / 4) * 4;
  const roundedTo2 = Math.round(rawBars / 2) * 2;
  const diffFrom4 = Math.abs(rawBars - roundedTo4);
  const diffFrom2 = Math.abs(rawBars - roundedTo2);

  // If section is Intro or Outro:
  if (sectionType === 'intro' || sectionType === 'outro') {
    if (Math.abs(rawBars - 4) < 1.3) {
      finalBars = 4;
      explanation = 'Standard 4-bar introductory/concluding phrasing';
    } else if (Math.abs(rawBars - 8) < 1.6) {
      finalBars = 8;
      explanation = 'Standard 8-bar phrasing';
    } else if (diffFrom4 < 1.0 && roundedTo4 > 0) {
      finalBars = roundedTo4;
      explanation = `4-bar symmetrical phrasing (${roundedTo4} bars)`;
    } else if (diffFrom2 < 0.8 && roundedTo2 > 0) {
      finalBars = roundedTo2;
      explanation = `2-bar divisible phrasing (${roundedTo2} bars)`;
    } else {
      finalBars = Math.max(1, Math.round(rawBars));
      explanation = `Exact duration (~${finalBars} bars @ ${effectiveBpm} BPM)`;
    }
  } else {
    // Verse, Pre-Chorus, Chorus/Hook, Bridge
    if (Math.abs(rawBars - 8) < 1.7) {
      finalBars = 8;
      explanation = 'Standard pop length (8 bars)';
    } else if (Math.abs(rawBars - 16) < 2.3) {
      finalBars = 16;
      explanation = 'Standard extended pop length (16 bars)';
    } else if (Math.abs(rawBars - 12) < 1.5) {
      finalBars = 12;
      explanation = '12-bar phrase structure (common in blues & rock)';
    } else if (diffFrom4 < 1.1 && roundedTo4 > 0) {
      finalBars = roundedTo4;
      explanation = `Symmetrical multiple of 4 (${roundedTo4} bars)`;
    } else if (diffFrom2 < 0.8 && roundedTo2 > 0) {
      finalBars = roundedTo2;
      explanation = `Multiple of 2 phrasing (${roundedTo2} bars)`;
    } else {
      finalBars = Math.max(1, Math.round(rawBars));
      explanation = `Calculated ~${finalBars} bars (${timeSignature} @ ${effectiveBpm} BPM)`;
    }
  }

  return {
    bars: finalBars,
    explanation,
    rawBars: Math.round(rawBars * 10) / 10,
    effectiveBpm,
  };
}

export const SECTION_CONFIGS: Record<SectionType, {
  label: string;
  badgeLabel: string;
  colorName: string;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  typicalBars: number;
  description: string;
}> = {
  intro: {
    label: 'Intro',
    badgeLabel: 'INTRO',
    colorName: 'slate',
    bg: 'bg-slate-500/15 hover:bg-slate-500/25',
    border: 'border-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-700 text-white',
    typicalBars: 4,
    description: 'Establishes the groove, tempo, key, or main riff before vocals start.',
  },
  verse: {
    label: 'Verse',
    badgeLabel: 'VERSE',
    colorName: 'blue',
    bg: 'bg-blue-500/15 hover:bg-blue-500/25',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-600 text-white',
    typicalBars: 8,
    description: 'Tells the story; melody remains similar while lyrics change with each verse.',
  },
  pre_chorus: {
    label: 'Pre-Chorus/Pre-Hook',
    badgeLabel: 'PRE-CHORUS',
    colorName: 'purple',
    bg: 'bg-purple-500/15 hover:bg-purple-500/25',
    border: 'border-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-600 text-white',
    typicalBars: 4,
    description: 'Builds anticipation and dynamic momentum heading directly into the hook.',
  },
  chorus: {
    label: 'Chorus/Hook',
    badgeLabel: 'CHORUS / HOOK',
    colorName: 'rose',
    bg: 'bg-rose-500/15 hover:bg-rose-500/25',
    border: 'border-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-600 text-white',
    typicalBars: 8,
    description: 'The catchiest, most energetic focal point containing the central message & hook.',
  },
  bridge: {
    label: 'Bridge',
    badgeLabel: 'BRIDGE',
    colorName: 'emerald',
    bg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    border: 'border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-600 text-white',
    typicalBars: 8,
    description: 'Offers harmonic/lyrical contrast and a fresh perspective before the final climax.',
  },
  outro: {
    label: 'Outro',
    badgeLabel: 'OUTRO',
    colorName: 'slate',
    bg: 'bg-slate-500/15 hover:bg-slate-500/25',
    border: 'border-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-700 text-white',
    typicalBars: 8,
    description: 'Wraps up the song, often with fading elements, repeating hooks, or sudden stop.',
  },
  interlude: {
    label: 'Interlude',
    badgeLabel: 'INTERLUDE',
    colorName: 'slate',
    bg: 'bg-slate-500/15 hover:bg-slate-500/25',
    border: 'border-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-700 text-white',
    typicalBars: 4,
    description: 'A transition between sections, most often space between a chorus and the start of a new verse.',
  },
  instrumental_solo: {
    label: 'Instrumental Solo',
    badgeLabel: 'SOLO',
    colorName: 'orange',
    bg: 'bg-orange-500/15 hover:bg-orange-500/25',
    border: 'border-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    badgeBg: 'bg-orange-600 text-white',
    typicalBars: 8,
    description: 'An instrumental spotlight showcasing lead guitar, synth, or other lead instruments.',
  },
  custom: {
    label: 'Custom Section',
    badgeLabel: 'CUSTOM',
    colorName: 'amber',
    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-500 text-white',
    typicalBars: 8,
    description: 'A custom user-defined section.',
  },
  down_chorus: {
    label: 'Post-Chorus',
    badgeLabel: 'POST-CHORUS',
    colorName: 'pink',
    bg: 'bg-pink-500/15 hover:bg-pink-500/25',
    border: 'border-pink-500',
    text: 'text-pink-700 dark:text-pink-300',
    badgeBg: 'bg-pink-600 text-white',
    typicalBars: 8,
    description: "A Post-Chorus is a short musical section that happens immediately after the main chorus to extend its energy and act like an afterparty or an encore. Usually it's also very repetitive & catchy.",
  },
  post_chorus: {
    label: 'Post-Chorus',
    badgeLabel: 'POST-CHORUS',
    colorName: 'pink',
    bg: 'bg-pink-500/15 hover:bg-pink-500/25',
    border: 'border-pink-500',
    text: 'text-pink-700 dark:text-pink-300',
    badgeBg: 'bg-pink-600 text-white',
    typicalBars: 8,
    description: "A Post-Chorus is a short musical section that happens immediately after the main chorus to extend its energy and act like an afterparty or an encore. Usually it's also very repetitive & catchy.",
  },
};

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  bg: string;
  border: string;
  badgeBg: string;
  text: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'blue', name: 'Royal Blue', hex: '#2563eb', bg: 'bg-blue-500/15 hover:bg-blue-500/25', border: 'border-blue-500', badgeBg: 'bg-blue-600 text-white', text: 'text-blue-700 dark:text-blue-300' },
  { id: 'indigo', name: 'Electric Indigo', hex: '#4f46e5', bg: 'bg-indigo-500/15 hover:bg-indigo-500/25', border: 'border-indigo-500', badgeBg: 'bg-indigo-600 text-white', text: 'text-indigo-700 dark:text-indigo-300' },
  { id: 'purple', name: 'Deep Purple', hex: '#9333ea', bg: 'bg-purple-500/15 hover:bg-purple-500/25', border: 'border-purple-500', badgeBg: 'bg-purple-600 text-white', text: 'text-purple-700 dark:text-purple-300' },
  { id: 'rose', name: 'Vibrant Rose', hex: '#e11d48', bg: 'bg-rose-500/15 hover:bg-rose-500/25', border: 'border-rose-500', badgeBg: 'bg-rose-600 text-white', text: 'text-rose-700 dark:text-rose-300' },
  { id: 'amber', name: 'Warm Amber', hex: '#d97706', bg: 'bg-amber-500/15 hover:bg-amber-500/25', border: 'border-amber-500', badgeBg: 'bg-amber-500 text-white', text: 'text-amber-700 dark:text-amber-300' },
  { id: 'emerald', name: 'Emerald Mint', hex: '#059669', bg: 'bg-emerald-500/15 hover:bg-emerald-500/25', border: 'border-emerald-500', badgeBg: 'bg-emerald-600 text-white', text: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'teal', name: 'Ocean Teal', hex: '#0d9488', bg: 'bg-teal-500/15 hover:bg-teal-500/25', border: 'border-teal-500', badgeBg: 'bg-teal-600 text-white', text: 'text-teal-700 dark:text-teal-300' },
  { id: 'cyan', name: 'Sky Cyan', hex: '#0891b2', bg: 'bg-cyan-500/15 hover:bg-cyan-500/25', border: 'border-cyan-500', badgeBg: 'bg-cyan-600 text-white', text: 'text-cyan-700 dark:text-cyan-300' },
  { id: 'orange', name: 'Sunset Orange', hex: '#ea580c', bg: 'bg-orange-500/15 hover:bg-orange-500/25', border: 'border-orange-500', badgeBg: 'bg-orange-600 text-white', text: 'text-orange-700 dark:text-orange-300' },
  { id: 'pink', name: 'Hot Pink', hex: '#db2777', bg: 'bg-pink-500/15 hover:bg-pink-500/25', border: 'border-pink-500', badgeBg: 'bg-pink-600 text-white', text: 'text-pink-700 dark:text-pink-300' },
  { id: 'lime', name: 'Acid Lime', hex: '#65a30d', bg: 'bg-lime-500/15 hover:bg-lime-500/25', border: 'border-lime-500', badgeBg: 'bg-lime-600 text-white', text: 'text-lime-700 dark:text-lime-300' },
  { id: 'slate', name: 'Steel Slate', hex: '#475569', bg: 'bg-slate-500/15 hover:bg-slate-500/25', border: 'border-slate-500', badgeBg: 'bg-slate-700 text-white', text: 'text-slate-700 dark:text-slate-300' },
];

export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex) return `rgba(99, 102, 241, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getSectionColorTheme(section: { type: SectionType; color?: string }): {
  hex: string;
  bgClass?: string;
  bgStyle?: CSSProperties;
  borderClass?: string;
  borderStyle?: CSSProperties;
  badgeClass?: string;
  badgeStyle?: CSSProperties;
  accentStyle?: CSSProperties;
  textClass?: string;
  isCustom: boolean;
} {
  const customColor = section.color;
  const config = SECTION_CONFIGS[section.type] || SECTION_CONFIGS.verse;

  // 1. If color matches one of the preset IDs (e.g. 'rose', 'blue')
  if (customColor) {
    const preset = COLOR_PRESETS.find(
      (p) => p.id === customColor || p.hex.toLowerCase() === customColor.toLowerCase()
    );
    if (preset) {
      return {
        hex: preset.hex,
        bgClass: preset.bg,
        borderClass: preset.border,
        badgeClass: preset.badgeBg,
        textClass: preset.text,
        accentStyle: { backgroundColor: preset.hex },
        isCustom: true,
      };
    }

    // 2. If it's a custom hex string like '#ff00aa'
    if (customColor.startsWith('#')) {
      return {
        hex: customColor,
        bgStyle: { backgroundColor: hexToRgba(customColor, 0.18) },
        borderStyle: { borderColor: hexToRgba(customColor, 0.6) },
        badgeStyle: { backgroundColor: customColor, color: '#ffffff' },
        accentStyle: { backgroundColor: customColor },
        isCustom: true,
      };
    }
  }

  // 3. Default for section type
  const defaultPreset = COLOR_PRESETS.find((p) => p.id === config.colorName) || COLOR_PRESETS[0];
  return {
    hex: defaultPreset.hex,
    bgClass: config.bg,
    borderClass: config.border,
    badgeClass: config.badgeBg,
    textClass: config.text,
    accentStyle: { backgroundColor: defaultPreset.hex },
    isCustom: false,
  };
}

export function recalculateSectionLabels(sections: SongSection[]): SongSection[] {
  const sorted = [...sections].sort((a, b) => a.startTime - b.startTime);
  let vCount = 0;
  let cCount = 0;
  let bCount = 0;
  let iCount = 0;
  let oCount = 0;
  let pcCount = 0;

  return sorted.map((s) => {
    let newLabel = s.label;
    const type = s.type;

    if (type === 'verse') {
      vCount++;
      newLabel = `Verse ${vCount}`;
    } else if (type === 'chorus') {
      cCount++;
      newLabel = cCount === 1 ? 'Chorus/Hook' : `Chorus/Hook ${cCount}`;
    } else if (type === 'pre_chorus') {
      pcCount++;
      newLabel = pcCount === 1 ? 'Pre-Chorus/Pre-Hook' : `Pre-Chorus/Pre-Hook ${pcCount}`;
    } else if (type === 'bridge') {
      bCount++;
      newLabel = bCount === 1 ? 'Bridge' : `Bridge ${bCount}`;
    } else if (type === 'intro') {
      iCount++;
      newLabel = iCount === 1 ? 'Intro' : `Intro ${iCount}`;
    } else if (type === 'outro') {
      oCount++;
      newLabel = oCount === 1 ? 'Outro' : `Outro ${oCount}`;
    } else if (type === 'interlude') {
      newLabel = 'Interlude';
    } else if (type === 'instrumental_solo') {
      newLabel = 'Instrumental Solo';
    } else if (type === 'down_chorus' || type === 'post_chorus') {
      newLabel = 'Post-Chorus';
    } else if (type === 'custom') {
      if (!newLabel || newLabel === 'Section' || newLabel.startsWith('Verse ') || newLabel.startsWith('Chorus') || newLabel.startsWith('Intro') || newLabel.startsWith('Bridge')) {
        newLabel = 'Custom Section';
      }
    }

    return {
      ...s,
      label: newLabel,
    };
  });
}

