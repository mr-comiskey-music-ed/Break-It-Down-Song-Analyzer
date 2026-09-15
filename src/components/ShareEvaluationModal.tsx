import React, { useState, useEffect } from 'react';
import { SongMetadata, SongSection, AssignmentEvaluation } from '../types';
import { encodeShareState, decodeShareState, cC, ShareState } from '../utils/sharePayload';
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
  Youtube,
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
  onLoadIntoMainWorkspace?: (imported: { songMetadata: SongMetadata; sections: SongSection[]; studentName?: string }) => void;
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
  onLoadIntoMainWorkspace,
}: ShareEvaluationModalProps) {
  const [evaluation, setEvaluation] = useState<AssignmentEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [overrideShare, setOverrideShare] = useState(false);
  const [importLinkInput, setImportLinkInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [teacherCodeError, setTeacherCodeError] = useState<string | null>(null);
  const [verifiedReportData, setVerifiedReportData] = useState<ShareState | null>(null);

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
      setImportError('Please paste a valid share link or assignment code.');
      return;
    }
    const decoded = cC(importLinkInput.trim());
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
      setImportError('Invalid or corrupted submission code/link. Please check the code and try again.');
    }
  };

  const handleVerifyTeacherCode = async () => {
    setTeacherCodeError(null);
    let codeToVerify = teacherCodeInput.trim();
    if (!codeToVerify) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          codeToVerify = text.trim();
          setTeacherCodeInput(codeToVerify);
        }
      } catch {
        // clipboard access may be restricted
      }
    }
    if (!codeToVerify) {
      setTeacherCodeError('Please paste a student submission code or click Paste & Verify Grade to read from clipboard.');
      return;
    }
    const verified = cC(codeToVerify);
    if (verified && verified.songMetadata && verified.sections) {
      setVerifiedReportData(verified);
    } else {
      setTeacherCodeError('⚠️ Invalid or tampered submission code. Please check the code and try again.');
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
            ) : verifiedReportData ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <h3 className="text-lg font-bold font-['Outfit']">Verified Student Grade Report</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerifiedReportData(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Back to Check
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider">Student Name:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {verifiedReportData.studentName || 'Unnamed Student'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider">Submitted:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {verifiedReportData.completedAt ? new Date(verifiedReportData.completedAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider">Song Analyzed:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {verifiedReportData.songMetadata.title || 'Untitled'} by {verifiedReportData.songMetadata.artist || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider">Tempo & Sections:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {verifiedReportData.songMetadata.bpm || '---'} BPM • {verifiedReportData.sections.length} Sections Mapped
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs">
                  <p className="font-bold mb-0.5">Tamper-Proof Signature Verified ✓</p>
                  <p className="opacity-90">
                    All timeline bar calculations, section mappings, and instrument descriptions are intact and authentic.
                  </p>
                </div>

                {/* Detailed Section Breakdown List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Detailed Section Breakdown ({verifiedReportData.sections.length} Mapped Sections):
                  </h4>
                  <div className="max-h-52 overflow-y-auto pr-1 space-y-2">
                    {verifiedReportData.sections.map((sec, idx) => (
                      <div key={sec.id || idx} className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            {idx + 1}. {sec.label}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {Math.floor(sec.startTime / 60)}:{Math.floor(sec.startTime % 60).toString().padStart(2, '0')} - {Math.floor(sec.endTime / 60)}:{Math.floor(sec.endTime % 60).toString().padStart(2, '0')} ({sec.barCount || '?'} bars)
                          </span>
                        </div>
                        {sec.instrumentationNotes && (
                          <p className="text-slate-600 dark:text-slate-300 italic">
                            <span className="font-semibold not-italic text-slate-700 dark:text-slate-200">Instruments:</span> {sec.instrumentationNotes}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span>Energy: <strong className="text-indigo-600 dark:text-indigo-400">{sec.energyLevel !== undefined ? sec.energyLevel : 5}/10</strong></span>
                          <span>Rhythm: <strong className="text-indigo-600 dark:text-indigo-400">{sec.rhythmicDrive !== undefined ? sec.rhythmicDrive : 5}/10</strong></span>
                          <span>Vocals: <strong className="text-indigo-600 dark:text-indigo-400">{sec.vocalComplexity !== undefined ? sec.vocalComplexity : 5}/10</strong></span>
                          <span>Texture: <strong className="text-indigo-600 dark:text-indigo-400">{sec.textureDensity !== undefined ? sec.textureDensity : 5}/10</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onLoadIntoMainWorkspace) {
                        onLoadIntoMainWorkspace({
                          songMetadata: verifiedReportData.songMetadata,
                          sections: verifiedReportData.sections,
                          studentName: verifiedReportData.studentName,
                        });
                      }
                      setVerifiedReportData(null);
                      onClose();
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Youtube className="w-4 h-4 text-indigo-200" />
                    <span>Open Full Analysis in Main Workspace (Re-import Student Work)</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onImportComparison) {
                          onImportComparison({
                            songMetadata: verifiedReportData.songMetadata,
                            sections: verifiedReportData.sections,
                            studentName: verifiedReportData.studentName,
                          });
                        }
                        setVerifiedReportData(null);
                        onClose();
                      }}
                      className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <GitCompare className="w-4 h-4" />
                      <span>Compare with My Song</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerifiedReportData(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Back to Check
                    </button>
                  </div>
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

                {/* Submission Code Box & Copy Code button (Google Apps Script iframe friendly) */}
                <div className="space-y-2 p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl">
                  <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Assignment Submission Code:
                  </label>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Copy this code and paste it into your Google Classroom assignment or send it to your teacher.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={encodedData}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(encodedData);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2500);
                        } catch {
                          // fallback
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>



                {/* Compare With Another Song (Responsive to code or link) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Compare With Another Song (Paste Share Link or Code):
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
                </div>

                {/* Teacher Code Check section at the bottom of the Grade Report pop up */}
                <div className="pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Teacher Code Check
                    </h4>
                  </div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Paste Student Submission Code or Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={teacherCodeInput}
                      onChange={(e) => {
                        setTeacherCodeInput(e.target.value);
                        setTeacherCodeError(null);
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        if (pasted) {
                          setTimeout(() => {
                            const verified = cC(pasted);
                            if (verified) {
                              setVerifiedReportData(verified);
                            } else {
                              setTeacherCodeError('⚠️ Invalid or tampered submission code. Please check the code and try again.');
                            }
                          }, 50);
                        }
                      }}
                      placeholder="Paste student base64 submission code here..."
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyTeacherCode}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Paste & Verify Grade</span>
                    </button>
                  </div>
                  {teacherCodeError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                      {teacherCodeError}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Instantly decodes and verifies student assignment submissions without relying on URL query strings.
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
