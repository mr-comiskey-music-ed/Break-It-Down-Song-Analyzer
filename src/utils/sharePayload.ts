import { SongMetadata, SongSection } from '../types';

export interface ShareState {
  songMetadata: SongMetadata;
  sections: SongSection[];
  completedAt?: string;
  studentName?: string;
}

// UTF-8 safe base64 helpers (no deprecated escape/unescape).
// The output format is unchanged, so codes made before this update still load.
function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShareState(data: ShareState): string {
  try {
    return encodeURIComponent(utf8ToBase64(JSON.stringify(data)));
  } catch (err) {
    console.error('Failed to encode share state:', err);
    return '';
  }
}

export function decodeShareState(encoded: string): ShareState | null {
  try {
    // Remove any spaces or line breaks added when a code is pasted or copied
    // through Google Classroom, email, or a chat window.
    const cleaned = encoded.replace(/\s+/g, '');
    const raw = decodeURIComponent(cleaned);
    return JSON.parse(base64ToUtf8(raw)) as ShareState;
  } catch (err) {
    console.error('Failed to decode share state:', err);
    return null;
  }
}

function isValidShareState(state: ShareState | null): state is ShareState {
  if (!state || typeof state !== 'object') return false;
  if (!state.songMetadata || typeof state.songMetadata !== 'object') return false;
  if (!Array.isArray(state.sections)) return false;
  return state.sections.every(
    (s) =>
      s &&
      typeof s === 'object' &&
      Number.isFinite(s.startTime) &&
      Number.isFinite(s.endTime)
  );
}

/**
 * Reads a student submission code, or a full share link containing one.
 * Returns null if the text can't be read as a submission.
 */
export function parseSubmissionCode(input: string): ShareState | null {
  if (!input) return null;
  let trimmed = input.trim();
  if (trimmed.includes('assignment=')) {
    const parts = trimmed.split('assignment=');
    trimmed = parts[parts.length - 1];
  }
  const decoded = decodeShareState(trimmed);
  return isValidShareState(decoded) ? decoded : null;
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
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
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
