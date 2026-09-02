import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SongSection, SectionType } from '../types';
import { SECTION_CONFIGS, formatTimecode, getSectionColorTheme } from '../utils/musicTheory';
import { TimelineWaveformOverlay } from './TimelineWaveformOverlay';
import { motion } from 'motion/react';
import {
  SwellingCrescendo,
  WavingHand,
  TurningBook,
  FlickeringFlame,
  SpinningMilestone,
  PauseIconAnim,
  RockHand,
  DownChorusIcon,
} from './SectionIcons';
import {
  Plus,
  PlusCircle,
  Play,
  Volume2,
  Trash2,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Flag,
  Scissors,
  RotateCcw,
  Flame,
  GitBranch,
  BookOpen,
  Milestone,
  Hand,
  Layers,
  Eye,
  Tag,
  Star,
  Bookmark,
  ArrowRight,
  Activity,
  Zap,
  TrendingUp,
  ArrowDown,
  Clock,
} from 'lucide-react';

interface TimelineVisualizerProps {
  sections: SongSection[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  bpm: number | '';
  timeSignature: string;
  referenceBpm?: number | null;
  songStartTime?: number;
  songEndTime?: number;
  onSectionClick: (section: SongSection) => void;
  onSeek?: (seconds: number) => void;
  onAddSectionClick: () => void;
  onUpdateBoundary: (index: number, newTime: number) => void;
  onUpdateFirstSectionStart?: (newTime: number) => void;
  onUpdateLastSectionEnd?: (newTime: number) => void;
  onDeleteSection: (id: string) => void;
  onSelectSectionForDetails: (id: string) => void;
  selectedSectionId: string | null;
  onUpdateSongStart?: (time: number) => void;
  onUpdateSongEnd?: (time: number) => void;
  onSetSongStartAtCurrent?: () => void;
  onSetSongEndAtCurrent?: () => void;
  isHighlighted?: boolean;
}

export function TimelineVisualizer({
  sections,
  currentTime,
  duration,
  isPlaying,
  bpm,
  timeSignature,
  referenceBpm,
  songStartTime = 0,
  songEndTime,
  onSectionClick,
  onSeek,
  onAddSectionClick,
  onUpdateBoundary,
  onUpdateFirstSectionStart,
  onUpdateLastSectionEnd,
  onDeleteSection,
  onSelectSectionForDetails,
  selectedSectionId,
  onUpdateSongStart,
  onUpdateSongEnd,
  onSetSongStartAtCurrent,
  onSetSongEndAtCurrent,
  isHighlighted = false,
}: TimelineVisualizerProps) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const seekbarRef = useRef<HTMLDivElement | null>(null);
  const [draggingType, setDraggingType] = useState<
    'boundary' | 'firstSectionStart' | 'lastSectionEnd' | 'songStart' | 'songEnd' | 'playhead' | null
  >(null);
  const [draggingBoundaryIndex, setDraggingBoundaryIndex] = useState<number | null>(null);
  const [hoveredBoundaryIndex, setHoveredBoundaryIndex] = useState<number | null>(null);
  const [hoveredBoundaryEdge, setHoveredBoundaryEdge] = useState<'firstSectionStart' | 'lastSectionEnd' | null>(null);
  const [hoveredSpecialHandle, setHoveredSpecialHandle] = useState<'start' | 'end' | null>(null);
  const [isHoveringPlayhead, setIsHoveringPlayhead] = useState(false);
  const [isHoveringSeekBar, setIsHoveringSeekBar] = useState(false);
  const [hoveredTimelineTime, setHoveredTimelineTime] = useState<number | null>(null);
  const [isHoveringRuler, setIsHoveringRuler] = useState(false);
  const [showWaveform, setShowWaveform] = useState(true);
  const [waveformOpacity, setWaveformOpacity] = useState(0.7);

  // Total timeline span (at least max of duration or latest section endTime or 200s)
  const maxSectionTime = sections.length > 0 ? sections[sections.length - 1].endTime : 0;
  const totalTimelineDuration = Math.max(duration > 0 ? duration : 240, maxSectionTime + 10, 180);

  const effectiveSongStart = Math.max(0, Math.min(songStartTime, totalTimelineDuration - 5));
  const effectiveSongEnd = songEndTime !== undefined && songEndTime > effectiveSongStart
    ? Math.min(songEndTime, totalTimelineDuration)
    : (maxSectionTime > 0 ? maxSectionTime : (duration > 0 ? duration : totalTimelineDuration));

  const songLengthSeconds = Math.max(0, effectiveSongEnd - effectiveSongStart);


