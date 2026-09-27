import { SongMetadata, SongSection, SectionType } from '../types';
import { PRESET_SONGS } from './genrePresets';
import { calculateSectionBars, SECTION_CONFIGS } from './musicTheory';

const DEMO_1_STORAGE_KEY = 'song_form_custom_demo_1_v1';
const DEMO_2_STORAGE_KEY = 'song_form_custom_demo_2_v1';

export interface SavedDemoData {
  name: string;
  songMetadata: SongMetadata;
  sections: SongSection[];
  studentName?: string;
  savedAt: number;
}

// Build Demo 1 from PRESET_SONGS[0] ("Put Your Records On")
const preset1 = PRESET_SONGS[0];
const EMBEDDED_DEMO_1: SavedDemoData = {
  name: `${preset1.title} - ${preset1.artist}`,
  songMetadata: {
    title: preset1.title,
    artist: preset1.artist,
    album: preset1.album,
    year: preset1.year,
    genre: preset1.genre,
    timeSignature: preset1.timeSignature,
    bpm: preset1.referenceBpm,
    referenceBpm: preset1.referenceBpm,
    youtubeUrl: preset1.youtubeUrl,
    youtubeId: preset1.youtubeId,
    videoDuration: 238,
  },
  sections: (preset1.prepopulatedSections || []).map((s, idx) => {
    const startTime = s.startTime || 0;
    const endTime = s.endTime || 14;
    const type = (s.type as SectionType) || 'verse';
    const calc = calculateSectionBars(
      endTime - startTime,
      preset1.referenceBpm,
      preset1.timeSignature,
      type,
      preset1.referenceBpm
    );
    return {
      id: s.id || `demo-1-sec-${idx}`,
      type,
      label: s.label || `Section ${idx + 1}`,
      startTime,
      endTime,
      calculatedBars: s.calculatedBars || calc.bars,
      barExplanation: s.barExplanation || calc.explanation,
      energyLevel: s.energyLevel || 6,
      rhythmicDrive: s.rhythmicDrive || 6,
      vocalComplexity: s.vocalComplexity || 6,
      hasVocals: s.hasVocals !== false,
      textureDensity: s.textureDensity || 5,
      instrumentationNotes: s.instrumentationNotes || '',
      color: SECTION_CONFIGS[type]?.colorName || 'indigo',
    };
  }),
  studentName: 'Student',
  savedAt: 1718000000000,
};

// Build Demo 2 from PRESET_SONGS[1] ("Musicology")
const preset2 = PRESET_SONGS[1];
const EMBEDDED_DEMO_2: SavedDemoData = {
  name: `${preset2.title} - ${preset2.artist}`,
  songMetadata: {
    title: preset2.title,
    artist: preset2.artist,
    album: preset2.album,
    year: preset2.year,
    genre: preset2.genre,
    timeSignature: preset2.timeSignature,
    bpm: preset2.referenceBpm,
    referenceBpm: preset2.referenceBpm,
    youtubeUrl: preset2.youtubeUrl,
    youtubeId: preset2.youtubeId,
    videoDuration: 238,
  },
  sections: (preset2.prepopulatedSections || []).map((s, idx) => {
    const startTime = s.startTime || 0;
    const endTime = s.endTime || 12;
    const type = (s.type as SectionType) || 'verse';
    const calc = calculateSectionBars(
      endTime - startTime,
      preset2.referenceBpm,
      preset2.timeSignature,
      type,
      preset2.referenceBpm
    );
    return {
      id: s.id || `demo-2-sec-${idx}`,
      type,
      label: s.label || `Section ${idx + 1}`,
      startTime,
      endTime,
      calculatedBars: s.calculatedBars || calc.bars,
      barExplanation: s.barExplanation || calc.explanation,
      energyLevel: s.energyLevel || 7,
      rhythmicDrive: s.rhythmicDrive || 8,
      vocalComplexity: s.vocalComplexity || 6,
      hasVocals: s.hasVocals !== false,
      textureDensity: s.textureDensity || 6,
      instrumentationNotes: s.instrumentationNotes || '',
      color: SECTION_CONFIGS[type]?.colorName || 'indigo',
    };
  }),
  studentName: 'Student',
  savedAt: 1718000000000,
};

/**
 * Checks if custom demo 1 or 2 has been saved or available
 */
export function hasCustomSavedDemo(slot: number = 1): boolean {
  try {
    return true;
  } catch {
    return true;
  }
}

/**
 * Gets a specific demo/example preset or saved custom demo by slot (1 or 2)
 */
export function getDemoExampleBySlot(slot: number = 1): {
  isCustom: boolean;
  name: string;
  songMetadata: SongMetadata;
  sections: SongSection[];
  studentName?: string;
  savedAt?: number;
} {
  const storageKey = slot === 2 ? DEMO_2_STORAGE_KEY : DEMO_1_STORAGE_KEY;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed: SavedDemoData = JSON.parse(raw);
      if (parsed && parsed.songMetadata && Array.isArray(parsed.sections)) {
        return {
          isCustom: true,
          name: parsed.name || parsed.songMetadata.title || `Custom Saved Demo ${slot}`,
          songMetadata: parsed.songMetadata,
          sections: parsed.sections,
          studentName: parsed.studentName,
          savedAt: parsed.savedAt,
        };
      }
    }
  } catch (err) {
    console.error(`Error loading custom demo ${slot} from storage:`, err);
  }

  // Fallback to embedded demo 1 ("Put Your Records On") or demo 2 ("Musicology")
  const embedded = slot === 2 ? EMBEDDED_DEMO_2 : EMBEDDED_DEMO_1;
  return {
    isCustom: true,
    name: embedded.name,
    songMetadata: embedded.songMetadata,
    sections: embedded.sections,
    studentName: embedded.studentName,
    savedAt: embedded.savedAt,
  };
}

/**
 * Gets the active demo (defaults to Demo 1 if available or default preset)
 */
export function getActiveDemoExample(): {
  isCustom: boolean;
  name: string;
  songMetadata: SongMetadata;
  sections: SongSection[];
  studentName?: string;
  savedAt?: number;
} {
  return getDemoExampleBySlot(1);
}

/**
 * Saves current inputs into demo slot 1 or 2
 */
export function saveCurrentInputsAsDemo(
  songMetadata: SongMetadata,
  sections: SongSection[],
  slot: number = 1,
  studentName?: string
): boolean {
  try {
    const storageKey = slot === 2 ? DEMO_2_STORAGE_KEY : DEMO_1_STORAGE_KEY;
    const demoPayload: SavedDemoData = {
      name: songMetadata.title ? `${songMetadata.title}${songMetadata.artist ? ` - ${songMetadata.artist}` : ''}` : `Demo ${slot}`,
      songMetadata,
      sections,
      studentName,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(demoPayload));
    return true;
  } catch (err) {
    console.error(`Failed to save current inputs as demo ${slot}:`, err);
    return false;
  }
}

/**
 * Resets demo slot 1 or 2 back to default preset
 */
export function resetDemoToDefault(slot: number = 1): boolean {
  try {
    const storageKey = slot === 2 ? DEMO_2_STORAGE_KEY : DEMO_1_STORAGE_KEY;
    localStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}
