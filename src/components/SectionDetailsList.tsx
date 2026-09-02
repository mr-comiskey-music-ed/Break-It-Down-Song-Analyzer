import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SongSection, SectionAnalysisData, SectionType } from '../types';
import { SectionDetailCard } from './SectionDetailCard';
import { Layers, Plus, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';

interface SectionDetailsListProps {
  sections: SongSection[];
  genre?: string;
  timeSignature: string;
  bpm: number | '';
  selectedSectionId: string | null;
  currentTime?: number;
  isPlaying?: boolean;
  onUpdateSection: (id: string, updated: Partial<SongSection>) => void;
  onUpdateAllSectionsOfType?: (type: SectionType, color: string) => void;
  onDeleteSection: (id: string) => void;
  onPlaySection: (section: SongSection) => void;
  onAddSectionClick: () => void;
  onCopyAnalysis: (sourceSection: SongSection) => void;
  onPasteAnalysis: (targetSectionId: string) => void;
  copiedAnalysis: SectionAnalysisData | null;
  isHighlighted?: boolean;
}

export function SectionDetailsList({
  sections,
  genre,
  timeSignature,
  bpm,
  selectedSectionId,
  currentTime = 0,
  isPlaying = false,
  onUpdateSection,
  onUpdateAllSectionsOfType,
  onDeleteSection,
  onPlaySection,
  onAddSectionClick,
  onCopyAnalysis,
  onPasteAnalysis,
  copiedAnalysis,
  isHighlighted = false,
}: SectionDetailsListProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Inactivity / Edits Tracker (15-second idle requirement)
  const lastActivityTimeRef = useRef<number>(Date.now());
  const prevActiveSectionIdRef = useRef<string | null>(null);
  const lastScrolledSectionIdRef = useRef<string | null>(null);

  const recordActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
  }, []);

  // Update activity timestamp whenever data/props are edited
  useEffect(() => {
    recordActivity();
  }, [sections, bpm, timeSignature, genre, recordActivity]);

  // Global user interaction listener (throttled pointer movement, clicks, touches, keys, input)
  useEffect(() => {
    let lastMove = 0;
    const handleMove = () => {
      const now = Date.now();
      if (now - lastMove > 800) {
        lastMove = now;
        recordActivity();
      }
    };

    const handleAction = () => {
      recordActivity();
    };

    window.addEventListener('pointerdown', handleAction, { passive: true });
    window.addEventListener('mousedown', handleAction, { passive: true });
    window.addEventListener('keydown', handleAction, { passive: true });
    window.addEventListener('touchstart', handleAction, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('wheel', handleAction, { passive: true });
    window.addEventListener('input', handleAction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleAction);
      window.removeEventListener('mousedown', handleAction);
      window.removeEventListener('keydown', handleAction);
      window.removeEventListener('touchstart', handleAction);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('wheel', handleAction);
      window.removeEventListener('input', handleAction);
    };
  }, [recordActivity]);

  // Identify currently playing section
  const activeSectionId = sections.find(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  )?.id || null;

  // Auto-scroll when currently playing section transitions during active playback
  // ONLY skip to the now playing card when there hasn't been any activity or edits in 15 seconds (15000 ms)
  useEffect(() => {
    if (!isPlaying || !activeSectionId) {
      if (!activeSectionId) {
        prevActiveSectionIdRef.current = null;
        lastScrolledSectionIdRef.current = null;
      }
      return;
    }

    const checkAndScrollToActiveCard = () => {
      const now = Date.now();
      const idleDuration = now - lastActivityTimeRef.current;
      const isIdleFor15Seconds = idleDuration >= 15000;

      if (isIdleFor15Seconds && lastScrolledSectionIdRef.current !== activeSectionId) {
        const cardEl = document.getElementById(`section-card-wrapper-${activeSectionId}`);
        if (cardEl && scrollContainerRef.current) {
          lastScrolledSectionIdRef.current = activeSectionId;
          const container = scrollContainerRef.current;
          const containerRect = container.getBoundingClientRect();
          const cardRect = cardEl.getBoundingClientRect();
          const scrollLeft = container.scrollLeft;
          const targetScrollLeft = scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width / 2) + (cardRect.width / 2);
          container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
        }
      }
    };

    // If section changed, record transition and check if idle
    if (activeSectionId !== prevActiveSectionIdRef.current) {
      prevActiveSectionIdRef.current = activeSectionId;
      checkAndScrollToActiveCard();
    }

    // Interval to check if 15 seconds of idle elapsed while still playing in current section
    const interval = setInterval(() => {
      checkAndScrollToActiveCard();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSectionId, isPlaying]);

  // Check scroll position to enable/disable arrow buttons
  const checkScrollBounds = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollBounds();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollBounds);
      window.addEventListener('resize', checkScrollBounds);
      return () => {
        el.removeEventListener('scroll', checkScrollBounds);
        window.removeEventListener('resize', checkScrollBounds);
      };
    }
  }, [sections]);

  // When selectedSectionId changes (e.g. clicked on top timeline), scroll horizontally into view smoothly without vertical page jump
  useEffect(() => {
    if (selectedSectionId && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardEl = document.getElementById(`section-card-wrapper-${selectedSectionId}`);
      if (cardEl) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = cardEl.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const targetScrollLeft = scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width / 2) + (cardRect.width / 2);
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedSectionId]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -380, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 380, behavior: 'smooth' });
    }
  };

  if (sections.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center relative transition-all duration-300 ${isHighlighted ? 'ring-4 ring-amber-500/80 dark:ring-amber-400/80 shadow-2xl shadow-amber-500/25' : ''}`}>
        {isHighlighted && (
          <div className="absolute -top-3.5 right-4 z-30 bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none">
            <span>💡 Step 3</span>
          </div>
        )}
        <div className="max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit']">
            No Section Details Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
            As you add sections (Intro, Verse, Chorus/Hook, Bridge) on the timeline above, detailed cards will populate in a horizontal scrollable row to analyze each section's energy, rhythm, vocals, and instruments.
          </p>
          <button
            type="button"
            onClick={onAddSectionClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add First Section (Intro)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 relative transition-all duration-300 ${isHighlighted ? 'p-4 bg-amber-50/30 dark:bg-amber-950/20 ring-4 ring-amber-500/80 dark:ring-amber-400/80 shadow-2xl shadow-amber-500/25 rounded-2xl' : ''}`}>
      {isHighlighted && (
        <div className="absolute -top-3.5 right-4 z-30 bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none">
          <span>💡 Step 3</span>
        </div>
      )}
      {/* Section Details Header with Left/Right Carousel Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit'] flex items-center gap-2">
              Section Instrumentation & Linear Scale Analysis
              <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                ({sections.length} Section Card{sections.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Swipe left/right or double-click timecodes to edit. Analyze dynamics across each song section.
            </p>
          </div>
        </div>

        {/* Carousel Navigation Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mr-1">
            <ArrowLeftRight className="w-3 h-3" />
            <span>Swipe or scroll horizontally</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                canScrollLeft
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-2xs'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Scroll cards left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              disabled={!canScrollRight}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                canScrollRight
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-2xs'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Scroll cards right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable / Swipeable Row of Section Detail Cards (Prompt Requirement!) */}
      <div className="relative group">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 focus:outline-none"
          style={{ scrollbarWidth: 'thin' }}
        >
          {sections.map((section) => (
            <div
              key={section.id}
              id={`section-card-wrapper-${section.id}`}
              className="w-[300px] sm:w-[360px] md:w-[390px] shrink-0 snap-start flex flex-col"
            >
              <SectionDetailCard
                section={section}
                onCopyAnalysis={() => onCopyAnalysis(section)}
                onPasteAnalysis={() => onPasteAnalysis(section.id)}
                copiedAnalysis={copiedAnalysis}
                genre={genre}
                timeSignature={timeSignature}
                bpm={bpm}
                isSelected={selectedSectionId === section.id}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onUpdate={(updated) => onUpdateSection(section.id, updated)}
                onUpdateAllOfType={(color) => onUpdateAllSectionsOfType?.(section.type, color)}
                onDelete={() => onDeleteSection(section.id)}
                onPlaySection={() => onPlaySection(section)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

