import React, { useState, useEffect } from 'react';
import { SongMetadata, SongSection, AssignmentEvaluation } from '../types';
import { ShareState, parseSubmissionCode } from '../utils/sharePayload';
import { encodeSubmission, encodeForLink } from '../utils/submissionCodec';
import { evaluateAssignment } from '../utils/evaluation';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  Sparkles,
  Layers,
  ListChecks,
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
  onOpenBatchGrade?: () => void;
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
  onOpenBatchGrade,
}: ShareEvaluationModalProps) {
  const [evaluation, setEvaluation] = useState<AssignmentEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
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

    const result = evaluateAssignment(songMetadata, sections, tapTempoUsed);
    setEvaluation(result);
    setIsLoading(false);
    if (result.isThorough) {
      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, songMetadata, sections, tapTempoUsed]);

  if (!isOpen) return null;

  // Generate shareable link
  const shareState: ShareState = {
    songMetadata,
    sections,
    studentName: studentName.trim() || 'Student',
    completedAt: new Date().toISOString(),
    tapTempoUsed,
  };

  const encodedData = encodeSubmission(shareState);
  const shareUrl = `${window.location.origin}${window.location.pathname}#assignment=${encodeForLink(shareState)}`;

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
    const decoded = parseSubmissionCode(importLinkInput.trim());
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

                {/* Teacher: grade a whole class from pasted codes */}
                {onOpenBatchGrade && (
                  <div className="pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBatchGrade();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ListChecks className="w-4 h-4" />
                      <span>Teacher: Batch Grade a Class</span>
                    </button>
                  </div>
                )}

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
