import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Music, Activity, Layers, Share2, X, Play } from 'lucide-react';
import { SongSection, SongMetadata } from '../types';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExampleSong: (fullAnalysis: boolean, demoSlot?: number) => void;
  currentSongTitle?: string;
  hasSections?: boolean;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function TutorialModal({
  isOpen,
  onClose,
  onLoadExampleSong,
  currentStep,
  onStepChange,
}: TutorialModalProps) {
  if (!isOpen) return null;

  const tutorialSteps = [
    {
      title: 'Welcome to the Break-It-Down Song Analyzer!',
      subtitle: 'Map and analyze song structures easily',
      icon: 'logo',
      color: 'bg-indigo-600',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Popular music is constructed from building blocks like Verses, Choruses, Bridges, etc. The structure of song sections is also called the "Form" of a song.
          </p>
          <p>
            This app helps you map out song arrangements, find tempos, calculate bar counts, and track musical energy over time.
          </p>
        </div>
      ),
    },
    {
      title: 'Step 1: Video & Tap Tempo',
      subtitle: 'Paste YouTube link & find the beat',
      icon: Activity,
      color: 'bg-amber-600',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="text-xs sm:text-sm">
            Paste any YouTube video link at the top. The video loads directly inside the app for seamless listening.
          </p>
          <p className="text-xs sm:text-sm">
            Fill out the Song Information or click the button to auto-find song info.
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/40">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs uppercase mb-1">
              Tap Tempo Tool:
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Listen to the steady pulse and tap the <strong>TAP TEMPO</strong> button in rhythm to record the BPM.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Step 2: Marking Sections',
      subtitle: 'Capture transitions in real-time',
      icon: Layers,
      color: 'bg-rose-600',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Play the track and click <strong>Mark Section</strong> the exact moment you hear a section change (e.g. Verse into Chorus).
          </p>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 space-y-1.5">
            <h4 className="font-bold text-rose-900 dark:text-rose-200 text-xs uppercase flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current text-rose-600" />
              Timeline Control:
            </h4>
            <p className="text-xs text-rose-900 dark:text-rose-300">
              Drag vertical boundary lines on the timeline to fine-tune start and end timestamps, or click any section to jump playback instantly.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Step 3: Ratings & Instrumentation',
      subtitle: 'Track energy, rhythm, and instruments',
      icon: Sparkles,
      color: 'bg-emerald-600',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="text-xs sm:text-sm">
            Rate each section's excitement, rhythmic drive, and density using the 4 interactive sliders.
          </p>
          <p className="text-xs sm:text-sm">
            List all instrumentation you hear in each section with the help of instrument suggestions generated based on the genre of the song.
          </p>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
            <p className="text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
              💡 <strong>Tip:</strong> You can copy and paste analysis between sections to save time.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Step 4: Submit Assignment',
      subtitle: 'Turn in your completed work',
      icon: Share2,
      color: 'bg-purple-600',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            When finished, generate a direct shareable web link to submit your work to your teacher or class portal.
          </p>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/40">
            <p className="text-xs text-purple-900 dark:text-purple-200">
              Ready to explore? Choose below to open <strong>Demo 1: Put Your Records On</strong>, <strong>Demo 2: Musicology</strong>, or start analyzing a new song!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = tutorialSteps[currentStep] || tutorialSteps[0];
  const StepIcon = current.icon;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className={`fixed z-50 pointer-events-auto transition-all duration-300 ${
      currentStep === 0
        ? 'inset-0 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200'
        : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300'
    }`}>
      <div className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-800 dark:text-slate-100 flex flex-col justify-between max-h-[85vh] overflow-y-auto ring-1 ring-slate-900/5 ${
        currentStep === 0 ? 'w-full max-w-lg' : 'w-full'
      }`}>
        <button
          onClick={onClose}
          aria-label="Close tutorial"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator & Header */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
              Tutorial Walkthrough
            </span>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {tutorialSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-6 bg-indigo-600'
                      : 'w-2 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className={`${current.icon === 'logo' ? 'relative p-1 bg-slate-900 text-white rounded-xl shadow-md flex items-center justify-center overflow-hidden border border-slate-700/50 w-12 h-12 shrink-0' : `p-3 text-white rounded-xl shadow-xs shrink-0 ${current.color}`}`}>
              {current.icon === 'logo' ? (
                <>
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
                  <svg className="relative z-10 w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
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
                </>
              ) : (
                <StepIcon className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight">
                {current.title}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {current.subtitle}
              </p>
            </div>
          </div>

          {/* Content Body */}
          <div className="mb-6">{current.content}</div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => onStepChange(currentStep - 1)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <button
                type="button"
                onClick={() => onStepChange(currentStep + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onLoadExampleSong(true, 1);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Demo 1: Put Your Records On</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLoadExampleSong(true, 2);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Demo 2: Musicology</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLoadExampleSong(false, 1);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <span>Start Fresh</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
