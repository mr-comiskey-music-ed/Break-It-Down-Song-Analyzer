import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Share2,
  HelpCircle,
  RotateCcw,
  GraduationCap,
  Save,
  BookmarkCheck,
  ChevronDown,
  Undo2,
  Redo2,
  Play,
  Square,
  Pause,
  Download,
} from 'lucide-react';

interface HeaderProps {
  onOpenTutorial: () => void;
  onOpenShare: () => void;
  onReset: () => void;
  onLoadDemo: () => void;
  onLoadSecondDemo?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSharedView: boolean;
  studentName?: string;
  sectionCount: number;
  hasCustomDemo?: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  isShareButtonHighlighted?: boolean;
}

export function Header({
  onOpenTutorial,
  onOpenShare,
  onReset,
  onLoadDemo,
  onLoadSecondDemo,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isSharedView,
  studentName,
  sectionCount,
  hasCustomDemo,
  isPlaying = false,
  onTogglePlay,
  isShareButtonHighlighted = false,
}: HeaderProps) {
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div 
            className="relative p-1.5 bg-slate-900 text-white rounded-xl shadow-md flex items-center justify-center overflow-hidden border border-slate-700/50 w-11 h-11"
          >
            {/* Background 5 vertical stripes with uniform section boundary lines */}
            <div className="absolute inset-0 flex">
              <div className="w-1 bg-slate-500 border-r border-white/40" title="Intro" />
              <div className="flex-[2] bg-blue-500 border-r border-white/40" title="Verse" />
              <div className="flex-[1.8] bg-rose-500 border-r border-white/40" title="Chorus" />
              <div className="flex-[1.2] bg-emerald-500 border-r border-white/40" title="Bridge" />
              <div className="w-1 bg-slate-400" title="Outro" />
            </div>

            {/* Subtle transparent overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-950/15 to-transparent pointer-events-none" />

            
            {/* Icon on top: Piece of paper with music notes */}
            <svg className="relative z-10 w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 1H5a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7z" fill="currentColor" fillOpacity="0.3" strokeWidth="2.2" />
              <path d="M15 1v6h6" strokeWidth="2.2" />
              
              {/* Staff lines (5 lines) */}
              <line x1="5" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
              <line x1="5" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
              <line x1="5" y1="13" x2="19" y2="13" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
              <line x1="5" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
              <line x1="5" y1="17" x2="19" y2="17" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />

              {/* Music notes */}
              <path d="M8.5 17V10l6-2v7" strokeWidth="1.8" />
              <circle cx="7" cy="17" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="13" cy="15" r="1.4" fill="currentColor" stroke="none" />
            </svg>

            {/* Hover download overlay */}
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Download className="w-5 h-5 text-white animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900 dark:text-slate-100 tracking-tight">
                Break-It-Down Song Analyzer
              </h1>
              {isSharedView && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Submission by {studentName || 'Student'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Identify verse-chorus structures, tap tempo, calculate bars, and map instrumentation changes.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 relative">
          {/* Demo Dropdown / Quick Load */}
          {!isSharedView && (
            <div className="relative">
              <button
                id="header-demo-menu-btn"
                type="button"
                onClick={() => setShowDemoMenu((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
                title="Load or save the demo/example walkthrough"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden md:inline">Demo/Example</span>
                {hasCustomDemo && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Custom demo active" />
                )}
                <ChevronDown className="w-3 h-3 text-indigo-500" />
              </button>

              {showDemoMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDemoMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      Demo / Example Slots
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onLoadDemo();
                        setShowDemoMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <div>
                        <p className="font-bold">Demo 1: Put Your Records On</p>
                        <p className="text-[10px] text-slate-400">Corinne Bailey Rae • 96 BPM Soul / R&B</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onLoadSecondDemo) onLoadSecondDemo();
                        setShowDemoMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <div>
                        <p className="font-bold">Demo 2: Musicology</p>
                        <p className="text-[10px] text-slate-400">Prince • 116 BPM Funk / R&B</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tutorial / Walkthrough */}
          <button
            id="header-tutorial-btn"
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Open step-by-step tutorial with Musicology"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Tutorial Walkthrough</span>
            <span className="sm:hidden">Tutorial</span>
          </button>

          {/* Start / Stop Button (Mobile & Tablet screens) */}
          {onTogglePlay && (
            <button
              id="header-mobile-start-stop-btn"
              type="button"
              onClick={onTogglePlay}
              className={`inline-flex lg:hidden items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98 ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={isPlaying ? 'Stop playback (Spacebar)' : 'Start playback (Spacebar)'}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </>
              )}
            </button>
          )}

          {/* New Song Analysis button */}
          {!isSharedView && (
            <button
              id="header-new-song-btn"
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Clear current entries and start analyzing a new song"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>New Song Analysis</span>
            </button>
          )}

          {/* Share / Submit Assignment */}
          <div className="relative">
            {isShareButtonHighlighted && (
              <div className="absolute -top-7 right-0 z-30 bg-amber-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce pointer-events-none whitespace-nowrap">
                <span>💡 Step 4</span>
              </div>
            )}
            <button
              id="header-share-btn"
              type="button"
              onClick={onOpenShare}
              className={`inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-98 ${isShareButtonHighlighted ? 'ring-4 ring-amber-500/80 dark:ring-amber-400/80 shadow-2xl shadow-amber-500/30 scale-105' : ''}`}
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharedView ? 'Share / Copy Report' : 'Share & Submit'}</span>
              {sectionCount > 0 && (
                <span className="hidden md:inline px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                  {sectionCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

