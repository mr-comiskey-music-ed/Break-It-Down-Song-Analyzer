import React, { useMemo } from 'react';
import { SongMetadata, SongSection } from '../types';
import { SECTION_CONFIGS, formatTimecode } from '../utils/musicTheory';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Activity, ArrowLeft, GitCompare, Music2, Sparkles, Clock, Layers } from 'lucide-react';

interface SongComparisonViewProps {
  songA: {
    metadata: SongMetadata;
    sections: SongSection[];
    studentName?: string;
  };
  songB: {
    metadata: SongMetadata;
    sections: SongSection[];
    studentName?: string;
  };
  onClose: () => void;
}

export function SongComparisonView({ songA, songB, onClose }: SongComparisonViewProps) {
  const metaA = (songA?.metadata || {}) as SongMetadata;
  const metaB = (songB?.metadata || {}) as SongMetadata;
  const secsA = songA?.sections || [];
  const secsB = songB?.sections || [];

  // Compute summary metrics for Song A & B
  const metricsA = useMemo(() => computeMetrics(secsA), [secsA]);
  const metricsB = useMemo(() => computeMetrics(secsB), [secsB]);

  // Determine which song has smaller average values overall so we render it LAST (in front)
  const avgTotalA = (metricsA.avgIntensity + metricsA.avgRhythmicDrive + metricsA.avgTextureDensity) / 3;
  const avgTotalB = (metricsB.avgIntensity + metricsB.avgRhythmicDrive + metricsB.avgTextureDensity) / 3;
  const isBSmaller = avgTotalB <= avgTotalA;

  const radarData = [
    {
      axis: 'Intensity',
      songA: metricsA.avgIntensity,
      songB: metricsB.avgIntensity,
      fullMark: 10,
    },
    {
      axis: 'Rhythmic Drive',
      songA: metricsA.avgRhythmicDrive,
      songB: metricsB.avgRhythmicDrive,
      fullMark: 10,
    },
    {
      axis: 'Texture Density',
      songA: metricsA.avgTextureDensity,
      songB: metricsB.avgTextureDensity,
      fullMark: 10,
    },
  ];

  // Qualitative comparison synthesis including emotional/energetic intent
  const qualitativeAnalysis = useMemo(() => {
    const diffIntensity = metricsA.avgIntensity - metricsB.avgIntensity;
    const diffRhythm = metricsA.avgRhythmicDrive - metricsB.avgRhythmicDrive;

    const titleA = metaA.title || 'Song A';
    const titleB = metaB.title || 'Song B';

    let summary = `Comparative Intent & Architecture Analysis between ${titleA} (${metaA.genre || 'Pop'}, ${metaA.bpm || '---'} BPM) and ${titleB} (${metaB.genre || 'Pop'}, ${metaB.bpm || '---'} BPM):\n\n`;
    
    if (Math.abs(diffIntensity) < 0.5) {
      summary += `• Energy & Emotional Arc: Both tracks target a balanced emotional plateau (~${metricsA.avgIntensity}/10 average intensity), but utilize contrasting structural curves to engage the listener. `;
    } else if (diffIntensity > 0) {
      summary += `• Energy & Emotional Arc: ${titleA} maintains a higher sustained energetic momentum (${metricsA.avgIntensity} vs ${metricsB.avgIntensity}) with purposeful dynamic peaks designed for high-engagement delivery. In contrast, ${titleB} adopts a more restrained, dynamic contour. `;
    } else {
      summary += `• Energy & Emotional Arc: ${titleB} drives greater overall acoustic power and intensity momentum (${metricsB.avgIntensity} vs ${metricsA.avgIntensity}), whereas ${titleA} prioritizes atmospheric and spacious pacing. `;
    }

    if (diffRhythm > 0.6) {
      summary += `• Rhythmic Intent & Groove: ${titleA} relies heavier on forward-propelling transient drive and rhythmic density to anchor listener focus. `;
    } else if (diffRhythm < -0.6) {
      summary += `• Rhythmic Intent & Groove: ${titleB} establishes a sharper rhythmic pulse, emphasizing syncopation and beat subdivision. `;
    } else {
      summary += `• Rhythmic Intent & Groove: Both compositions share comparable groove velocity and rhythmic pulse density. `;
    }

    summary += `\n• Form & Structural Strategy: ${titleA} is mapped across ${metricsA.sectionCount} sections over ${Math.round(metricsA.totalDuration)}s, while ${titleB} spans ${metricsB.sectionCount} sections over ${Math.round(metricsB.totalDuration)}s. The arrangement choices reflect distinct decisions in building anticipation, releasing tension, and texture layering.`;

    return summary;
  }, [metaA, metaB, metricsA, metricsB]);

  // Instrumentation summary extractor
  const instrumentationA = useMemo(() => {
    const notes = secsA.map((s) => s.instrumentationNotes).filter(Boolean);
    return notes.length > 0 ? notes.join(' • ') : 'Standard instrumentation (Vocals, Drums, Bass, Guitars/Keys)';
  }, [secsA]);

  const instrumentationB = useMemo(() => {
    const notes = secsB.map((s) => s.instrumentationNotes).filter(Boolean);
    return notes.length > 0 ? notes.join(' • ') : 'Standard instrumentation (Vocals, Drums, Bass, Guitars/Keys)';
  }, [secsB]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Comparison Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-['Outfit'] tracking-tight">
                Side-by-Side Song Comparison
              </h2>
              <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                Comparative Analysis Mode
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Comparing <span className="font-semibold text-white">{metaA.title || 'Song A'}</span> ({songA?.studentName || 'Student'}) vs <span className="font-semibold text-white">{metaB.title || 'Song B'}</span> ({songB?.studentName || 'Imported'})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Comparison & Return</span>
        </button>
      </div>

      {/* 1. Condensed Song Assignment Information (Song, Artist, & Genre side-by-side) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Music2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit']">
            Song Assignment Information (Condensed)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Song A Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Song A (Active)
              </span>
              <span className="text-xs font-mono text-slate-500">
                {songA?.studentName ? `Student: ${songA.studentName}` : ''}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {metaA.title || 'Untitled Song'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Artist: <span className="text-slate-800 dark:text-slate-200">{metaA.artist || 'Unknown Artist'}</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Genre: <span className="text-slate-800 dark:text-slate-200">{metaA.genre || 'Pop'}</span> {metaA.bpm ? `• ${metaA.bpm} BPM` : ''}
              </p>
            </div>
          </div>

          {/* Song B Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Song B (Imported)
              </span>
              <span className="text-xs font-mono text-slate-500">
                {songB?.studentName ? `Student: ${songB.studentName}` : ''}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {metaB.title || 'Untitled Song'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Artist: <span className="text-slate-800 dark:text-slate-200">{metaB.artist || 'Unknown Artist'}</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Genre: <span className="text-slate-800 dark:text-slate-200">{metaB.genre || 'Pop'}</span> {metaB.bpm ? `• ${metaB.bpm} BPM` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Song Sonic Profile (Radar, Numeric Breakdown, Intent) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-['Outfit']">
              Song Sonic Profile & Comparative Analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Radar visualization, numeric breakdowns, and emotional/energetic intent.
            </p>
          </div>
        </div>

        {/* Grid: Radar Chart & Numeric Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Radar Visualization */}
          <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Sonic Profile Radar Overlay
            </span>
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  {isBSmaller ? (
                    <>
                      <Radar name={metaA.title || 'Song A'} dataKey="songA" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                      <Radar name={metaB.title || 'Song B'} dataKey="songB" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} strokeWidth={2.5} />
                    </>
                  ) : (
                    <>
                      <Radar name={metaB.title || 'Song B'} dataKey="songB" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                      <Radar name={metaA.title || 'Song A'} dataKey="songA" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} strokeWidth={2.5} />
                    </>
                  )}
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300">{metaA.title || 'Song A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-700 dark:text-slate-300">{metaB.title || 'Song B'}</span>
              </div>
            </div>
          </div>

          {/* Numeric Breakdown Side-by-Side */}
          <div className="lg:col-span-6 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Numeric Metric Breakdown
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="py-2 px-3 font-semibold">Metric</th>
                    <th className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">{metaA.title || 'Song A'}</th>
                    <th className="py-2 px-3 font-semibold text-amber-600 dark:text-amber-400">{metaB.title || 'Song B'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-700 dark:text-slate-300">Sections Mapped</td>
                    <td className="py-2 px-3 font-bold">{metricsA.sectionCount}</td>
                    <td className="py-2 px-3 font-bold">{metricsB.sectionCount}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-700 dark:text-slate-300">Total Duration</td>
                    <td className="py-2 px-3">{Math.floor(metricsA.totalDuration / 60)}m {Math.round(metricsA.totalDuration % 60)}s</td>
                    <td className="py-2 px-3">{Math.floor(metricsB.totalDuration / 60)}m {Math.round(metricsB.totalDuration % 60)}s</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-700 dark:text-slate-300">Avg Intensity (1-10)</td>
                    <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{metricsA.avgIntensity}</td>
                    <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{metricsB.avgIntensity}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-700 dark:text-slate-300">Avg Rhythmic Drive (1-10)</td>
                    <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{metricsA.avgRhythmicDrive}</td>
                    <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{metricsB.avgRhythmicDrive}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-700 dark:text-slate-300">Avg Texture Density (1-10)</td>
                    <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{metricsA.avgTextureDensity}</td>
                    <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{metricsB.avgTextureDensity}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-700 dark:text-slate-300">Tempo / BPM</td>
                    <td className="py-2 px-3">{metaA.bpm || '---'} BPM</td>
                    <td className="py-2 px-3">{metaB.bpm || '---'} BPM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Emotional, Energetic & Musical Intent Analysis */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Emotional, Energetic & Musical Intent Analysis</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line">
            {qualitativeAnalysis}
          </p>
        </div>
      </div>

      {/* 3. Song Timelines & Section Order/Usage Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-['Outfit']">
              Timeline, Section Sequence & Form Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparing structural ordering, section progression, and relative timeline distribution.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Song A Timeline & Order */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {metaA.title || 'Song A'} — Section Flow ({secsA.length} Sections)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Total: {Math.round(metricsA.totalDuration)}s
              </span>
            </div>

            {/* Visual Timeline Bar A */}
            <div className="relative h-8 bg-slate-200 dark:bg-slate-900 rounded-lg overflow-hidden flex">
              {secsA.map((sec, idx) => {
                const totalD = Math.max(1, metricsA.totalDuration);
                const secDur = Math.max(0.1, sec.endTime - sec.startTime);
                const widthPct = (secDur / totalD) * 100;
                const cfg = SECTION_CONFIGS[sec.type] || SECTION_CONFIGS['custom'];
                return (
                  <div
                    key={`tline-a-${sec.id || idx}`}
                    style={{ width: `${widthPct}%` }}
                    className={`h-full border-r border-white/20 flex items-center justify-center text-[10px] font-bold text-white px-1 truncate ${cfg.bg}`}
                    title={`${sec.label} (${formatTimecode(sec.startTime)} - ${formatTimecode(sec.endTime)})`}
                  >
                    <span className="truncate">{sec.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Section Sequence List A */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {secsA.map((sec, idx) => (
                <div key={`seq-a-${sec.id || idx}`} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sec.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                    <span>{formatTimecode(sec.startTime)} - {formatTimecode(sec.endTime)}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">Energy: {sec.energyLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Song B Timeline & Order */}
          <div className="space-y-3 bg-amber-50/40 dark:bg-slate-950/50 border border-amber-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {metaB.title || 'Song B'} — Section Flow ({secsB.length} Sections)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Total: {Math.round(metricsB.totalDuration)}s
              </span>
            </div>

            {/* Visual Timeline Bar B */}
            <div className="relative h-8 bg-slate-200 dark:bg-slate-900 rounded-lg overflow-hidden flex">
              {secsB.map((sec, idx) => {
                const totalD = Math.max(1, metricsB.totalDuration);
                const secDur = Math.max(0.1, sec.endTime - sec.startTime);
                const widthPct = (secDur / totalD) * 100;
                const cfg = SECTION_CONFIGS[sec.type] || SECTION_CONFIGS['custom'];
                return (
                  <div
                    key={`tline-b-${sec.id || idx}`}
                    style={{ width: `${widthPct}%` }}
                    className={`h-full border-r border-white/20 flex items-center justify-center text-[10px] font-bold text-white px-1 truncate ${cfg.bg}`}
                    title={`${sec.label} (${formatTimecode(sec.startTime)} - ${formatTimecode(sec.endTime)})`}
                  >
                    <span className="truncate">{sec.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Section Sequence List B */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {secsB.map((sec, idx) => (
                <div key={`seq-b-${sec.id || idx}`} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sec.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                    <span>{formatTimecode(sec.startTime)} - {formatTimecode(sec.endTime)}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Energy: {sec.energyLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Instrumentation & Texture Intent Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-['Outfit']">
              Instrumentation & Arrangement Texture Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparing instrumentation choices, timbre density, and sonic layering decisions across songs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Song A Instrumentation Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {metaA.title || 'Song A'} Instrumentation Profile
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Avg Texture: {metricsA.avgTextureDensity}/10
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {instrumentationA}
            </p>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Arrangement Intent:</div>
              <div>Designed with an average texture density of {metricsA.avgTextureDensity}/10 and rhythmic pulse of {metricsA.avgRhythmicDrive}/10 to shape emotional delivery.</div>
            </div>
          </div>

          {/* Song B Instrumentation Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {metaB.title || 'Song B'} Instrumentation Profile
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Avg Texture: {metricsB.avgTextureDensity}/10
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {instrumentationB}
            </p>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Arrangement Intent:</div>
              <div>Configured with an average texture density of {metricsB.avgTextureDensity}/10 and rhythmic pulse of {metricsB.avgRhythmicDrive}/10 to create contrasting sonic contrast.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeMetrics(sections: SongSection[]) {
  if (!sections || sections.length === 0) {
    return {
      avgIntensity: 0,
      avgRhythmicDrive: 0,
      avgTextureDensity: 0,
      totalDuration: 0,
      sectionCount: 0,
    };
  }

  let totalDuration = 0;
  let weightedIntensity = 0;
  let weightedRhythm = 0;
  let weightedTexture = 0;

  sections.forEach((sec) => {
    const dur = Math.max(0.1, sec.endTime - sec.startTime);
    totalDuration += dur;
    weightedIntensity += (sec.energyLevel ?? 5) * dur;
    weightedRhythm += (sec.rhythmicDrive ?? 5) * dur;
    weightedTexture += (sec.textureDensity ?? 5) * dur;
  });

  const count = sections.length;
  return {
    avgIntensity: Number((weightedIntensity / Math.max(1, totalDuration)).toFixed(1)),
    avgRhythmicDrive: Number((weightedRhythm / Math.max(1, totalDuration)).toFixed(1)),
    avgTextureDensity: Number((weightedTexture / Math.max(1, totalDuration)).toFixed(1)),
    totalDuration,
    sectionCount: count,
  };
}
