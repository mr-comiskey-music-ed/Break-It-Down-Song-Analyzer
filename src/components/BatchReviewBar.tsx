import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ListChecks, LogOut, Eye } from 'lucide-react';
import { BatchEntry } from '../utils/batchGrading';

interface BatchReviewBarProps {
  entry: BatchEntry;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onBackToList: () => void;
  onExit: () => void;
}

export const BatchReviewBar: React.FC<BatchReviewBarProps> = ({ entry, position, total, onPrev, onNext, onBackToList, onExit }) => {
  // Alt + left/right arrow steps through students. (Plain arrows scrub the video.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft' && position > 0) {
        e.preventDefault();
        onPrev();
      }
      if (e.key === 'ArrowRight' && position < total - 1) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [position, total, onPrev, onNext]);

  const { score, isThorough } = entry.evaluation;
  const color = isThorough
    ? 'text-emerald-700 dark:text-emerald-300 border-emerald-400'
    : score >= 70
      ? 'text-amber-700 dark:text-amber-300 border-amber-400'
      : 'text-rose-700 dark:text-rose-300 border-rose-400';
  const btn =
    'p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-32px)]">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 dark:bg-slate-900/95 border border-emerald-400 dark:border-emerald-700 shadow-2xl backdrop-blur-xl text-xs text-slate-700 dark:text-slate-200">
        <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-slate-500 dark:text-slate-400 shrink-0">
          {position + 1} of {total}
        </span>
        <span className="font-bold truncate max-w-[160px]">{entry.submission.studentName || 'Unnamed student'}</span>
        <span className={`font-bold px-2 py-0.5 rounded-full border ${color} shrink-0`}>{score}</span>
        <button onClick={onPrev} disabled={position === 0} className={btn} title="Previous student (Alt + ←)">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={onNext} disabled={position >= total - 1} className={btn} title="Next student (Alt + →)">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={onBackToList} className={`${btn} px-2.5 flex items-center gap-1 font-bold`} title="Back to class list">
          <ListChecks className="w-4 h-4" /> <span className="hidden sm:inline">Class list</span>
        </button>
        <button
          onClick={onExit}
          className="px-2.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer shrink-0"
          title="Stop reviewing and return to your own workspace"
        >
          <LogOut className="w-3.5 h-3.5" /> Done
        </button>
      </div>
    </div>
  );
};
