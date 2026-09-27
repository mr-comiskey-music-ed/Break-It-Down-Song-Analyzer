import { SongMetadata, SongSection } from "../types";

const DEMO_1_STORAGE_KEY = "song_form_custom_demo_1_v1";
const DEMO_2_STORAGE_KEY = "song_form_custom_demo_2_v1";

export interface SavedDemoData {
  name: string;
  songMetadata: SongMetadata;
  sections: SongSection[];
  studentName?: string;
  savedAt: number;
}

// Embedded Demo 1: "Put Your Records On" by Corinne Bailey Rae
const EMBEDDED_DEMO_1: SavedDemoData = {
  name: "Put Your Records On - Corinne Bailey Rae",
  songMetadata: {
  "title": "Put Your Records On",
  "artist": "Corinne Bailey Rae",
  "album": "Self-Titled",
  "year": "2006",
  "genre": "Pop/R&B",
  "timeSignature": "4/4",
  "bpm": 96,
  "referenceBpm": 105,
  "youtubeUrl": "https://www.youtube.com/watch?v=cDrU3weV3_Y",
  "youtubeId": "cDrU3weV3_Y",
  "videoDuration": 238
},
  sections: [
  {
    "id": "sec-1788324258416-wnvj",
    "type": "intro",
    "label": "Intro",
    "startTime": 0,
    "endTime": 7.6,
    "calculatedBars": 4,
    "barExplanation": "Standard 4-bar introductory/concluding phrasing",
    "energyLevel": 4,
    "rhythmicDrive": 6,
    "vocalComplexity": 1,
    "hasVocals": false,
    "textureDensity": 4,
    "instrumentationNotes": "acoustic guitar, horn swell into verse",
    "color": "slate"
  },
  {
    "id": "sec-1788324262018-h35k",
    "type": "verse",
    "label": "Verse 1",
    "startTime": 7.6,
    "endTime": 27.6,
    "calculatedBars": 8,
    "barExplanation": "Standard pop length (8 bars)",
    "energyLevel": 4,
    "rhythmicDrive": 4,
    "vocalComplexity": 5,
    "hasVocals": true,
    "textureDensity": 5,
    "instrumentationNotes": "vocals, acoustic guitar, electric guitar, smooth drums, grooving bassline, radio effect vocals, backing vocals, shaker halfway through",
    "color": "blue",
    "modifiedScales": {
      "energyLevel": true,
      "rhythmicDrive": true
    }
  },
  {
    "id": "sec-1788324324353-waf6",
    "type": "pre_chorus",
    "label": "Pre-Chorus/Pre-Hook",
    "startTime": 27.6,
    "endTime": 47.8,
    "calculatedBars": 8,
    "barExplanation": "Standard pop length (8 bars)",
    "energyLevel": 6,
    "rhythmicDrive": 6,
    "vocalComplexity": 6,
    "hasVocals": true,
    "textureDensity": 4,
    "instrumentationNotes": "vocals, acoustic guitar, electric guitar, smooth drums, grooving bassline, backing vocals, organ, electric piano, tambourine",
    "color": "purple"
  },
  {
    "id": "sec-1788324351937-6640",
    "type": "chorus",
    "label": "Chorus/Hook",
    "startTime": 47.8,
    "endTime": 75,
    "calculatedBars": 12,
    "barExplanation": "12-bar phrase structure (common in blues & rock)",
    "energyLevel": 8,
    "rhythmicDrive": 8,
    "vocalComplexity": 9,
    "hasVocals": true,
    "textureDensity": 8,
    "instrumentationNotes": "vocals, acoustic guitar, electric guitar, smooth drums, grooving bassline, backing vocals, organ, electric piano, horns, cowbell",
    "color": "rose",
    "modifiedScales": {
      "energyLevel": true,
      "vocalComplexity": true,
      "textureDensity": true
    }
  },
  {
    "id": "sec-1788324365197-ewik",
    "type": "verse",
    "label": "Verse 2",
    "startTime": 75,
    "endTime": 95.2,
    "calculatedBars": 8,
    "barExplanation": "Standard pop length (8 bars)",
    "energyLevel": 5,
    "rhythmicDrive": 5,
    "vocalComplexity": 5,
    "hasVocals": true,
    "textureDensity": 5,
    "instrumentationNotes": "vocals, acoustic guitar, electric guitar, smooth drums, grooving bassline, radio effect vocals, backing vocals, shaker halfway through",
    "color": "blue",
    "modifiedScales": {
      "energyLevel": true,
      "rhythmicDrive": true,
      "vocalComplexity": true,
      "textureDensity": true
    }
  },
  {
    "id": "sec-1788324405010-7icg",
    "type": "pre_chorus",
    "label": "Pre-Chorus/Pre-Hook 2",
    "startTime": 95.2,
    "endTime": 115.2,
    "calculatedBars": 8,
    "barExplanation": "Standard pop length (8 bars)",
    "energyLevel": 6,
    "rhythmicDrive": 6,
    "vocalComplexity": 6,
    "hasVocals": true,
    "textureDensity": 4,
    "instrumentationNotes": "vocals, acoustic guitar, electric guitar, smooth drums, grooving bassline, backing vocals, organ, electric piano",
    "color": "purple"
  },
  {
    "id": "sec-1788324415778-m5tz",
    "type": "chorus",
    "label": "Chorus/Hook 2",
    "startTime": 115.2,
    "endTime": 140.2,
    "calculatedBars": 10,
    "barExplanation": "Multiple of 2 phrasing (10 bars)",
    "energyLevel": 8,
    "rhythmicDrive": 8,
    "vocalComplexity": 9,
    "hasVocals": true,
    "textureDensity": 8,
    "instrumentationNotes": "vocals, acoustic guitar, electric guitar, smooth drums, grooving bassline, backing vocals, organ, electric piano, horns, cowbell",
    "color": "rose"
  },
  {
    "id": "sec-1788324428275-bu4d",
    "type": "bridge",
    "label": "Bridge",
    "startTime": 140.2,
    "endTime": 160.2,
    "calculatedBars": 8,
    "barExplanation": "Standard pop length (8 bars)",
    "energyLevel": 6,
    "rhythmicDrive": 6,
    "vocalComplexity": 6,
    "hasVocals": true,
    "textureDensity": 4,
    "instrumentationNotes": "vocals, drums, electric guitar, classical guitar, string orchestra, chime transition into hook",
    "color": "emerald"
  },
  {
    "id": "sec-1788324447293-wbbe",
    "type": "chorus",
    "label": "Chorus/Hook 3",
    "startTime": 160.2,
    "endTime": 200.1,
    "calculatedBars": 16,
    "barExplanation": "Standard extended pop length (16 bars)",
    "energyLevel": 9,
    "rhythmicDrive": 9,
    "vocalComplexity": 9,
    "hasVocals": true,
    "textureDensity": 10,
    "instrumentationNotes": "vocals, acoustic guitar, electric guitar, smooth drums, grooving bassline, backing vocals, organ, electric piano, horns, cowbell, ad lib vocals",
    "color": "rose",
    "modifiedScales": {
      "energyLevel": true,
      "rhythmicDrive": true,
      "vocalComplexity": true,
      "textureDensity": true
    }
  },
  {
    "id": "sec-1788324480337-1jwv",
    "type": "outro",
    "label": "Outro",
    "startTime": 200.1,
    "endTime": 216,
    "calculatedBars": 6,
    "barExplanation": "2-bar divisible phrasing (6 bars)",
    "energyLevel": 6,
    "rhythmicDrive": 6,
    "vocalComplexity": 6,
    "hasVocals": true,
    "textureDensity": 4,
    "instrumentationNotes": "organ electric piano, guitar, vocals",
    "color": "slate"
  }
],
  studentName: "Student",
  savedAt: 1718000000000,
};

