import React from 'react';
import { X, Play, ArrowRightToLine, Layers } from 'lucide-react';
import { formatTimecode } from '../utils/musicTheory';

interface AddSectionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  endOfTimelineTime: number;
  onChooseCurrent: () => void;
  onChooseEnd: () => void;
}

export function AddSectionChoiceModal({
  isOpen,
  onClose,
  currentTime,
  endOfTimelineTime,
  onChooseCurrent,
  onChooseEnd,
}: AddSectionChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-800 dark:text-slate-100">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-['Outfit'] tracking-tight">
              Add New Section
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose where you would like to place the new section on the timeline.
            </p>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <button
            type="button"
            onClick={onChooseCurrent}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm font-['Outfit'] text-slate-800 dark:text-slate-200">
                  At Current Playhead
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Timecode: {formatTimecode(currentTime)}
                </div>
              </div>
            </div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Select &rarr;
            </div>
          </button>

          <button
            type="button"
            onClick={onChooseEnd}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                <ArrowRightToLine className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm font-['Outfit'] text-slate-800 dark:text-slate-200">
                  At End of Timeline
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Timecode: {formatTimecode(endOfTimelineTime)}
                </div>
              </div>
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Select &rarr;
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
