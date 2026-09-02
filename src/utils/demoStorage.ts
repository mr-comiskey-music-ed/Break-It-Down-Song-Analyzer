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

/**
 * Checks if custom demo 1 or 2 has been saved
 */
export function hasCustomSavedDemo(slot: number = 1): boolean {
  try {
    const key = slot === 2 ? DEMO_2_STORAGE_KEY : DEMO_1_STORAGE_KEY;
    return !!localStorage.getItem(key);
  } catch {
    return false;
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

  // Fallback to built-in preset (slot 1 -> index 0 "Musicology", slot 2 -> index 1 "Hey Ya!")
  const presetIndex = slot === 2 ? 1 : 0;
  const preset = PRESET_SONGS[presetIndex] || PRESET_SONGS[0];
  const metadata: SongMetadata = {
    title: preset.title,
    artist: preset.artist,
    album: preset.album,
    year: preset.year,
    genre: preset.genre,
    timeSignature: preset.timeSignature,
    bpm: preset.referenceBpm,
    referenceBpm: preset.referenceBpm,
    youtubeUrl: preset.youtubeUrl,
    youtubeId: preset.youtubeId,
    videoDuration: presetIndex === 1 ? 215 : 238,
  };

  const sections: SongSection[] = (preset.prepopulatedSections || []).map((s, idx) => {
    const startTime = s.startTime || 0;
    const endTime = s.endTime || 14;
    const type = (s.type as SectionType) || 'verse';
    const calc = calculateSectionBars(
      endTime - startTime,
      preset.referenceBpm,
      preset.timeSignature,
      type,
      preset.referenceBpm
    );

    return {
      id: s.id || `demo-${slot}-sec-${idx}`,
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
  });

  return {
    isCustom: false,
    name: preset.title,
    songMetadata: metadata,
    sections,
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
