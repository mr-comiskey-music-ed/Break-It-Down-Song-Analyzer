export type SectionType =
  | 'intro'
  | 'verse'
  | 'pre_chorus'
  | 'chorus'
  | 'bridge'
  | 'outro'
  | 'interlude'
  | 'instrumental_solo'
  | 'custom'
  | 'down_chorus'
  | 'post_chorus';

export interface SectionTypeConfig {
  type: SectionType;
  defaultLabel: string;
  badgeLabel: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  typicalBars: number;
}

export interface SongMetadata {
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  timeSignature: string;
  bpm: number | '';
  referenceBpm?: number | null;
  youtubeUrl: string;
  youtubeId: string;
  videoDuration: number;
  tapCount?: number;
  songStartTime?: number; // in seconds, clips video intro skit/lead-in
  songEndTime?: number; // in seconds, clips video outro credits
}

export interface SongSection {
  id: string;
  type: SectionType;
  label: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  calculatedBars: number;
  barExplanation: string;
  energyLevel: number; // 1 - 10
  rhythmicDrive: number; // 1 - 10
  vocalComplexity: number; // 1 - 10
  hasVocals: boolean;
  textureDensity: number; // 1 - 10
  instrumentationNotes: string;
  color: string;
  modifiedScales?: {
    energyLevel?: boolean;
    rhythmicDrive?: boolean;
    vocalComplexity?: boolean;
    textureDensity?: boolean;
  };
}

export interface AssignmentEvaluation {
  status: 'excellent' | 'needs_work';
  isThorough: boolean;
  score: number;
  feedbackItems: string[];
  encouragement: string;
  summaryReport: string;
}

export interface PresetSong {
  name: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  referenceBpm: number;
  timeSignature: string;
  youtubeId: string;
  youtubeUrl: string;
  description: string;
  prepopulatedSections?: Partial<SongSection>[];
}

export interface SectionAnalysisData {
  energyLevel: number;
  rhythmicDrive: number;
  vocalComplexity: number;
  hasVocals: boolean;
  textureDensity: number;
  instrumentationNotes: string;
  sourceLabel?: string;
}
