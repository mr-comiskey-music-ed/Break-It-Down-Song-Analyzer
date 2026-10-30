import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

export type SaveStatus = 'idle' | 'saved' | 'failed';

/** Small status label for the header: lets students see their work is being kept. */
export const SaveIndicator: React.FC<{ status: SaveStatus; savedAt: number | null }> = ({ status, savedAt }) => {
  if (status === 'idle') return null;
  if (status === 'failed') {
    return (
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
        title="This browser is blocking saving. Your work will be lost if you close this tab. Use Share to make a code and keep it."
      >
        <AlertTriangle className="w-3 h-3" />
        <span>Not saving</span>
      </div>
    );
  }
  const time = savedAt ? new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return (
    <div
      className="hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400"
      title="Your analysis is saved in this browser on this computer. You still turn in your code."
    >
      <Check className="w-3 h-3" />
      <span>Saved{time ? ` ${time}` : ''}</span>
    </div>
  );
};

/** Shown on load when this browser has a saved analysis from an earlier visit. */
export const RestorePrompt: React.FC<{ savedAt: number; onRestore: () => void; onStartFresh: () => void }> = ({
  savedAt,
  onRestore,
  onStartFresh,
}) => {
  const when = new Date(savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Restore your last session?</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Your analysis from {when} is saved in this browser. Restore it to pick up where you left off, or start over.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onRestore}
            className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-500 cursor-pointer"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={onStartFresh}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};