  // Handle boundary dragging between sections
  const handleBoundaryMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingType('boundary');
    setDraggingBoundaryIndex(index);
  };

  // Handle dragging the start boundary of the first section
  const handleFirstSectionStartMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingType('firstSectionStart');
  };

  // Handle dragging the end boundary of the last section
  const handleLastSectionEndMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingType('lastSectionEnd');
  };

  // Handle Song Start dragging
  const handleSongStartMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingType('songStart');
  };

  // Handle Song End dragging
  const handleSongEndMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingType('songEnd');
  };

  // Handle Playhead Scrub dragging
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingType('playhead');
  };

  const calculateTimeFromX = useCallback(
    (clientX: number) => {
      const container = seekbarRef.current || timelineRef.current || rulerRef.current;
      if (!container) return 0;
      const rect = container.getBoundingClientRect();
      const mouseX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const targetDuration = duration > 0 ? duration : totalTimelineDuration;
      const rawTime = (mouseX / rect.width) * totalTimelineDuration;
      const clampedTime = Math.max(0, Math.min(targetDuration, rawTime));
      return Math.round(clampedTime * 10) / 10;
    },
    [duration, totalTimelineDuration]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingType) return;

      if (draggingType === 'playhead') {
        const newSeekTime = calculateTimeFromX(e.clientX);
        if (onSeek) {
          onSeek(newSeekTime);
        }
        return;
      }

      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const rawTime = (mouseX / rect.width) * totalTimelineDuration;
      const newTime = Math.round(rawTime * 2) / 2;

      if (draggingType === 'boundary' && draggingBoundaryIndex !== null) {
        const prevSection = sections[draggingBoundaryIndex];
        const nextSection = sections[draggingBoundaryIndex + 1];

        if (prevSection && nextSection) {
          const minTime = prevSection.startTime + 1;
          const maxTime = nextSection.endTime - 1;
          const clampedTime = Math.max(minTime, Math.min(maxTime, newTime));
          onUpdateBoundary(draggingBoundaryIndex, clampedTime);
        }
      } else if (draggingType === 'firstSectionStart' && onUpdateFirstSectionStart && sections.length > 0) {
        const firstSection = sections[0];
        const minTime = 0;
        const maxTime = Math.max(0, firstSection.endTime - 0.5);
        const clampedTime = Math.max(minTime, Math.min(maxTime, newTime));
        onUpdateFirstSectionStart(clampedTime);
      } else if (draggingType === 'lastSectionEnd' && onUpdateLastSectionEnd && sections.length > 0) {
        const lastSection = sections[sections.length - 1];
        const minTime = lastSection.startTime + 0.5;
        const targetDuration = duration > 0 ? duration : totalTimelineDuration;
        const maxTime = targetDuration;
        const clampedTime = Math.max(minTime, Math.min(maxTime, newTime));
        onUpdateLastSectionEnd(clampedTime);
      } else if (draggingType === 'songStart' && onUpdateSongStart) {
        const minTime = 0;
        const maxTime = Math.max(0, effectiveSongEnd - 5);
        const clamped = Math.max(minTime, Math.min(maxTime, newTime));
        onUpdateSongStart(clamped);
      } else if (draggingType === 'songEnd' && onUpdateSongEnd) {
        const minTime = effectiveSongStart + 5;
        const maxTime = totalTimelineDuration;
        const clamped = Math.max(minTime, Math.min(maxTime, newTime));
        onUpdateSongEnd(clamped);
      }
    },
    [
      draggingType,
      draggingBoundaryIndex,
      sections,
      totalTimelineDuration,
      effectiveSongStart,
      effectiveSongEnd,
      duration,
      calculateTimeFromX,
      onSeek,
      onUpdateBoundary,
      onUpdateFirstSectionStart,
      onUpdateLastSectionEnd,
      onUpdateSongStart,
      onUpdateSongEnd,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingType(null);
    setDraggingBoundaryIndex(null);
  }, []);

  useEffect(() => {
    if (draggingType !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingType, handleMouseMove, handleMouseUp]);

  // Click on ruler to jump video playback
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const seekTime = calculateTimeFromX(e.clientX);
    if (onSeek) {
      onSeek(seekTime);
    }
    // Also select section if within one
    const clickedSec = sections.find((s) => seekTime >= s.startTime && seekTime < s.endTime);
    if (clickedSec) {
      onSelectSectionForDetails(clickedSec.id);
    }
  };

  // Click or drag anywhere on the yellow seek bar (scrub and scroll like YouTube player)
  const handleSeekBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const seekTime = calculateTimeFromX(e.clientX);
    if (onSeek) {
      onSeek(seekTime);
    }
    setDraggingType('playhead');
    const clickedSec = sections.find((s) => seekTime >= s.startTime && seekTime < s.endTime);
    if (clickedSec) {
      onSelectSectionForDetails(clickedSec.id);
    }
  };

  const handleSeekBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const hoverTime = calculateTimeFromX(e.clientX);
    setHoveredTimelineTime(hoverTime);
  };

  // Click on empty timeline space or background to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingType) return;
    const seekTime = calculateTimeFromX(e.clientX);
    if (onSeek) {
      onSeek(seekTime);
    }
    // Find if a section contains this time
    const clickedSec = sections.find((s) => seekTime >= s.startTime && seekTime < s.endTime);
    if (clickedSec) {
      onSelectSectionForDetails(clickedSec.id);
    }
  };

  // Hover tracker for timeline and ruler
  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const hoverTime = calculateTimeFromX(e.clientX);
    setHoveredTimelineTime(hoverTime);
  };

  const handleContainerMouseLeave = () => {
    setHoveredTimelineTime(null);
    setIsHoveringRuler(false);
  };

  // Generate tick markers
  const tickInterval = totalTimelineDuration > 300 ? 30 : 15;
  const tickCount = Math.floor(totalTimelineDuration / tickInterval);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval);

  const hasIntroTrim = effectiveSongStart > 1;
  const hasOutroTrim = effectiveSongEnd < totalTimelineDuration - 2;

  const playheadPct = Math.min(100, Math.max(0, (currentTime / totalTimelineDuration) * 100));



  // Helper to determine structural pillar status
  const getStructuralInfo = (type: SectionType) => {
    switch (type) {
      case 'intro':
        return {
          isPillar: true,
          label: 'Intro',
          shortLabel: 'Intro',
          color: 'slate',
          flagBg: 'bg-slate-700 text-white border-slate-500',
          pinLine: 'border-slate-400/50',
          glowRing: 'ring-slate-400',
          icon: WavingHand,
        };
      case 'verse':
        return {
          isPillar: true,
          label: 'Verse',
          shortLabel: 'Verse',
          color: 'blue',
          flagBg: 'bg-blue-600 text-white border-blue-400',
          pinLine: 'border-blue-500/70',
          glowRing: 'ring-blue-400',
          icon: TurningBook,
        };
      case 'pre_chorus':
        return {
          isPillar: true,
          label: 'Pre-Chorus',
          shortLabel: 'Pre-Chorus',
          color: 'purple',
          flagBg: 'bg-purple-600 text-white border-purple-400 shadow-purple-500/20',
          pinLine: 'border-purple-500/80',
          glowRing: 'ring-purple-400',
          icon: SwellingCrescendo,
        };
      case 'chorus':
        return {
          isPillar: true,
          label: 'Chorus',
          shortLabel: 'Chorus',
          color: 'rose',
          flagBg: 'bg-gradient-to-r from-rose-600 to-amber-500 text-white border-rose-300 shadow-rose-500/30',
          pinLine: 'border-rose-500/80',
          glowRing: 'ring-rose-400',
          icon: FlickeringFlame,
        };
      case 'bridge':
        return {
          isPillar: true,
          label: 'Bridge',
          shortLabel: 'Bridge',
          color: 'emerald',
          flagBg: 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30',
          pinLine: 'border-emerald-500/80',
          glowRing: 'ring-emerald-400',
          icon: SpinningMilestone,
        };
      case 'interlude':
        return {
          isPillar: true,
          label: 'Interlude',
          shortLabel: 'Interlude',
          color: 'slate',
          flagBg: 'bg-slate-700 text-white border-slate-500',
          pinLine: 'border-slate-400/50',
          glowRing: 'ring-slate-400',
          icon: PauseIconAnim,
        };
      case 'instrumental_solo':
        return {
          isPillar: true,
          label: 'Solo',
          shortLabel: 'Solo',
          color: 'orange',
          flagBg: 'bg-orange-600 text-white border-orange-400 shadow-orange-500/20',
          pinLine: 'border-orange-500/80',
          glowRing: 'ring-orange-400',
          icon: RockHand,
        };
      case 'down_chorus':
      case 'post_chorus':
        return {
          isPillar: true,
          label: 'Post-Chorus',
          shortLabel: 'Post-Chorus',
          color: 'pink',
          flagBg: 'bg-pink-600 text-white border-pink-400 shadow-pink-500/20',
          pinLine: 'border-pink-500/80',
          glowRing: 'ring-pink-400',
          icon: DownChorusIcon,
        };
      case 'custom':
        return {
          isPillar: true,
          label: 'Custom',
          shortLabel: 'Custom',
          color: 'amber',
          flagBg: 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20',
          pinLine: 'border-amber-500/80',
          glowRing: 'ring-amber-400',
          icon: Tag,
        };
      case 'outro':
        return {
          isPillar: true,
          label: 'Outro',
          shortLabel: 'Outro',
          color: 'slate',
          flagBg: 'bg-slate-700 text-white border-slate-500',
          pinLine: 'border-slate-400/50',
          glowRing: 'ring-slate-400',
          icon: WavingHand,
        };
      default:
        return {
          isPillar: false,
          label: type,
          shortLabel: type,
          color: 'slate',
          flagBg: 'bg-slate-700 text-white border-slate-500',
          pinLine: 'border-slate-400/50',
          glowRing: 'ring-slate-400',
          icon: null,
        };
    }
  };

  const isBoundaryZoomed = draggingType === 'boundary' && draggingBoundaryIndex !== null;
  const zoomedBoundaryTime = isBoundaryZoomed && draggingBoundaryIndex !== null && sections[draggingBoundaryIndex]
    ? sections[draggingBoundaryIndex].endTime
    : 0;
  const zoomedBoundaryPct = (zoomedBoundaryTime / totalTimelineDuration) * 100;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-5 transition-all flex flex-col gap-3.5 relative ${isHighlighted ? 'ring-4 ring-amber-500/80 dark:ring-amber-400/80 shadow-2xl shadow-amber-500/25' : ''}`}>
      {isHighlighted && (
        <div className="absolute -top-3.5 right-4 z-30 bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none">
          <span>💡 Step 2</span>
        </div>
      )}
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
            <MoveHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit'] flex items-center gap-2">
              Song Structure Timeline
              <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                ({sections.length} sections mapped)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Visual markers highlight Verse, Chorus, and Bridge transitions. Click markers to jump to key song moments.
            </p>
          </div>
        </div>

        {/* Action Controls (Video Trim & Add Section) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Trim Markers Helper */}
          {(onSetSongStartAtCurrent || onSetSongEndAtCurrent) && (
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
              {onSetSongStartAtCurrent && (
                <button
                  type="button"
                  onClick={onSetSongStartAtCurrent}
                  className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Set Song Start marker to current video playback time (e.g. skip video skit)"
                >
                  <Flag className="w-3 h-3 text-emerald-500" />
                  <span>Start @ {formatTimecode(currentTime)}</span>
                </button>
              )}
              {onSetSongEndAtCurrent && (
                <button
                  type="button"
                  onClick={onSetSongEndAtCurrent}
                  className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Set Song End marker to current video playback time (e.g. skip outro credits)"
                >
                  <Flag className="w-3 h-3 text-rose-500" />
                  <span>End @ {formatTimecode(currentTime)}</span>
                </button>
              )}
            </div>
          )}

          {/* Main Add Section / Mark Section Button */}
          <button
            id="add-section-timeline-btn"
            type="button"
            onClick={onAddSectionClick}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98 ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
            }`}
            title={
              isPlaying
                ? `Mark section at timestamp ${formatTimecode(currentTime)}`
                : 'Add a new section'
            }
          >
            {isPlaying ? (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Mark Section at {formatTimecode(currentTime)}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Birds-Eye Song Structure Overview Strip */}
      {sections.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2 sm:p-2.5 flex flex-col gap-2">
          {/* Top Pillar Transition Badges & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 font-['Outfit']">
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                Birds-Eye Structure:
              </span>
            </div>


          </div>

          {/* Flow Breadcrumb Nodes Chain */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {sections.map((sec, idx) => {
              const isCurrent = currentTime >= sec.startTime && currentTime < sec.endTime;
              const isSelected = selectedSectionId === sec.id;
              const struct = getStructuralInfo(sec.type);
              const theme = getSectionColorTheme(sec);
              const IconComponent = struct.icon;

              let nodeBadgeClass = theme.badgeClass || 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
              if (!theme.isCustom) {
                if (sec.type === 'chorus') {
                  nodeBadgeClass = 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-rose-300 font-bold shadow-xs';
                } else if (sec.type === 'verse') {
                  nodeBadgeClass = 'bg-blue-600 text-white border-blue-400 font-bold shadow-xs';
                } else if (sec.type === 'bridge') {
                  nodeBadgeClass = 'bg-purple-600 text-white border-purple-400 font-bold shadow-xs';
                }
              }

              return (
                <React.Fragment key={`flow-node-${sec.id}`}>
                  {idx > 0 && (
                    <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSeek) onSeek(sec.startTime);
                      onSelectSectionForDetails(sec.id);
                    }}
                    style={theme.badgeStyle}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all border shrink-0 cursor-pointer ${nodeBadgeClass} ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 scale-102 shadow-md'
                        : isCurrent
                        ? 'ring-2 ring-rose-500 scale-102 animate-pulse'
                        : 'hover:scale-102 hover:shadow-xs opacity-90 hover:opacity-100'
                    }`}
                    title={`Click to jump to ${sec.label} (${formatTimecode(sec.startTime)} - ${formatTimecode(sec.endTime)}) • ~${sec.calculatedBars} bars`}
                  >
                    {IconComponent && <IconComponent className="w-2.5 h-2.5 shrink-0" />}
                    <span className="truncate max-w-[110px]">{sec.label}</span>
                    <span className="text-[9px] opacity-80 font-mono -ml-0.5">
                      ~{sec.calculatedBars}bars
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Timeline Viewport with Interactive Clickable/Scrubbable Ruler */}
      <div
        className="relative pt-1 pb-4 select-none overflow-x-hidden"
        onMouseMove={handleContainerMouseMove}
        onMouseLeave={handleContainerMouseLeave}
      >
        {/* Zoom Transform Wrapper for Dynamic 50% Zoom on Boundary Drag */}
        <div
          style={{
            transform: isBoundaryZoomed ? 'scaleX(1.5)' : 'scaleX(1)',
            transformOrigin: `${zoomedBoundaryPct}% center`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className="relative"
        >
          {/* Time Ruler & Section Transition Badges */}
          <div
            ref={rulerRef}
            onClick={handleRulerClick}
            className="relative w-full h-7 cursor-pointer group"
          >
            {/* Ruler tick marks and labels */}
            {ticks.map((t) => {
              const pct = (t / totalTimelineDuration) * 100;
              if (pct > 100) return null;
              return (
                <div
                  key={t}
                  className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none text-[10px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
                  style={{ left: `${pct}%` }}
                >
                  <span className="leading-none">{formatTimecode(t)}</span>
                  <div className="w-px h-1.5 bg-slate-300 dark:bg-slate-700 mt-0.5" />
                </div>
              );
            })}

            {/* Section Transition Badges / Pins positioned directly above the yellow line */}
            {sections.map((sec) => {
              const struct = getStructuralInfo(sec.type);
              if (!struct.isPillar) return null;
              const theme = getSectionColorTheme(sec);
              const startPct = (sec.startTime / totalTimelineDuration) * 100;
              const IconComponent = struct.icon;
              const isCurrent = currentTime >= sec.startTime && currentTime < sec.endTime;

              return (
                <div
                  key={`section-badge-marker-${sec.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSeek) onSeek(sec.startTime);
                    onSelectSectionForDetails(sec.id);
                  }}
                  style={{ left: `${startPct}%` }}
                  className="absolute bottom-0 transform -translate-x-1/2 z-30 flex flex-col items-center cursor-pointer group/pin"
                  title={`Jump to ${sec.label} transition @ ${formatTimecode(sec.startTime)} (~${sec.calculatedBars} bars)`}
                >
                  {/* Visual Flag / Pin */}
                  <div
                    style={{
                      ...(theme.badgeStyle || {}),
                      transform: isBoundaryZoomed ? 'scaleX(0.6667)' : 'scaleX(1)',
                      transformOrigin: 'center center',
                    }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-md border transition-all ${
                      theme.badgeClass || struct.flagBg
                    } ${
                      isCurrent
                        ? 'ring-2 ring-white scale-110 animate-pulse'
                        : 'hover:scale-115 hover:shadow-lg'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-2.5 h-2.5 shrink-0" />}
                    <span className="leading-none whitespace-nowrap">{sec.label}</span>
                  </div>
                  {/* Pin pointer line */}
                  <div
                    className="w-0.5 h-1.5 transition-colors mt-0.5"
                    style={{ backgroundColor: theme.hex }}
                  />
                </div>
              );
            })}
          </div>

          {/* Top Interactive Yellow Seek Bar (Clickable and Scrollable / Draggable like YouTube player) */}
          <div
            ref={seekbarRef}
            id="timeline-yellow-seek-bar"
            onMouseDown={handleSeekBarMouseDown}
            onMouseMove={handleSeekBarMouseMove}
            onMouseEnter={() => setIsHoveringSeekBar(true)}
            onMouseLeave={() => {
              setIsHoveringSeekBar(false);
              setHoveredTimelineTime(null);
            }}
            className="relative w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer my-1.5 group/seekbar"
            title="Click or drag anywhere to jump / scrub the video (like YouTube player)"
          >
            {/* Progress bar fill up to current playhead */}
            <div
              style={{ width: `${playheadPct}%` }}
              className="absolute top-0 bottom-0 left-0 bg-amber-500 rounded-full transition-all duration-75"
            />

            {/* Hover scrubber ghost line */}
            {hoveredTimelineTime !== null && (
              <div
                style={{ left: `${(hoveredTimelineTime / totalTimelineDuration) * 100}%` }}
                className="absolute -top-1 bottom-0 w-px bg-amber-400 pointer-events-none z-20"
              >
                <div 
                  style={{
                    transform: `translateX(-50%) ${isBoundaryZoomed ? 'scaleX(0.6667)' : 'scaleX(1)'}`,
                    transformOrigin: 'center bottom',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="absolute -top-6 bg-slate-900 dark:bg-slate-800 text-amber-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap"
                >
                  {formatTimecode(hoveredTimelineTime)}
                </div>
              </div>
            )}

            {/* Target-Like Circle Playhead on the Top Yellow Line */}
            {duration > 0 && (
              <div
                id="timeline-top-playhead-handle"
                style={{ left: `${playheadPct}%` }}
                onMouseDown={handlePlayheadMouseDown}
                onMouseEnter={() => setIsHoveringPlayhead(true)}
                onMouseLeave={() => setIsHoveringPlayhead(false)}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-amber-500 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform z-30 border border-amber-600/70 ${
                  draggingType === 'playhead' || isHoveringPlayhead || isHoveringSeekBar
                    ? 'scale-125 ring-2 ring-amber-400/50 shadow-lg'
                    : 'group-hover/seekbar:scale-115'
                }`}
                title={`Video Playhead: ${formatTimecode(currentTime)} (Click or drag to scrub)`}
              >
                {/* White middle ring */}
                <div className="w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center pointer-events-none">
                  {/* Center amber dot */}
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 pointer-events-none" />
                </div>

                {/* Live Scrubber Time Floating Badge */}
                {(draggingType === 'playhead' || isHoveringPlayhead) && (
                  <div 
                    style={{
                      transform: `translateX(-50%) ${isBoundaryZoomed ? 'scaleX(0.6667)' : 'scaleX(1)'}`,
                      transformOrigin: 'center bottom',
                    }}
                    className="absolute -top-7 left-1/2 bg-amber-500 text-slate-950 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-40 pointer-events-none border border-amber-300"
                  >
                    {formatTimecode(currentTime)}
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Horizontal Timeline Track */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="relative w-full h-24 sm:h-28 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner flex cursor-pointer"
        >
          {/* Shaded Area for Video Lead-In Skit (Before Song Start) */}
          {hasIntroTrim && (
            <div
              style={{ width: `${(effectiveSongStart / totalTimelineDuration) * 100}%` }}
              className="absolute left-0 top-0 bottom-0 bg-slate-400/20 dark:bg-slate-800/40 backdrop-blur-xs border-r-2 border-dashed border-emerald-500/70 z-10 flex items-center justify-center pointer-events-none overflow-hidden"
              title={`Video Lead-in / Intro Skit (0:00 - ${formatTimecode(effectiveSongStart)})`}
            >
              <div 
                style={{
                  transform: isBoundaryZoomed ? 'rotate(-6deg) scaleX(0.6667)' : 'rotate(-6deg)',
                  transformOrigin: 'center center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded shadow-2xs whitespace-nowrap"
              >
                Video Lead-In ({formatTimecode(effectiveSongStart)})
              </div>
            </div>
          )}

          {/* Shaded Area for Video Outro Credits (After Song End) */}
          {hasOutroTrim && (
            <div
              style={{
                left: `${(effectiveSongEnd / totalTimelineDuration) * 100}%`,
                right: 0,
              }}
              className="absolute top-0 bottom-0 bg-slate-400/20 dark:bg-slate-800/40 backdrop-blur-xs border-l-2 border-dashed border-rose-500/70 z-10 flex items-center justify-center pointer-events-none overflow-hidden"
              title={`Video Outro / End Credits (${formatTimecode(effectiveSongEnd)} - ${formatTimecode(totalTimelineDuration)})`}
            >
              <div 
                style={{
                  transform: isBoundaryZoomed ? 'rotate(6deg) scaleX(0.6667)' : 'rotate(6deg)',
                  transformOrigin: 'center center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded shadow-2xs whitespace-nowrap"
              >
                Video Outro ({formatTimecode(effectiveSongEnd)})
              </div>
            </div>
          )}

          {/* Empty timeline state placeholder */}
          {sections.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500 pointer-events-none">
              <svg className="w-8 h-8 mb-1.5 text-indigo-600 dark:text-indigo-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 1H5a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7z" fill="currentColor" fillOpacity="0.2" strokeWidth="2" />
                <path d="M15 1v6h6" strokeWidth="2" />
                
                {/* Staff lines */}
                <line x1="5" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
                <line x1="5" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
                <line x1="5" y1="13" x2="19" y2="13" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
                <line x1="5" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
                <line x1="5" y1="17" x2="19" y2="17" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />

                {/* Music notes */}
                <path d="M8.5 17V10l6-2v7" strokeWidth="1.6" />
                <circle cx="7" cy="17" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="13" cy="15" r="1.3" fill="currentColor" stroke="none" />
              </svg>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Timeline is currently blank
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Click <strong>+ Add Section</strong> or drag song start/end handles to map the arrangement!
              </p>
            </div>
          )}

          {/* Render Song Sections as Blocks */}
          {sections.map((section, idx) => {
            const config = SECTION_CONFIGS[section.type] || SECTION_CONFIGS.verse;
            const theme = getSectionColorTheme(section);
            const struct = getStructuralInfo(section.type);
            const IconComponent = struct.icon;
            const leftPct = (section.startTime / totalTimelineDuration) * 100;
            const widthPct = Math.max(
              1,
              ((section.endTime - section.startTime) / totalTimelineDuration) * 100
            );
            const isCurrent = currentTime >= section.startTime && currentTime < section.endTime;
            const isSelected = selectedSectionId === section.id;

            return (
              <div
                key={section.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionClick(section);
                  onSelectSectionForDetails(section.id);
                }}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  ...(theme.bgStyle || {}),
                  ...(theme.borderStyle ? { borderColor: (theme.borderStyle as any).borderColor } : {}),
                }}
                className={`absolute top-0 bottom-0 border-r border-slate-300 dark:border-slate-800 flex flex-col justify-between p-2 sm:p-2.5 transition-all group overflow-hidden ${
                  theme.bgClass || config.bg
                } ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 z-15 shadow-md'
                    : isCurrent
                    ? 'ring-2 ring-rose-500/80 z-15'
                    : 'hover:brightness-95 dark:hover:brightness-110'
                }`}
                title={`Click to play ${section.label} (${formatTimecode(section.startTime)} - ${formatTimecode(section.endTime)})`}
              >
                {/* Structural Accent Top Bar */}
                <div
                  className="absolute top-0 inset-x-0 h-1 shadow-xs transition-colors"
                  style={theme.accentStyle || { backgroundColor: theme.hex }}
                />

                {/* Top Section Header */}
                <div className="flex items-center justify-between gap-1 w-full relative z-20">
                  <span
                    className={`text-[10px] sm:text-xs font-bold font-['Outfit'] truncate px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-1 transition-all ${
                      theme.badgeClass || config.badgeBg
                    }`}
                    style={{
                      ...(theme.badgeStyle || {}),
                      transform: isBoundaryZoomed ? 'scaleX(0.6667)' : 'scaleX(1)',
                      transformOrigin: 'left center',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {IconComponent && <IconComponent className="w-2.5 h-2.5 shrink-0" />}
                    <span className="truncate">{section.label}</span>
                  </span>

                  {isCurrent && isPlaying && (
                    <span className="flex items-center gap-0.5 px-1 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded animate-pulse shrink-0 shadow-2xs">
                      <Volume2 className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">PLAYING</span>
                    </span>
                  )}
                </div>


              </div>
            );
          })}

          {/* Dynamic Waveform & Transition Landmark Overlay (Drops, Builds, Rhythm Shifts) */}
          <TimelineWaveformOverlay
            sections={sections}
            totalTimelineDuration={totalTimelineDuration}
            currentTime={currentTime}
            isPlaying={isPlaying}
            bpm={bpm}
            timeSignature={timeSignature}
            effectiveSongStart={effectiveSongStart}
            effectiveSongEnd={effectiveSongEnd}
            onSeek={onSeek}
            opacity={waveformOpacity}
          />

          {/* Start Boundary Line of First Section (Established Timeline Start) */}
          {sections.length > 0 && onUpdateFirstSectionStart && (() => {
            const firstSection = sections[0];
            const startPct = (firstSection.startTime / totalTimelineDuration) * 100;
            const isDraggingThis = draggingType === 'firstSectionStart';
            const isHoveredThis = hoveredBoundaryEdge === 'firstSectionStart';

            return (
              <div
                key="timeline-start-boundary"
                style={{ left: `${startPct}%` }}
                onMouseEnter={() => setHoveredBoundaryEdge('firstSectionStart')}
                onMouseLeave={() => setHoveredBoundaryEdge(null)}
                onMouseDown={handleFirstSectionStartMouseDown}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 bottom-0 w-6 -ml-3 z-25 flex flex-col items-center justify-center cursor-ew-resize group"
              >
                {/* Visual vertical line - Emerald colored to indicate Timeline Start */}
                <div
                  className={`w-1.5 h-full transition-all ${
                    isDraggingThis || isHoveredThis
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] scale-x-125'
                      : 'bg-emerald-600/80 group-hover:bg-emerald-500'
                  }`}
                />

                {/* Draggable center handle pill with start indicator */}
                <div
                  onMouseDown={handleFirstSectionStartMouseDown}
                  className={`absolute top-1/2 -translate-y-1/2 w-4.5 h-9 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-md border-2 border-white dark:border-slate-800 transition-all ${
                    isDraggingThis || isHoveredThis
                      ? 'bg-emerald-500 text-white scale-110 ring-2 ring-emerald-400/40'
                      : 'bg-emerald-600 text-white group-hover:bg-emerald-500 group-hover:scale-105'
                  }`}
                  title={`Drag to adjust Timeline Start / ${firstSection.label} start (${formatTimecode(firstSection.startTime)})`}
                >
                  <ChevronRight className="w-3 h-3 -mr-0.5" />
                </div>

                {/* Floating live timestamp pill during drag/hover */}
                {(isDraggingThis || isHoveredThis) && (
                  <div className="absolute -top-7 bg-emerald-700 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none font-bold">
                    Start: {formatTimecode(firstSection.startTime)} ({firstSection.label})
                  </div>
                )}
              </div>
            );
          })()}

          {/* Vertical Slidable Boundary Lines between Sections */}
          {sections.map((section, idx) => {
            if (idx === sections.length - 1) return null; // No boundary after the very last section
            const nextSec = sections[idx + 1];
            const nextStruct = nextSec ? getStructuralInfo(nextSec.type) : null;
            const nextTheme = nextSec ? getSectionColorTheme(nextSec) : null;
            const boundaryPct = (section.endTime / totalTimelineDuration) * 100;
            const isDraggingThis = draggingType === 'boundary' && draggingBoundaryIndex === idx;
            const isHoveredThis = hoveredBoundaryIndex === idx;

            return (
              <div
                key={`boundary-${idx}`}
                style={{ left: `${boundaryPct}%` }}
                onMouseEnter={() => setHoveredBoundaryIndex(idx)}
                onMouseLeave={() => setHoveredBoundaryIndex(null)}
                onMouseDown={(e) => handleBoundaryMouseDown(idx, e)}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 bottom-0 w-6 -ml-3 z-20 flex flex-col items-center justify-center cursor-ew-resize group"
              >


                {/* Visual vertical line */}
                <div
                  style={
                    !isDraggingThis && !isHoveredThis && nextTheme
                      ? { backgroundColor: nextTheme.hex }
                      : undefined
                  }
                  className={`w-1 h-full transition-all ${
                    isDraggingThis || isHoveredThis
                      ? 'bg-rose-500 shadow-md scale-x-125'
                      : nextStruct?.isPillar
                      ? 'opacity-80 group-hover:bg-rose-500'
                      : 'bg-indigo-600/70 group-hover:bg-rose-500'
                  }`}
                />

                {/* Draggable center handle pill */}
                <div
                  onMouseDown={(e) => handleBoundaryMouseDown(idx, e)}
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-8 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-md border border-white dark:border-slate-800 transition-all ${
                    isDraggingThis || isHoveredThis
                      ? 'bg-rose-600 text-white scale-110'
                      : 'bg-indigo-700 text-white group-hover:bg-rose-600'
                  }`}
                  title={`Drag boundary between ${sections[idx].label} and ${sections[idx + 1].label}`}
                >
                  <div className="w-1 h-1 bg-white rounded-full" />
                  <div className="w-1 h-1 bg-white rounded-full" />
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>

                {/* Floating live timestamp pill during drag/hover */}
                {(isDraggingThis || isHoveredThis) && (
                  <div className="absolute -top-7 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                    Split: {formatTimecode(section.endTime)} {nextSec ? `(➜ ${nextSec.label})` : ''}
                  </div>
                )}
              </div>
            );
          })}

          {/* End Boundary Line of Last Section (Established Timeline End) */}
          {sections.length > 0 && onUpdateLastSectionEnd && (() => {
            const lastSection = sections[sections.length - 1];
            const endPct = (lastSection.endTime / totalTimelineDuration) * 100;
            const isDraggingThis = draggingType === 'lastSectionEnd';
            const isHoveredThis = hoveredBoundaryEdge === 'lastSectionEnd';

            return (
              <div
                key="timeline-end-boundary"
                style={{ left: `${endPct}%` }}
                onMouseEnter={() => setHoveredBoundaryEdge('lastSectionEnd')}
                onMouseLeave={() => setHoveredBoundaryEdge(null)}
                onMouseDown={handleLastSectionEndMouseDown}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 bottom-0 w-6 -ml-3 z-25 flex flex-col items-center justify-center cursor-ew-resize group"
              >
                {/* Visual vertical line - Purple/Rose colored to indicate Timeline End */}
                <div
                  className={`w-1.5 h-full transition-all ${
                    isDraggingThis || isHoveredThis
                      ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)] scale-x-125'
                      : 'bg-purple-600/80 group-hover:bg-purple-500'
                  }`}
                />

                {/* Draggable center handle pill with end indicator */}
                <div
                  onMouseDown={handleLastSectionEndMouseDown}
                  className={`absolute top-1/2 -translate-y-1/2 w-4.5 h-9 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-md border-2 border-white dark:border-slate-800 transition-all ${
                    isDraggingThis || isHoveredThis
                      ? 'bg-purple-500 text-white scale-110 ring-2 ring-purple-400/40'
                      : 'bg-purple-600 text-white group-hover:bg-purple-500 group-hover:scale-105'
                  }`}
                  title={`Drag to adjust Timeline End / ${lastSection.label} end (${formatTimecode(lastSection.endTime)})`}
                >
                  <ChevronLeft className="w-3 h-3 -ml-0.5" />
                </div>

                {/* Floating live timestamp pill during drag/hover */}
                {(isDraggingThis || isHoveredThis) && (
                  <div className="absolute -top-7 bg-purple-700 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none font-bold">
                    End: {formatTimecode(lastSection.endTime)} ({lastSection.label})
                  </div>
                )}
              </div>
            );
          })()}

          {/* Draggable Song Start Point Handle (Prompt Requirement!) */}
          {onUpdateSongStart && (
            <div
              style={{ left: `${(effectiveSongStart / totalTimelineDuration) * 100}%` }}
              onMouseEnter={() => setHoveredSpecialHandle('start')}
              onMouseLeave={() => setHoveredSpecialHandle(null)}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 bottom-0 w-5 -ml-2.5 z-25 flex flex-col items-center justify-start cursor-ew-resize group"
            >
              {/* Start Line */}
              <div
                className={`w-1.5 h-full transition-all ${
                  draggingType === 'songStart' || hoveredSpecialHandle === 'start'
                    ? 'bg-emerald-500 shadow-md scale-x-125'
                    : 'bg-emerald-600/80 group-hover:bg-emerald-500'
                }`}
              />

              {/* Start Handle Top Flag */}
              <div
                onMouseDown={handleSongStartMouseDown}
                className={`absolute -top-1 w-5 h-6 rounded-b-md bg-emerald-600 text-white flex items-center justify-center shadow-md border border-white dark:border-slate-800 transition-all ${
                  draggingType === 'songStart' || hoveredSpecialHandle === 'start'
                    ? 'scale-115 bg-emerald-500'
                    : 'group-hover:scale-110'
                }`}
                title={`Drag to set Song Start point (Current: ${formatTimecode(effectiveSongStart)})`}
              >
                <Flag className="w-2.5 h-2.5 fill-current" />
              </div>

              {/* Live tooltip */}
              {(draggingType === 'songStart' || hoveredSpecialHandle === 'start') && (
                <div className="absolute -top-7 bg-emerald-700 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-35 pointer-events-none font-bold">
                  Song Start: {formatTimecode(effectiveSongStart)}
                </div>
              )}
            </div>
          )}

          {/* Draggable Song End Point Handle (Prompt Requirement!) */}
          {onUpdateSongEnd && (
            <div
              style={{ left: `${(effectiveSongEnd / totalTimelineDuration) * 100}%` }}
              onMouseEnter={() => setHoveredSpecialHandle('end')}
              onMouseLeave={() => setHoveredSpecialHandle(null)}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 bottom-0 w-5 -ml-2.5 z-25 flex flex-col items-center justify-start cursor-ew-resize group"
            >
              {/* End Line */}
              <div
                className={`w-1.5 h-full transition-all ${
                  draggingType === 'songEnd' || hoveredSpecialHandle === 'end'
                    ? 'bg-rose-500 shadow-md scale-x-125'
                    : 'bg-rose-600/80 group-hover:bg-rose-500'
                }`}
              />

              {/* End Handle Top Flag */}
              <div
                onMouseDown={handleSongEndMouseDown}
                className={`absolute -top-1 w-5 h-6 rounded-b-md bg-rose-600 text-white flex items-center justify-center shadow-md border border-white dark:border-slate-800 transition-all ${
                  draggingType === 'songEnd' || hoveredSpecialHandle === 'end'
                    ? 'scale-115 bg-rose-500'
                    : 'group-hover:scale-110'
                }`}
                title={`Drag to set Song End point (Current: ${formatTimecode(effectiveSongEnd)})`}
              >
                <Flag className="w-2.5 h-2.5 fill-current" />
              </div>

              {/* Live tooltip */}
              {(draggingType === 'songEnd' || hoveredSpecialHandle === 'end') && (
                <div className="absolute -top-7 bg-rose-700 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-35 pointer-events-none font-bold">
                  Song End: {formatTimecode(effectiveSongEnd)}
                </div>
              )}
            </div>
          )}

          {/* Current Playhead Indicator: Vertical Orange Laser Line inside Track */}
          {duration > 0 && (
            <div
              id="timeline-playhead-scrubber"
              style={{ left: `${playheadPct}%` }}
              onMouseDown={handlePlayheadMouseDown}
              onMouseEnter={() => setIsHoveringPlayhead(true)}
              onMouseLeave={() => setIsHoveringPlayhead(false)}
              className="absolute top-0 bottom-0 w-4 -ml-2 z-35 flex flex-col items-center justify-start cursor-grab active:cursor-grabbing group/laser pointer-events-auto"
              title={`Video Playhead: ${formatTimecode(currentTime)} (Click or drag to scrub)`}
            >
              {/* Vertical Orange / Amber Laser Line */}
              <div
                className={`w-0.5 h-full transition-all ${
                  draggingType === 'playhead' || isHoveringPlayhead || isHoveringSeekBar
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-x-150'
                    : 'bg-amber-500/90'
                }`}
              />

              {/* Bottom Glow Pill / Tab */}
              <div className="absolute bottom-0 w-2 h-1 bg-amber-500 rounded-t-full" />
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Zoom Active Indicator Badge */}
      {isBoundaryZoomed && (
        <div className="absolute top-2.5 right-4 z-40 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1.5 pointer-events-none">
          <span>🔍 1.5x Precision Zoom Active</span>
        </div>
      )}


      {/* Timeline helper footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Song Length:</span>
            <span className="font-mono font-bold text-indigo-800 dark:text-indigo-200">
              {formatTimecode(songLengthSeconds)}
            </span>
          </div>
        </div>

        {/* Transition Key Landmarks Legend */}
        <div className="flex items-center gap-2 flex-wrap text-[10px]">
          <span className="text-slate-400 dark:text-slate-500 font-semibold">Sections:</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
            <WavingHand className="w-2.5 h-2.5 text-slate-500" /> Intro
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
            <TurningBook className="w-2.5 h-2.5" /> Verse
          </span>
          {sections.some((s) => s.type === 'pre_chorus') && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
              <SwellingCrescendo className="w-2.5 h-2.5 text-purple-600" /> Pre-Chorus
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">
            <FlickeringFlame className="w-2.5 h-2.5 text-rose-500" /> Chorus
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
            <SpinningMilestone className="w-2.5 h-2.5 text-emerald-600" /> Bridge
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
            <WavingHand className="w-2.5 h-2.5 text-slate-500" /> Outro
          </span>
          {sections.some((s) => s.type === 'interlude') && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
              <PauseIconAnim className="w-2.5 h-2.5 text-slate-500" /> Interlude
            </span>
          )}
          {sections.some((s) => s.type === 'instrumental_solo') && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800">
              <RockHand className="w-2.5 h-2.5 text-orange-600" /> Solo
            </span>
          )}
          {sections.some((s) => s.type === 'down_chorus' || s.type === 'post_chorus') && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-semibold border border-pink-200 dark:border-pink-800">
              <DownChorusIcon className="w-2 h-2 text-pink-500" /> Post-Chorus
            </span>
          )}
          {sections.some((s) => s.type === 'custom') && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
              Custom
            </span>
          )}
          <span className="font-mono text-slate-600 dark:text-slate-300 ml-2">
            Tempo: <strong>{bpm ? `${bpm} BPM` : '--'}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