// Embedded Demo 2: "Musicology" by Prince
const EMBEDDED_DEMO_2: SavedDemoData = {
  name: "Musicology - Prince",
  songMetadata: {
  "title": "Musicology",
  "artist": "Prince",
  "album": "Musicology",
  "year": "2004",
  "genre": "Funk / R&B / Soul",
  "timeSignature": "4/4",
  "bpm": 99,
  "referenceBpm": 116,
  "youtubeUrl": "https://www.youtube.com/watch?v=qdmWbJ8ISP4",
  "youtubeId": "qdmWbJ8ISP4",
  "videoDuration": 238
},
  sections: [
  {
    "id": "sec-intro",
    "type": "intro",
    "label": "Intro",
    "startTime": 0,
    "endTime": 17,
    "calculatedBars": 8,
    "barExplanation": "Standard 8-bar phrasing",
    "energyLevel": 2,
    "rhythmicDrive": 5,
    "vocalComplexity": 1,
    "hasVocals": false,
    "textureDensity": 2,
    "instrumentationNotes": "grooving bassline, funk drums, vocal ad libs",
    "color": "slate",
    "modifiedScales": {
      "energyLevel": true,
      "textureDensity": true
    }
  },
  {
    "id": "sec-v1",
    "type": "verse",
    "label": "Verse 1",
    "startTime": 17,
    "endTime": 49.5,
    "calculatedBars": 12,
    "barExplanation": "12-bar phrase structure (common in blues & rock)",
    "energyLevel": 5,
    "rhythmicDrive": 5,
    "vocalComplexity": 4,
    "hasVocals": true,
    "textureDensity": 3,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs",
    "color": "blue",
    "modifiedScales": {
      "energyLevel": true,
      "rhythmicDrive": true,
      "vocalComplexity": true,
      "textureDensity": true
    }
  },
  {
    "id": "sec-1788314628534-eqe5",
    "type": "pre_chorus",
    "label": "Pre-Chorus/Pre-Hook",
    "startTime": 49.5,
    "endTime": 60,
    "calculatedBars": 4,
    "barExplanation": "Symmetrical multiple of 4 (4 bars)",
    "energyLevel": 5,
    "rhythmicDrive": 5,
    "vocalComplexity": 4,
    "hasVocals": true,
    "textureDensity": 3,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs",
    "color": "purple",
    "modifiedScales": {
      "energyLevel": true
    }
  },
  {
    "id": "sec-c1",
    "type": "chorus",
    "label": "Chorus/Hook",
    "startTime": 60,
    "endTime": 69.5,
    "calculatedBars": 4,
    "barExplanation": "Symmetrical multiple of 4 (4 bars)",
    "energyLevel": 7,
    "rhythmicDrive": 6,
    "vocalComplexity": 4,
    "hasVocals": true,
    "textureDensity": 4,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs, organ",
    "color": "rose",
    "modifiedScales": {
      "energyLevel": true,
      "textureDensity": true,
      "rhythmicDrive": true
    }
  },
  {
    "id": "sec-v2",
    "type": "verse",
    "label": "Verse 2",
    "startTime": 69.5,
    "endTime": 108,
    "calculatedBars": 16,
    "barExplanation": "Standard extended pop length (16 bars)",
    "energyLevel": 5,
    "rhythmicDrive": 5,
    "vocalComplexity": 5,
    "hasVocals": true,
    "textureDensity": 3,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs, organ, ad libs",
    "color": "blue",
    "modifiedScales": {
      "vocalComplexity": true,
      "energyLevel": true
    }
  },
  {
    "id": "sec-1788315049611-flfp",
    "type": "pre_chorus",
    "label": "Pre-Chorus/Pre-Hook 2",
    "startTime": 108,
    "endTime": 117,
    "calculatedBars": 4,
    "barExplanation": "Symmetrical multiple of 4 (4 bars)",
    "energyLevel": 6,
    "rhythmicDrive": 5,
    "vocalComplexity": 4,
    "hasVocals": true,
    "textureDensity": 3,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, additional horns & organ parts",
    "color": "purple",
    "modifiedScales": {
      "energyLevel": true
    }
  },
  {
    "id": "sec-c2",
    "type": "chorus",
    "label": "Chorus/Hook 2",
    "startTime": 117,
    "endTime": 127.5,
    "calculatedBars": 4,
    "barExplanation": "Symmetrical multiple of 4 (4 bars)",
    "energyLevel": 7,
    "rhythmicDrive": 6,
    "vocalComplexity": 4,
    "hasVocals": true,
    "textureDensity": 4,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs, organ, ",
    "color": "rose",
    "modifiedScales": {
      "energyLevel": true
    }
  },
  {
    "id": "sec-bridge",
    "type": "bridge",
    "label": "Bridge",
    "startTime": 127.5,
    "endTime": 137.2,
    "calculatedBars": 4,
    "barExplanation": "Symmetrical multiple of 4 (4 bars)",
    "energyLevel": 4,
    "rhythmicDrive": 5,
    "vocalComplexity": 2,
    "hasVocals": true,
    "textureDensity": 3,
    "instrumentationNotes": "Electronic+Acoustic drums doing a sort of tom fill.\nPrince yells at someone about touching his stereo + records.",
    "color": "emerald",
    "modifiedScales": {
      "vocalComplexity": true,
      "textureDensity": true,
      "energyLevel": true,
      "rhythmicDrive": true
    }
  },
  {
    "id": "sec-1788315456004-yju7",
    "type": "interlude",
    "label": "Interlude",
    "startTime": 137.2,
    "endTime": 155.5,
    "calculatedBars": 8,
    "barExplanation": "Standard pop length (8 bars)",
    "energyLevel": 5,
    "rhythmicDrive": 5,
    "vocalComplexity": 5,
    "hasVocals": true,
    "textureDensity": 3,
    "instrumentationNotes": "vocal ad libs, panning, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs, organ, ad libs",
    "color": "slate",
    "modifiedScales": {
      "energyLevel": true,
      "rhythmicDrive": true,
      "vocalComplexity": true
    }
  },
  {
    "id": "sec-c3",
    "type": "chorus",
    "label": "Chorus/Hook 3",
    "startTime": 155.5,
    "endTime": 174.4,
    "calculatedBars": 8,
    "barExplanation": "Standard pop length (8 bars)",
    "energyLevel": 7,
    "rhythmicDrive": 6,
    "vocalComplexity": 3,
    "hasVocals": true,
    "textureDensity": 6,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs, big lead synth ",
    "color": "rose",
    "modifiedScales": {
      "vocalComplexity": true,
      "textureDensity": true,
      "energyLevel": true
    }
  },
  {
    "id": "sec-1788314847248-hnbr",
    "type": "bridge",
    "label": "Bridge 2",
    "startTime": 174.4,
    "endTime": 183.4,
    "calculatedBars": 4,
    "barExplanation": "Symmetrical multiple of 4 (4 bars)",
    "energyLevel": 7,
    "rhythmicDrive": 6,
    "vocalComplexity": 3,
    "hasVocals": true,
    "textureDensity": 6,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs, big lead synth ",
    "color": "emerald"
  },
  {
    "id": "sec-1788314859910-ros3",
    "type": "custom",
    "label": "Breakdown",
    "startTime": 183,
    "endTime": 210,
    "calculatedBars": 12,
    "barExplanation": "12-bar phrase structure (common in blues & rock)",
    "energyLevel": 6,
    "rhythmicDrive": 6,
    "vocalComplexity": 6,
    "hasVocals": true,
    "textureDensity": 4,
    "instrumentationNotes": "Uses vocal ideas from the Pre-Chorus, chopped/pitch shifted vocal, drum tom fills from \"keep ya body\", organ, horn stabs",
    "color": "amber"
  },
  {
    "id": "sec-1788314809463-ku5c",
    "type": "pre_chorus",
    "label": "Pre-Chorus/Pre-Hook 3",
    "startTime": 210,
    "endTime": 219.9,
    "calculatedBars": 4,
    "barExplanation": "Symmetrical multiple of 4 (4 bars)",
    "energyLevel": 9,
    "rhythmicDrive": 8,
    "vocalComplexity": 6,
    "hasVocals": true,
    "textureDensity": 9,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs, big lead synth, loud organ",
    "color": "purple",
    "modifiedScales": {
      "textureDensity": true,
      "vocalComplexity": true
    }
  },
  {
    "id": "sec-1788319714847-xm1c",
    "type": "chorus",
    "label": "Chorus/Hook 4",
    "startTime": 219.9,
    "endTime": 226.7,
    "calculatedBars": 3,
    "barExplanation": "Calculated ~3 bars (4/4 @ 99 BPM)",
    "energyLevel": 9,
    "rhythmicDrive": 8,
    "vocalComplexity": 6,
    "hasVocals": true,
    "textureDensity": 9,
    "instrumentationNotes": "vocals, grooving bassline, funk drums, vocal ad libs, rhythm guitar, backing vocals, occasional horn stabs, big lead synth, loud organ",
    "color": "rose",
    "modifiedScales": {
      "energyLevel": true,
      "rhythmicDrive": true,
      "vocalComplexity": true,
      "textureDensity": true
    }
  },
  {
    "id": "sec-1788314825918-tfz2",
    "type": "outro",
    "label": "Outro",
    "startTime": 226.7,
    "endTime": 265,
    "calculatedBars": 16,
    "barExplanation": "4-bar symmetrical phrasing (16 bars)",
    "energyLevel": 6,
    "rhythmicDrive": 6,
    "vocalComplexity": 6,
    "hasVocals": true,
    "textureDensity": 4,
    "instrumentationNotes": "a cappella thing. Definitely a transition to the next song on the album. Snippets of his old songs. ",
    "color": "slate"
  }
],
  studentName: "Student",
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
          name: parsed.name || parsed.songMetadata.title || ("Custom Saved Demo " + slot),
          songMetadata: parsed.songMetadata,
          sections: parsed.sections,
          studentName: parsed.studentName,
          savedAt: parsed.savedAt,
        };
      }
    }
  } catch (err) {
    console.error("Error loading custom demo " + slot + " from storage:", err);
  }

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
      name: songMetadata.title ? (songMetadata.title + (songMetadata.artist ? " - " + songMetadata.artist : "")) : ("Demo " + slot),
      songMetadata,
      sections,
      studentName,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(demoPayload));
    return true;
  } catch (err) {
    console.error("Failed to save current inputs as demo " + slot + ":", err);
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
