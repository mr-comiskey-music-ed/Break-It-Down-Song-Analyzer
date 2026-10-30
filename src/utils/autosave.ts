/**
 * Autosave: keeps a student's song analysis in THEIR OWN browser (localStorage) so closing the tab or
 * reloading doesn't lose it. Nothing is sent anywhere and the student's name is never saved (it lives only
 * inside the code they make to turn in). The analysis is stored in the same compact format as a student
 * code (src/utils/submissionCodec.ts), so it is checked for damage when it is read back.
 */

const KEY = 'breakitdown:v1:autosave';
const VERSION = 1;

export function loadSaved(): { code: string; savedAt: number } | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== VERSION || typeof parsed.code !== 'string' || !parsed.code) return null;
    return { code: parsed.code, savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now() };
  } catch {
    return null;
  }
}

/** Returns true if the save worked. */
export function writeSaved(code: string): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ v: VERSION, savedAt: Date.now(), code }));
    return true;
  } catch {
    return false;
  }
}

export function clearSaved(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
