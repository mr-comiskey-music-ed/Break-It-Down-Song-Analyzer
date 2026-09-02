import React, { useState, useRef, useEffect } from 'react';
import { SongMetadata } from '../types';
import { Sparkles, HelpCircle, Activity, RotateCcw, CheckCircle2, Music4, Info } from 'lucide-react';

interface SongMetadataBoxesProps {
  metadata: SongMetadata;
  onChange: (updated: Partial<SongMetadata>) => void;
  onAutoPopulate: () => Promise<void>;
  isLoadingAutoFill: boolean;
  onTapTempoRecorded?: () => void;
  isHighlighted?: boolean;
  standalone?: boolean;
}

export function SongMetadataBoxes({
  metadata,
  onChange,
  onAutoPopulate,
  isLoadingAutoFill,
  onTapTempoRecorded,
  isHighlighted = false,
  standalone = true,
}: SongMetadataBoxesProps) {
  // Tap tempo state
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [isTapping, setIsTapping] = useState(false);

  const resetTimerRef = useRef<any>(null);

  // Audio click oscillator for tap feedback (synthesized lightly)
  const playTapAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio context might be restricted
    }
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    playTapAudio();
    const now = performance.now();
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 120);

    setTapTimes((prev) => {
      // If last tap was more than 2.5 seconds ago, reset
      if (prev.length > 0 && now - prev[prev.length - 1] > 2500) {
        return [now];
      }

      const updated = [...prev, now];
      // Keep up to 12 taps
      const sliced = updated.slice(-12);

      if (sliced.length >= 2) {
        // Calculate average interval between consecutive taps
        const intervals: number[] = [];
        for (let i = 1; i < sliced.length; i++) {
          intervals.push(sliced[i] - sliced[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);

        if (calculatedBpm >= 30 && calculatedBpm <= 300) {
          onChange({ bpm: calculatedBpm });
          if (onTapTempoRecorded) onTapTempoRecorded();
        }
      }

      return sliced;
    });

    // Reset tap buffer after 3s of inactivity
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setTapTimes([]);
    }, 3000);
  };

  const handleResetTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTapTimes([]);
    onChange({ bpm: '' });
  };

  const tapCount = tapTimes.length;

  const content = (
    <>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Music4 className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit']">
            Song Assignment Information
          </h2>
        </div>

        <button
          id="auto-populate-btn"
          onClick={onAutoPopulate}
          disabled={isLoadingAutoFill || (!metadata.youtubeUrl && !metadata.title && !metadata.artist)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Auto-detect Song Title, Artist, Album, Year, and Genre from query or YouTube video"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isLoadingAutoFill ? 'animate-spin' : ''}`} />
          {isLoadingAutoFill ? 'Finding Details...' : 'Auto-Find Song Info'}
        </button>
      </div>

      {/* Slide Deck 3-Row Form Layout */}
      <div className="space-y-3.5">
        {/* Row 1: Song Title & Artist(s) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Song:
            </label>
            <input
              id="song-title-input"
              type="text"
              value={metadata.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Musicology"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Artist(s):
            </label>
            <input
              id="song-artist-input"
              type="text"
              value={metadata.artist}
              onChange={(e) => onChange({ artist: e.target.value })}
              placeholder="e.g. Prince"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Row 2: Album & Year */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Album:
            </label>
            <input
              id="song-album-input"
              type="text"
              value={metadata.album}
              onChange={(e) => onChange({ album: e.target.value })}
              placeholder="e.g. Musicology"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Year:
            </label>
            <input
              id="song-year-input"
              type="text"
              value={metadata.year}
              onChange={(e) => onChange({ year: e.target.value })}
              placeholder="e.g. 2004"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Row 3: Genre, Time Signature, & BPM */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Genre:
            </label>
            <input
              id="song-genre-input"
              type="text"
              value={metadata.genre}
              onChange={(e) => onChange({ genre: e.target.value })}
              placeholder="e.g. R&B/Soul"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="sm:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Time Signature:
              </label>
              <span
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help"
                title="Assume 4/4 standard unless clear evidence otherwise (e.g. 3/4 waltz or 6/8 ballad)"
              >
                <Info className="w-3 h-3 inline" />
              </span>
            </div>
            <select
              id="song-timesig-select"
              value={metadata.timeSignature}
              onChange={(e) => onChange({ timeSignature: e.target.value })}
              className="w-full px-2.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono"
            >
              <option value="4/4">4/4 (Standard)</option>
              <option value="3/4">3/4 (Waltz)</option>
              <option value="6/8">6/8 (Swaying)</option>
              <option value="2/4">2/4 (March)</option>
              <option value="12/8">12/8 (Slow Blues)</option>
            </select>
          </div>
          <div className="sm:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>BPM:</span>
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                id="song-bpm-input"
                type="number"
                min="40"
                max="260"
                value={metadata.bpm}
                onChange={(e) => onChange({ bpm: e.target.value ? Number(e.target.value) : '' })}
                placeholder="--"
                className="w-14 sm:w-16 px-1.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-800 dark:text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
              <button
                id="tap-tempo-btn"
                type="button"
                onClick={handleTap}
                className={`flex-1 px-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center gap-1 ${
                  isTapping
                    ? 'bg-amber-500 text-white ring-2 ring-amber-400'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50'
                }`}
                title="Tap continuously along to the beat of the song to calculate BPM"
              >
                <Activity className={`w-3.5 h-3.5 ${isTapping ? 'animate-bounce' : ''}`} />
                <span>TAP{tapCount > 0 ? ` (${tapCount})` : ''}</span>
              </button>
              {metadata.bpm !== '' && (
                <button
                  type="button"
                  onClick={handleResetTap}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Reset BPM"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!standalone) {
    return <div className="flex flex-col gap-4">{content}</div>;
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-3.5 sm:p-4 transition-all relative ${isHighlighted ? 'ring-4 ring-amber-500/80 dark:ring-amber-400/80 shadow-2xl shadow-amber-500/25' : ''}`}>
      {isHighlighted && (
        <div className="absolute -top-3.5 right-4 z-30 bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none">
          <span>💡 Step 1</span>
        </div>
      )}
      {content}
    </div>
  );
}
