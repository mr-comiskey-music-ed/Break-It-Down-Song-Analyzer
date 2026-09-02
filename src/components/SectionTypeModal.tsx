import React from 'react';
import { SectionType } from '../types';
import { SECTION_CONFIGS, formatTimecode } from '../utils/musicTheory';
import { getSectionIconComponent } from './SectionIcons';
import { X, Sparkles, Layers } from 'lucide-react';

interface SectionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: SectionType, customLabel?: string) => void;
  targetTimecode: number;
  existingSectionCount: {
    verses: number;
    choruses: number;
    bridges: number;
    intros: number;
    outros: number;
    preChoruses: number;
  };
}

export function SectionTypeModal({
  isOpen,
  onClose,
  onSelectType,
  targetTimecode,
  existingSectionCount,
}: SectionTypeModalProps) {
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customName, setCustomName] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setShowCustomInput(false);
      setCustomName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sectionOptions: {
    type: SectionType;
    label: string;
    description: string;
    color: string;
    nextNumber?: number;
  }[] = [
    {
      type: 'intro',
      label: existingSectionCount.intros === 0 ? 'Intro' : `Intro ${existingSectionCount.intros + 1}`,
      description: SECTION_CONFIGS.intro.description,
      color: 'border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-slate-500',
    },
    {
      type: 'verse',
      label: `Verse ${existingSectionCount.verses + 1}`,
      description: SECTION_CONFIGS.verse.description,
      color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 hover:border-blue-500',
      nextNumber: existingSectionCount.verses + 1,
    },
    {
      type: 'pre_chorus',
      label: existingSectionCount.preChoruses === 0 ? 'Pre-Chorus/Pre-Hook' : `Pre-Chorus/Pre-Hook ${existingSectionCount.preChoruses + 1}`,
      description: SECTION_CONFIGS.pre_chorus.description,
      color: 'border-purple-400 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-200 hover:border-purple-500',
    },
    {
      type: 'chorus',
      label: existingSectionCount.choruses === 0 ? 'Chorus/Hook' : `Chorus/Hook ${existingSectionCount.choruses + 1}`,
      description: SECTION_CONFIGS.chorus.description,
      color: 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 hover:border-rose-500',
      nextNumber: existingSectionCount.choruses + 1,
    },
    {
      type: 'bridge',
      label: existingSectionCount.bridges === 0 ? 'Bridge' : `Bridge ${existingSectionCount.bridges + 1}`,
      description: SECTION_CONFIGS.bridge.description,
      color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 hover:border-emerald-500',
    },
    {
      type: 'outro',
      label: existingSectionCount.outros === 0 ? 'Outro' : `Outro ${existingSectionCount.outros + 1}`,
      description: SECTION_CONFIGS.outro.description,
      color: 'border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-slate-500',
    },
    {
      type: 'interlude',
      label: 'Interlude',
      description: SECTION_CONFIGS.interlude.description,
      color: 'border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-slate-500',
    },
    {
      type: 'instrumental_solo',
      label: 'Instrumental Solo',
      description: SECTION_CONFIGS.instrumental_solo.description,
      color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 hover:border-orange-500',
    },
    {
      type: 'down_chorus',
      label: 'Post-Chorus',
      description: SECTION_CONFIGS.down_chorus.description,
      color: 'border-pink-400 bg-pink-50 dark:bg-pink-950/30 text-pink-800 dark:text-pink-200 hover:border-pink-500',
    },
    {
      type: 'custom',
      label: 'Custom Section',
      description: SECTION_CONFIGS.custom.description,
      color: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 hover:border-amber-500',
    },
  ];

  const handleSelect = (type: SectionType, label: string) => {
    if (type === 'custom') {
      setShowCustomInput(true);
      return;
    }
    onSelectType(type, label);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onSelectType('custom', customName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight">
              Select Song Section Type
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Starting at timecode <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatTimecode(targetTimecode)}</span>
            </p>
          </div>
        </div>

        {showCustomInput ? (
          <form onSubmit={handleCustomSubmit} className="mt-4 space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl">
              <label className="block text-sm font-bold font-['Outfit'] mb-1.5 text-amber-900 dark:text-amber-200">
                Name Your Custom Section
              </label>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mb-3">
                Enter a custom name for this section (e.g. "Intro Interlude", "Vocal Breakdown", "Synth Outro").
              </p>
              <input
                type="text"
                autoFocus
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Pre-Verse Interlude"
                className="w-full px-3.5 py-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-['Outfit']"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Options
              </button>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors shadow-xs"
              >
                Create Custom Section
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Choose the musical section that starts at this point in the song. Verses and Chorus/Hooks will automatically number sequentially.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sectionOptions.map((opt) => {
                const IconComp = getSectionIconComponent(opt.type);
                return (
                  <button
                    key={opt.type + opt.label}
                    id={`select-section-${opt.type}`}
                    onClick={() => handleSelect(opt.type, opt.label)}
                    className={`flex flex-col items-start text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${opt.color}`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="inline-flex items-center gap-2 font-bold text-sm sm:text-base font-['Outfit']">
                        {IconComp ? React.createElement(IconComp, { className: "w-4 h-4" }) : null}
                        {opt.label}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                        {opt.type === 'chorus' ? 'HOOK' : opt.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs opacity-85 line-clamp-2 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
