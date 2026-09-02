import { SongMetadata, SongSection } from '../types';

export interface ShareState {
  songMetadata: SongMetadata;
  sections: SongSection[];
  completedAt?: string;
  studentName?: string;
}

export function encodeShareState(data: ShareState): string {
  try {
    const json = JSON.stringify(data);
    return encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
  } catch (err) {
    console.error('Failed to encode share state:', err);
    return '';
  }
}

export function decodeShareState(encoded: string): ShareState | null {
  try {
    const raw = decodeURIComponent(encoded);
    const json = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(json) as ShareState;
  } catch (err) {
    console.error('Failed to decode share state:', err);
    return null;
  }
}

export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard embed, watch, youtu.be, shorts, and query parameter variations
  const patterns = [
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?.*[?&]v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return trimmed;
}
