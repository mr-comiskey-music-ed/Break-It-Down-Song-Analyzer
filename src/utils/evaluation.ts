import { AssignmentEvaluation, SongMetadata, SongSection } from '../types';

/**
 * Checks a student's analysis against the assignment requirements.
 * Runs entirely in the browser: nothing is sent anywhere.
 */
export function evaluateAssignment(
  songMetadata: SongMetadata,
  sections: SongSection[],
  tapTempoUsed: boolean
): AssignmentEvaluation {
  const issues: string[] = [];
  const sectionCount = sections.length;

  if (!songMetadata.title || songMetadata.title.trim().length === 0) {
    issues.push('Song Title is missing in the header box. Please enter the exact title of the song you are analyzing.');
  }
  if (!songMetadata.artist || songMetadata.artist.trim().length === 0) {
    issues.push('Artist name is missing in the header box. Please credit the recording artist or band.');
  }
  if (!songMetadata.bpm || Number(songMetadata.bpm) <= 0) {
    issues.push('Tempo (BPM) is not entered in the header box.');
  }
  if (!tapTempoUsed) {
    issues.push("Tap Tempo tool was not used. Please click the Tap Tempo button and tap along with the beat (at least 4 taps) to find your song's tempo.");
  }
  if (sectionCount < 4) {
    issues.push(`You have mapped ${sectionCount} section(s) on your timeline. To perform a thorough structural analysis, please map at least 4 distinct song sections (e.g., Intro, Verse, Chorus, Bridge, Outro).`);
  }

  let missingInstruments = 0;
  let shortInstruments = 0;
  sections.forEach((s) => {
    const notes = (s.instrumentationNotes || '').trim();
    if (notes.length === 0) missingInstruments++;
    else if (notes.length < 5) shortInstruments++;
  });
  if (missingInstruments > 0) {
    issues.push(`You have ${missingInstruments} section(s) with empty instrument information boxes. Every instrument box must describe what instruments are playing.`);
  } else if (shortInstruments > 0) {
    issues.push(`Some instrument notes are too brief (${shortInstruments} section(s)). Expand your descriptions to detail specific instruments (e.g., lead vocals, rhythm guitar, synths, drums).`);
  }

  const totalScales = sectionCount * 4;
  let labeledScalesCount = 0;
  sections.forEach((s) => {
    if (s.modifiedScales?.energyLevel) labeledScalesCount++;
    if (s.modifiedScales?.rhythmicDrive) labeledScalesCount++;
    if (s.modifiedScales?.vocalComplexity) labeledScalesCount++;
    if (s.modifiedScales?.textureDensity) labeledScalesCount++;
  });
  const requiredLabeled = Math.ceil(totalScales * 0.75);
  if (labeledScalesCount < requiredLabeled) {
    issues.push(
      `You have labeled ${labeledScalesCount} out of ${totalScales} song characteristics. Use the Energy, Rhythm, Vocals, and Texture sliders on each section card to describe what you hear in that section (aim to label at least 75%).`
    );
  }

  const isThorough = issues.length === 0 && sectionCount >= 4;
  const score = isThorough
    ? Math.min(100, 92 + (sectionCount >= 5 ? 5 : 0) + (labeledScalesCount >= totalScales ? 3 : 0))
    : Math.max(40, 80 - issues.length * 12);

  return {
    status: isThorough ? 'excellent' : 'needs_work',
    isThorough,
    score,
    feedbackItems:
      issues.length > 0
        ? issues
        : [
            'All song header information and tap tempo completed.',
            `Timeline maps ${sectionCount} song sections with bar counts.`,
            'Every instrument box is filled in and the section characteristics are labeled with the sliders.',
          ],
    encouragement: isThorough
      ? "Exceptional work! You showed a thorough understanding of this song's structure, dynamics, and instrumentation."
      : 'Your analysis needs more depth. Review the recommendations above to strengthen your song form analysis.',
    summaryReport: `Analyzed "${songMetadata.title || 'Song'}" by ${songMetadata.artist || 'Artist'} across ${sectionCount} sections (${songMetadata.bpm || 120} BPM in ${songMetadata.timeSignature || '4/4'}).`,
  };
}
