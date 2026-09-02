import React, { useState, useEffect } from 'react';
import { SongMetadata, SongSection, AssignmentEvaluation } from '../types';
import { encodeShareState, decodeShareState, ShareState } from '../utils/sharePayload';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  Sparkles,
  Layers,
  ExternalLink,
  RotateCcw,
  X,
  GitCompare,
} from 'lucide-react';

interface ShareEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  songMetadata: SongMetadata;
  sections: SongSection[];
  studentName: string;
  onStudentNameChange: (name: string) => void;
  tapTempoUsed: boolean;
  onImportComparison?: (imported: { songMetadata: SongMetadata; sections: SongSection[]; studentName?: string }) => void;
}

export function ShareEvaluationModal({
  isOpen,
  onClose,
  songMetadata,
  sections,
  studentName,
  onStudentNameChange,
  tapTempoUsed,
  onImportComparison,
}: ShareEvaluationModalProps) {
  const [evaluation, setEvaluation] = useState<AssignmentEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [overrideShare, setOverrideShare] = useState(false);
  const [importLinkInput, setImportLinkInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEvaluation(null);
      setIsLoading(true);
      setOverrideShare(false);
      return;
    }

    const runEvaluation = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/evaluate-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songData: songMetadata,
            sections,
            tapTempoUsed,
          }),
        });

        if (res.ok) {
          const data: AssignmentEvaluation = await res.json();
          setEvaluation(data);

          if (data.isThorough) {
            // Trigger celebratory confetti
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        } else {
          throw new Error('Evaluation request failed');
        }
      } catch (err) {
        console.warn('Using client-side fallback evaluation:', err);
        // Rigorous evaluation matching server standards
        const issues: string[] = [];
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
          issues.push('Tap Tempo tool was not used. Please click the Tap Tempo button to physically tap along with the beat and calculate your song\'s accurate tempo.');
        }
        if (sections.length < 4) {
          issues.push(`You have mapped ${sections.length} section(s) on your timeline. To perform a thorough structural analysis, please map at least 4 distinct song sections (e.g., Intro, Verse, Chorus, Bridge, Outro).`);
        }

        let missingInstruments = 0;
        let shortInstruments = 0;
        sections.forEach((s: any) => {
          if (!s.instrumentationNotes || s.instrumentationNotes.trim().length === 0) {
            missingInstruments++;
          } else if (s.instrumentationNotes.trim().length < 5) {
            shortInstruments++;
          }
        });
        if (missingInstruments > 0) {
          issues.push(`You have ${missingInstruments} section(s) with empty instrument information boxes. Every instrument box must describe what instruments are playing.`);
        } else if (shortInstruments > 0) {
          issues.push(`Some instrument notes are too brief (${shortInstruments} section(s)). Expand your descriptions to detail specific instruments (e.g., lead vocals, rhythm guitar, synths, drums).`);
        }

        let totalScales = sections.length * 4;
        let modifiedScalesCount = 0;
        sections.forEach((s: any) => {
          if (s.modifiedScales?.energyLevel) modifiedScalesCount++;
          if (s.modifiedScales?.rhythmicDrive) modifiedScalesCount++;
          if (s.modifiedScales?.vocalComplexity) modifiedScalesCount++;
          if (s.modifiedScales?.textureDensity) modifiedScalesCount++;
        });
        const requiredModified = Math.ceil(totalScales * 0.75);
        if (modifiedScalesCount < requiredModified) {
          issues.push(`You have only modified ${modifiedScalesCount} out of ${totalScales} linear analysis scales (sliders). Please carefully adjust the Energy, Rhythm, Vocals, and Texture sliders on the majority of your section cards to reflect how the music changes.`);
        }

        const isThorough = issues.length === 0 && sections.length >= 4;
        setEvaluation({
          status: isThorough ? 'excellent' : 'needs_work',
          isThorough,
          score: isThorough ? 96 : 68,
          feedbackItems: issues.length > 0 ? issues : ['All song header fields and tap tempo completed', `Timeline comprehensively maps ${sections.length} sections`, 'All instrument boxes and linear scales thoroughly analyzed'],
          encouragement: isThorough
            ? "Exceptional work! You demonstrated a comprehensive, rigorous understanding of the song's structural arrangement, dynamics, and instrumentation."
            : 'Your analysis needs more depth. Review the specific recommendations above to improve your song form analysis quality.',
          summaryReport: `Rigorously analyzed "${songMetadata.title || 'Song'}" by ${songMetadata.artist || 'Artist'} across ${sections.length} sections (${songMetadata.bpm || 120} BPM).`,
        });

        if (isThorough) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    runEvaluation();
  }, [isOpen, songMetadata, sections, tapTempoUsed]);

  if (!isOpen) return null;

  // Generate shareable link
  const shareState: ShareState = {
    songMetadata,
    sections,
    studentName: studentName.trim() || 'Student',
    completedAt: new Date().toISOString(),
  };

  const encodedData = encodeShareState(shareState);
  const shareUrl = `${window.location.origin}${window.location.pathname}#assignment=${encodedData}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleImportShareLink = () => {
    setImportError(null);
    if (!importLinkInput.trim()) {
      setImportError('Please paste a valid share link or payload.');
      return;
    }
    let encoded = importLinkInput.trim();
    if (encoded.includes('assignment=')) {
      const parts = encoded.split('assignment=');
      encoded = parts[parts.length - 1];
    }
    const decoded = decodeShareState(encoded);
    if (decoded && decoded.songMetadata && decoded.sections) {
      if (onImportComparison) {
        onImportComparison({
          songMetadata: decoded.songMetadata,
          sections: decoded.sections,
          studentName: decoded.studentName,
        });
      }
      onClose();
    } else {
      setImportError('Invalid or corrupted share link. Please check the link and try again.');
    }
  };

  const isThorough = evaluation?.isThorough || false;
  const allowSharing = isThorough || overrideShare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close share dialog"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Sparkles className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
            <h3 className="text-lg font-bold font-['Outfit']">
              Evaluating Your Song Form Analysis...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Checking header boxes, tap tempo, bar calculations, and instrumentation depth.
            </p>
          </div>
        ) : (
          <div>
            {/* Header Result Badge */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`p-3 rounded-2xl text-white shadow-md shrink-0 ${
                  isThorough ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                {isThorough ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight">
                    {isThorough ? 'Great Work on Your Analysis!' : 'Assignment Completion Feedback'}
                  </h3>
                  {evaluation?.score && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                      {evaluation.score}/100
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {evaluation?.summaryReport}
                </p>
              </div>
            </div>

            {/* Praise or Constructive Feedback */}
            <div
              className={`p-4 rounded-xl border mb-5 ${
                isThorough
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200'
              }`}
            >
              <p className="text-sm font-semibold mb-2">
                {evaluation?.encouragement}
              </p>

              {evaluation?.feedbackItems && evaluation.feedbackItems.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                    {isThorough ? 'Key Highlights:' : 'Areas to Improve Before Submitting:'}
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                    {evaluation.feedbackItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Prompt Requirement Check: If incomplete/rushed, give "Keep Working" vs "Share Anyway" */}
            {!isThorough && !overrideShare ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Would you like to finish the items above?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Adding more details to your instrumentation list will help you get full credit on your assignment.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Keep Working</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideShare(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Share Anyway</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Share link & Google Classroom export section */
              <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                {/* Student Name field for submission */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name (for Teacher grading):
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => onStudentNameChange(e.target.value)}
                    placeholder="Enter your first & last name"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                {/* 1. Share URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Assignment Share Link (for Google Classroom):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Anyone with this link can open and grade your exact timeline, bar counts, and notes.
                  </p>
                </div>



                {/* 3. Paste & Import someone else's share link to compare side-by-side */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Compare With Another Song (Paste Share Link):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={importLinkInput}
                      onChange={(e) => setImportLinkInput(e.target.value)}
                      placeholder="Paste peer's share link or assignment code here..."
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <button
                      type="button"
                      onClick={handleImportShareLink}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Import & Compare</span>
                    </button>
                  </div>
                  {importError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{importError}</p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Pasting a link will launch a side-by-side comparison view against your current song.
                  </p>
                </div>

                {/* Close Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
