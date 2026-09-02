import React, { useState, useEffect } from 'react';
import { SongSection, SectionAnalysisData, SectionType } from '../types';
import { SECTION_CONFIGS, formatTimecode, parseTimecode, getSectionColorTheme } from '../utils/musicTheory';
import { getInstrumentSuggestionsForGenre } from '../utils/genrePresets';
import { SectionColorPicker } from './SectionColorPicker';
import { getSectionIconComponent } from './SectionIcons';
import {
  Play,
  Volume2,
  Trash2,
  Sliders,
  Sparkles,
  Layers,
  Copy,
  ClipboardPaste,
  Check,
  HelpCircle,
  X,
  Edit2,
} from 'lucide-react';

export interface SectionDetailCardProps {
  key?: React.Key;
  section: SongSection;
  onCopyAnalysis: () => void;
  onPasteAnalysis: () => void;
  copiedAnalysis: SectionAnalysisData | null;
  genre?: string;
  timeSignature: string;
  bpm: number | '';
  isSelected: boolean;
  currentTime?: number;
  isPlaying?: boolean;
  onUpdate: (updated: Partial<SongSection>) => void;
  onUpdateAllOfType?: (color: string) => void;
  onDelete: () => void;
  onPlaySection: () => void;
}

export function SectionDetailCard({
  section,
  onCopyAnalysis,
  onPasteAnalysis,
  copiedAnalysis,
  genre,
  timeSignature,
  bpm,
  isSelected,
  currentTime = 0,
  isPlaying = false,
  onUpdate,
  onUpdateAllOfType,
  onDelete,
  onPlaySection,
}: SectionDetailCardProps) {
  const [isEditingTimecode, setIsEditingTimecode] = useState(false);
  const [tempStartTime, setTempStartTime] = useState(formatTimecode(section.startTime));
  const [tempEndTime, setTempEndTime] = useState(formatTimecode(section.endTime));
  const [timecodeError, setTimecodeError] = useState<string | null>(null);
  const [justCopied, setJustCopied] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customNameInput, setCustomNameInput] = useState(section.type === 'custom' ? section.label : '');

  const config = SECTION_CONFIGS[section.type] || SECTION_CONFIGS.verse;
  const theme = getSectionColorTheme(section);

  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_added_instruments_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Listen for custom instrument updates across all section cards
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem('custom_added_instruments_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setDynamicSuggestions(parsed);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('custom-instruments-updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('custom-instruments-updated', handleStorageUpdate);
    };
  }, []);

  // Save completed typed instruments to dynamic suggestions on change
  useEffect(() => {
    const notes = section.instrumentationNotes || '';
    const parts = notes.split(',');
    const endsWithComma = notes.endsWith(',');
    const completedItems = endsWithComma 
      ? parts.map(s => s.trim()).filter(Boolean)
      : parts.slice(0, Math.max(0, parts.length - 1)).map(s => s.trim()).filter(Boolean);

    if (completedItems.length === 0) return;

    try {
      const saved = localStorage.getItem('custom_added_instruments_v1');
      let currentDynamic: string[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) currentDynamic = parsed;
      }

      let hasChanges = false;
      const baseSuggestions = getInstrumentSuggestionsForGenre(genre);

      completedItems.forEach(item => {
        const raw = item.replace(/^\+/, '').trim();
        if (raw.length > 1) {
          const tag = `+${raw}`;
          const cleanTagTag = tag.toLowerCase();
          const exists = currentDynamic.some(d => `+${d.replace(/^\+/, '').toLowerCase()}` === cleanTagTag) ||
                         baseSuggestions.some(b => b.toLowerCase() === cleanTagTag);
          if (!exists) {
            currentDynamic.push(tag);
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        localStorage.setItem('custom_added_instruments_v1', JSON.stringify(currentDynamic));
        setDynamicSuggestions(currentDynamic);
        window.dispatchEvent(new Event('custom-instruments-updated'));
      }
    } catch {}
  }, [section.instrumentationNotes, genre]);

  const instrumentSuggestions = React.useMemo(() => {
    const baseSuggestions = getInstrumentSuggestionsForGenre(genre);
    const setOfTags = new Set<string>();
    baseSuggestions.forEach(s => setOfTags.add(s));
    dynamicSuggestions.forEach(s => {
      const formatted = s.startsWith('+') ? s : `+${s}`;
      setOfTags.add(formatted);
    });

    const allTags = Array.from(setOfTags);
    const vocalsTag = '+vocals';
    const nonVocals = allTags.filter(t => t !== vocalsTag);

    return [vocalsTag, ...nonVocals];
  }, [genre, dynamicSuggestions]);

  const isCurrentlyActive = currentTime >= section.startTime && currentTime < section.endTime;
  const isCurrentlyPlaying = isCurrentlyActive && isPlaying;
  const sectionDuration = Math.max(0.1, section.endTime - section.startTime);
  const elapsedInSection = isCurrentlyActive
    ? Math.max(0, Math.min(sectionDuration, currentTime - section.startTime))
    : 0;
  const progressPct = isCurrentlyActive
    ? Math.min(100, Math.max(0, (elapsedInSection / sectionDuration) * 100))
    : 0;

  // Sync inputs when section props update
  useEffect(() => {
    if (!isEditingTimecode) {
      setTempStartTime(formatTimecode(section.startTime));
      setTempEndTime(formatTimecode(section.endTime));
      setTimecodeError(null);
    }
  }, [section.startTime, section.endTime, isEditingTimecode]);

  const handleStartEditingTimecode = () => {
    setTempStartTime(formatTimecode(section.startTime));
    setTempEndTime(formatTimecode(section.endTime));
    setTimecodeError(null);
    setIsEditingTimecode(true);
  };

  const handleSaveTimecode = () => {
    const parsedStart = parseTimecode(tempStartTime);
    const parsedEnd = parseTimecode(tempEndTime);

    if (parsedStart === null || isNaN(parsedStart) || parsedStart < 0) {
      setTimecodeError('Invalid start time (use mm:ss or seconds)');
      return;
    }
    if (parsedEnd === null || isNaN(parsedEnd) || parsedEnd <= parsedStart) {
      setTimecodeError('End time must be after start time');
      return;
    }

    onUpdate({
      startTime: Math.round(parsedStart * 10) / 10,
      endTime: Math.round(parsedEnd * 10) / 10,
    });
    setIsEditingTimecode(false);
    setTimecodeError(null);
  };

  const handleCancelTimecode = () => {
    setTempStartTime(formatTimecode(section.startTime));
    setTempEndTime(formatTimecode(section.endTime));
    setIsEditingTimecode(false);
    setTimecodeError(null);
  };

  // Handle copying section analysis details
  const handleLocalCopy = () => {
    onCopyAnalysis();
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1800);
  };

  // Append instrument tag into text box
  const handleAddInstrument = (instTag: string) => {
    const rawName = instTag.replace(/^\+/, '').trim();
    const currentNotes = section.instrumentationNotes || '';

    let updated = currentNotes.trim();
    if (!updated) {
      updated = rawName;
    } else {
      // Check if already in list
      if (!updated.toLowerCase().includes(rawName.toLowerCase())) {
        updated = `${updated}, ${rawName}`;
      }
    }
    onUpdate({ instrumentationNotes: updated });
  };

  return (
    <div
      id={`section-card-${section.id}`}
      className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between h-full overflow-hidden ${
        isCurrentlyActive
          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30 dark:ring-indigo-400/30 shadow-md bg-indigo-50/10 dark:bg-indigo-950/20'
          : isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Accent / Active Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {isCurrentlyActive ? (
          <div
            className="h-full transition-all duration-100 ease-linear relative"
            style={{
              width: `${progressPct}%`,
              backgroundColor: theme.hex,
            }}
          >
            {/* Glowing lead edge */}
            {isCurrentlyPlaying && (
              <div
                className="absolute right-0 top-0 bottom-0 w-2 shadow-[0_0_8px_currentColor] brightness-150"
                style={{ backgroundColor: '#ffffff' }}
              />
            )}
          </div>
        ) : (
          <div
            className="h-full w-full transition-colors opacity-75"
            style={{ backgroundColor: theme.hex }}
          />
        )}
      </div>

      {/* Card Header: Section Type, Color Picker, Time Range & Bars */}
      <div>
        <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="relative inline-flex items-center w-auto">
                <select
                  value={section.type}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setCustomNameInput('Custom Section');
                      setIsCustomModalOpen(true);
                    } else if (val === 'custom_prompt') {
                      setCustomNameInput(section.type === 'custom' ? section.label : 'Custom Section');
                      setIsCustomModalOpen(true);
                    } else {
                      onUpdate({ type: val as SectionType });
                    }
                  }}
                  className={`inline-flex items-center w-auto text-xs font-bold px-2 py-0.5 rounded shadow-2xs transition-all appearance-none cursor-pointer pr-5 pl-2 ${
                    theme.badgeClass || config.badgeBg
                  }`}
                  style={theme.badgeStyle}
                  title="Click to change section type"
                >
                  <option value={section.type} disabled hidden>
                    {section.label}
                  </option>
                  <option value="verse">Verse</option>
                  <option value="chorus">Chorus / Hook</option>
                  <option value="pre_chorus">Pre-Chorus</option>
                  <option value="bridge">Bridge</option>
                  <option value="intro">Intro</option>
                  <option value="outro">Outro</option>
                  <option value="interlude">Interlude</option>
                  <option value="instrumental_solo">Instrumental Solo</option>
                  <option value="down_chorus">Post-Chorus</option>
                  <option value="custom">Custom Section</option>
                  {section.type === 'custom' && (
                    <option value="custom_prompt">✏️ Change Custom Song Section Name...</option>
                  )}
                </select>
                <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold">
                  ▼
                </div>
              </div>

              {/* Section Visual Color Picker */}
              <SectionColorPicker
                section={section}
                onUpdateColor={(newColor) => onUpdate({ color: newColor })}
                onUpdateAllOfType={onUpdateAllOfType}
              />

              {/* Active Playing Status Badge */}
              {isCurrentlyActive && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs transition-all ${
                    isCurrentlyPlaying
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                      : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <span className="flex items-end gap-0.5 h-2.5">
                        <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" />
                        <span className="w-0.5 h-2.5 bg-emerald-500 rounded-full animate-[bounce_0.4s_ease-in-out_infinite_0.15s]" />
                        <span className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.3s]" />
                      </span>
                      <span>Now Playing</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Paused</span>
                    </>
                  )}
                </span>
              )}

              <button
                type="button"
                onClick={onPlaySection}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer ml-auto sm:ml-0"
                title="Play this section"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

            {/* Timecode display with double-click to edit support (Prompt Requirement!) */}
            {!isEditingTimecode ? (
              <div className="space-y-1.5 mt-1.5">
                <div
                  onDoubleClick={handleStartEditingTimecode}
                  className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400 group/time cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Double-click to edit time codes"
                >
                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded group-hover/time:bg-indigo-50 dark:group-hover/time:bg-indigo-950/40 group-hover/time:text-indigo-600 dark:group-hover/time:text-indigo-400 transition-colors">
                    {formatTimecode(section.startTime)} - {formatTimecode(section.endTime)}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {section.calculatedBars} Bars
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditingTimecode();
                    }}
                    className="opacity-0 group-hover/time:opacity-100 text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-opacity"
                    title="Edit time codes"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              /* Inline Timecode Editor */
              <div className="mt-1.5 p-2 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">Start</span>
                    <input
                      type="text"
                      value={tempStartTime}
                      onChange={(e) => setTempStartTime(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTimecode();
                        if (e.key === 'Escape') handleCancelTimecode();
                      }}
                      autoFocus
                      placeholder="0:00"
                      className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-center"
                    />
                  </div>
                  <span className="text-slate-400 font-bold mt-3">-</span>
                  <div className="flex-1">
                    <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">End</span>
                    <input
                      type="text"
                      value={tempEndTime}
                      onChange={(e) => setTempEndTime(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTimecode();
                        if (e.key === 'Escape') handleCancelTimecode();
                      }}
                      placeholder="0:30"
                      className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    <button
                      type="button"
                      onClick={handleSaveTimecode}
                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                      title="Save Timecode (Enter)"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelTimecode}
                      className="p-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Cancel (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {timecodeError && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{timecodeError}</p>
                )}
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block">
                  Tip: Enter mm:ss (e.g. 1:15) or seconds (e.g. 75). Press Enter to apply.
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
            title="Delete this section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Section Analysis Copy / Paste Action Bar (Positioned directly above analysis sliders) */}
        <div className="mb-3 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-750 rounded-xl flex items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 select-none">
            Section Analysis
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleLocalCopy}
              className={`px-2.5 py-1 border rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer ${
                justCopied
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
              title={`Copy analysis details (ratings & instruments) from ${section.label}`}
            >
              {justCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-indigo-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onPasteAnalysis}
              disabled={!copiedAnalysis}
              className={`px-2.5 py-1 border rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-all ${
                copiedAnalysis
                  ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white cursor-pointer shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
              }`}
              title={
                copiedAnalysis
                  ? `Paste analysis details from ${copiedAnalysis.sourceLabel || 'copied section'} into ${section.label}`
                  : 'Copy another section first to paste details here'
              }
            >
              <ClipboardPaste className="w-3 h-3" />
              <span>Paste</span>
            </button>
          </div>
        </div>

        {/* 4 Linear Scale / Rating Sliders (Prompt Requirement) */}
        <div className="space-y-3 mb-4">
          {/* 1. Excitement / Energy Level */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <span>1) Excitement / Energy Level</span>
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {section.energyLevel}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={section.energyLevel}
              onChange={(e) => onUpdate({ energyLevel: Number(e.target.value), modifiedScales: { ...(section.modifiedScales || {}), energyLevel: true } })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Mellow/Quiet</span>
              <span>Moderate</span>
              <span>Explosive Peak</span>
            </div>
          </div>

          {/* 2. Rhythmic Drive / Momentum */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>2) Rhythmic Drive / Momentum</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {section.rhythmicDrive}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={section.rhythmicDrive}
              onChange={(e) => onUpdate({ rhythmicDrive: Number(e.target.value), modifiedScales: { ...(section.modifiedScales || {}), rhythmicDrive: true } })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Floating/Loose</span>
              <span>Steady Groove</span>
              <span>Driving Pulse</span>
            </div>
          </div>

          {/* 3. Vocalist Lyrical/Melodic/Flow Complexity + Checkbox */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>3) Vocalist Lyrical/Melodic/Flow Complexity</span>
              {section.hasVocals ? (
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {section.vocalComplexity}/10
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Instrumental</span>
              )}
            </div>

            {/* Vocal checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mb-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!section.hasVocals}
                onChange={(e) => onUpdate({ hasVocals: !e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-medium">No vocals in this section (Instrumental only)</span>
            </label>

            {section.hasVocals && (
              <>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={section.vocalComplexity}
                  onChange={(e) => onUpdate({ vocalComplexity: Number(e.target.value), modifiedScales: { ...(section.modifiedScales || {}), vocalComplexity: true } })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                  <span>Simple/Repetitive</span>
                  <span>Moderate Complexity</span>
                  <span>Intricate Flow/High Virtuosity</span>
                </div>
              </>
            )}
          </div>

          {/* 4. Instrumental / Textural Density */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>4) Instrumental / Textural Density</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {section.textureDensity}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={section.textureDensity}
              onChange={(e) => onUpdate({ textureDensity: Number(e.target.value), modifiedScales: { ...(section.modifiedScales || {}), textureDensity: true } })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Sparse (1-2 Insts)</span>
              <span>Medium Layering</span>
              <span>Full Wall of Sound</span>
            </div>
          </div>
        </div>

        {/* Text Box for Additional Details & Instrumentation */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            What instruments do you hear?
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 leading-relaxed">
            Start with the suggestions below and add anything else you hear. Gold stars for qualitative description (e.g. &quot;distorted electric guitar,&quot; &quot;wobbling synth bass&quot; or &quot;chopped up soul sample&quot;).
          </p>

          <textarea
            rows={3}
            value={section.instrumentationNotes}
            onChange={(e) => onUpdate({ instrumentationNotes: e.target.value })}
            placeholder='e.g. Distorted electric guitar, wobbling synth bass enters at bar 4, punchy trap hi-hats, chopped up soul sample...'
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-sans leading-relaxed"
          />

          {/* Quick Instrument Suggestion Buttons (Informed by Genre, with +vocals always first, and +sample for Hip Hop) */}
          <div className="mt-2">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Add Instruments ({genre || 'Generic'} Suggestions):
            </span>
            <div className="flex flex-wrap gap-1">
              {instrumentSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddInstrument(tag)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-slate-800 dark:text-slate-100">
            <h4 className="text-base font-bold font-['Outfit'] mb-2">
              {section.type === 'custom' ? 'Change Custom Song Section Name' : 'Name Your Custom Section'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {section.type === 'custom'
                ? 'Enter a custom name for this song section:'
                : 'Enter a custom name for this section (e.g. "Intro Interlude", "Vocal Breakdown", "Synth Outro").'}
            </p>
            <input
              type="text"
              value={customNameInput}
              onChange={(e) => setCustomNameInput(e.target.value)}
              placeholder="e.g. Pre-Verse Interlude"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4 font-['Outfit']"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (customNameInput.trim()) {
                    const isNewCustom = section.type !== 'custom';
                    onUpdate({
                      type: 'custom',
                      label: customNameInput.trim(),
                      ...(isNewCustom ? { color: 'amber' } : {})
                    });
                    setIsCustomModalOpen(false);
                  }
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customNameInput.trim()) {
                    const isNewCustom = section.type !== 'custom';
                    onUpdate({
                      type: 'custom',
                      label: customNameInput.trim(),
                      ...(isNewCustom ? { color: 'amber' } : {})
                    });
                    setIsCustomModalOpen(false);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {section.type === 'custom' ? 'Save Name' : 'Create Custom Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

