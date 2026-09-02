import React, { useState, useRef, useEffect } from 'react';
import { SongSection, SectionType } from '../types';
import {
  COLOR_PRESETS,
  ColorPreset,
  getSectionColorTheme,
  SECTION_CONFIGS,
} from '../utils/musicTheory';
import { Palette, Check, RotateCcw, X, Sparkles } from 'lucide-react';

interface SectionColorPickerProps {
  section: SongSection;
  onUpdateColor: (color: string) => void;
  onUpdateAllOfType?: (color: string) => void;
}

export function SectionColorPicker({ section, onUpdateColor, onUpdateAllOfType }: SectionColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const theme = getSectionColorTheme(section);
  const defaultConfig = SECTION_CONFIGS[section.type] || SECTION_CONFIGS.verse;
  const defaultPreset = COLOR_PRESETS.find((p) => p.id === defaultConfig.colorName) || COLOR_PRESETS[0];

  // Current color hex or active preset
  const currentHex = theme.hex;
  const isDefaultColor =
    !section.color ||
    section.color === defaultConfig.colorName ||
    section.color.toLowerCase() === defaultPreset.hex.toLowerCase();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectPreset = (preset: ColorPreset) => {
    onUpdateColor(preset.id);
    setIsOpen(false);
  };

  const handleResetToDefault = () => {
    onUpdateColor(defaultConfig.colorName);
    setIsOpen(false);
  };

  const handleSetTypeDefault = () => {
    if (onUpdateAllOfType) {
      onUpdateAllOfType(currentHex);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Color Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title={`Change visual color for ${section.label} (Current: ${currentHex})`}
      >
        <span
          className="w-3 h-3 rounded-full border border-white/60 shadow-xs shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: currentHex }}
        />
        <Palette className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
      </button>

      {/* Color Palette Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2.5 space-y-2.5 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border border-white/40 shadow-xs"
                style={{ backgroundColor: currentHex }}
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Section Color
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Preset Colors Grid */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Preset Palette:
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {COLOR_PRESETS.map((preset) => {
                const isSelected =
                  section.color === preset.id ||
                  section.color?.toLowerCase() === preset.hex.toLowerCase() ||
                  (!section.color && preset.id === defaultConfig.colorName);

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer group shadow-2xs ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 scale-105'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={`${preset.name} (${preset.hex})`}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-white drop-shadow-sm stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Set as Default & Reset */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <button
              type="button"
              onClick={handleSetTypeDefault}
              className="w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800/60"
              title={`Apply ${currentHex} to all ${defaultConfig.label} sections`}
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Set as {defaultConfig.label} Default</span>
            </button>

            {!isDefaultColor && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="w-full py-1 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset to Default</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
