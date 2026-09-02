import { Sparkles, Music, Play, Layers, ArrowRight, X } from 'lucide-react';

interface InitialGuidePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  onQuickAddIntro: () => void;
}

export function InitialGuidePopup({
  isOpen,
  onClose,
  onStartTutorial,
  onQuickAddIntro,
}: InitialGuidePopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          aria-label="Close guide"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight">
              Welcome to Break-It-Down Song Analyzer!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interactive timeline & instrumentation mapping
            </p>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
          Ready to break down the structure of your favorite song? Here is how to complete your assignment in 3 easy steps:
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Embed YouTube Video & Tap the Tempo
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paste a YouTube link, then use the <strong>Tap Tempo</strong> button to find your song's BPM.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Add Sections to the Timeline
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Click <strong className="text-indigo-600 dark:text-indigo-400">+ Add Section</strong> to add sections (Intro, Verse, Chorus/Hook, Bridge). As the video plays, click at timecodes to mark section changes!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Rate Sliders & Note Instrumentation Changes
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Use the energy, rhythm, and vocal sliders, then use quick instrument tags to list what instruments enter or drop out.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            id="start-tutorial-btn"
            onClick={() => {
              onClose();
              onStartTutorial();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Try "Musicology" Tutorial
          </button>

          <button
            id="start-blank-btn"
            onClick={() => {
              onClose();
              onQuickAddIntro();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-medium text-sm transition-colors"
          >
            <Play className="w-4 h-4" />
            Start with Blank Song
          </button>
        </div>

        <div className="mt-4 text-center">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Space</kbd> anytime to play/pause the video.
          </span>
        </div>
      </div>
    </div>
  );
}
