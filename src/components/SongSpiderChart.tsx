import React, { useMemo, useState } from 'react';
import { SongSection } from '../types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Activity,
  Flame,
  Gauge,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { getSectionColorTheme } from '../utils/musicTheory';

interface SongSpiderChartProps {
  sections: SongSection[];
  currentTime?: number;
  selectedSectionId?: string | null;
  songTitle?: string;
  artist?: string;
}

export function SongSpiderChart({
  sections,
  currentTime = 0,
  selectedSectionId = null,
  songTitle = 'Current Song',
  artist = '',
}: SongSpiderChartProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showActiveComparison, setShowActiveComparison] = useState(true);

  // Active playing section based on currentTime
  const activePlayingSection = useMemo(() => {
    return sections.find((s) => currentTime >= s.startTime && currentTime < s.endTime) || null;
  }, [sections, currentTime]);

  // Comparison section (selected section or currently active playing section)
  const comparisonSection = useMemo(() => {
    if (selectedSectionId) {
      return sections.find((s) => s.id === selectedSectionId) || activePlayingSection;
    }
    return activePlayingSection;
  }, [sections, selectedSectionId, activePlayingSection]);

  // Calculate Averages (Intensity, Rhythmic Drive, Texture Density)
  const summaryMetrics = useMemo(() => {
    if (!sections || sections.length === 0) {
      return {
        avgIntensity: 0,
        avgRhythmicDrive: 0,
        avgTextureDensity: 0,
        totalDuration: 0,
        sectionCount: 0,
        maxIntensitySection: null as SongSection | null,
        minIntensitySection: null as SongSection | null,
      };
    }

    let totalDuration = 0;
    let sumIntensity = 0;
    let sumRhythm = 0;
    let sumTexture = 0;

    let weightedIntensity = 0;
    let weightedRhythm = 0;
    let weightedTexture = 0;

    let maxSec: SongSection = sections[0];
    let minSec: SongSection = sections[0];

    sections.forEach((sec) => {
      const dur = Math.max(0.1, sec.endTime - sec.startTime);
      totalDuration += dur;

      sumIntensity += sec.energyLevel ?? 5;
      sumRhythm += sec.rhythmicDrive ?? 5;
      sumTexture += sec.textureDensity ?? 5;

      weightedIntensity += (sec.energyLevel ?? 5) * dur;
      weightedRhythm += (sec.rhythmicDrive ?? 5) * dur;
      weightedTexture += (sec.textureDensity ?? 5) * dur;

      if ((sec.energyLevel ?? 5) > (maxSec.energyLevel ?? 5)) {
        maxSec = sec;
      }
      if ((sec.energyLevel ?? 5) < (minSec.energyLevel ?? 5)) {
        minSec = sec;
      }
    });

    const count = sections.length;
    const avgIntensity = totalDuration > 0 ? weightedIntensity / totalDuration : sumIntensity / count;
    const avgRhythmicDrive = totalDuration > 0 ? weightedRhythm / totalDuration : sumRhythm / count;
    const avgTextureDensity = totalDuration > 0 ? weightedTexture / totalDuration : sumTexture / count;

    return {
      avgIntensity: Number(avgIntensity.toFixed(1)),
      avgRhythmicDrive: Number(avgRhythmicDrive.toFixed(1)),
      avgTextureDensity: Number(avgTextureDensity.toFixed(1)),
      totalDuration,
      sectionCount: count,
      maxIntensitySection: maxSec,
      minIntensitySection: minSec,
    };
  }, [sections]);

  // Qualitative interpretations based on song averages
  const descriptors = useMemo(() => {
    const { avgIntensity, avgRhythmicDrive, avgTextureDensity } = summaryMetrics;

    const intensityDesc =
      avgIntensity >= 8
        ? 'Explosive High Energy'
        : avgIntensity >= 6
        ? 'Dynamic & Driving'
        : avgIntensity >= 4
        ? 'Moderate & Balanced'
        : 'Subtle & Atmospheric';

    const rhythmDesc =
      avgRhythmicDrive >= 8
        ? 'Relentless Groove'
        : avgRhythmicDrive >= 6
        ? 'Strong Steady Pulse'
        : avgRhythmicDrive >= 4
        ? 'Moderate Groove'
        : 'Floating / Rubato';

    const textureDesc =
      avgTextureDensity >= 8
        ? 'Dense Wall of Sound'
        : avgTextureDensity >= 6
        ? 'Rich Layered Arrangement'
        : avgTextureDensity >= 4
        ? 'Balanced Instrumentation'
        : 'Sparse & Acoustic';

    return { intensityDesc, rhythmDesc, textureDesc };
  }, [summaryMetrics]);

  // Spider / Radar Chart Data (Core 3 axes: Intensity, Rhythmic Drive, Texture Density)
  const radarData = useMemo(() => {
    const compTheme = comparisonSection ? getSectionColorTheme(comparisonSection) : null;

    return [
      {
        axis: 'Intensity',
        fullName: 'Average Intensity',
        songAverage: summaryMetrics.avgIntensity,
        comparison: comparisonSection ? (comparisonSection.energyLevel ?? 5) : undefined,
        fullMark: 10,
        icon: '🔥',
        description: 'Dynamic power and musical energy',
      },
      {
        axis: 'Rhythmic Drive',
        fullName: 'Rhythmic Drive',
        songAverage: summaryMetrics.avgRhythmicDrive,
        comparison: comparisonSection ? (comparisonSection.rhythmicDrive ?? 5) : undefined,
        fullMark: 10,
        icon: '⚡',
        description: 'Groove propulsion and tempo emphasis',
      },
      {
        axis: 'Texture Density',
        fullName: 'Texture Density',
        songAverage: summaryMetrics.avgTextureDensity,
        comparison: comparisonSection ? (comparisonSection.textureDensity ?? 5) : undefined,
        fullMark: 10,
        icon: '🌊',
        description: 'Layering richness and instrument thickness',
      },
    ];
  }, [summaryMetrics, comparisonSection]);

  const comparisonTheme = comparisonSection ? getSectionColorTheme(comparisonSection) : null;

  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <section
      id="song-summary-spider-chart-container"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs transition-all overflow-hidden"
      aria-label="Song Sonic Profile and Spider Chart"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Song Sonic Profile
              </h3>
              <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/60">
                Radar Summary
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-level spider chart of Intensity, Rhythmic Drive, and Texture Density across all {sections.length} sections
            </p>
          </div>
        </div>

        {/* Controls: Active section overlay & collapse */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Active section overlay toggle */}
          {comparisonSection && (
            <button
              type="button"
              onClick={() => setShowActiveComparison(!showActiveComparison)}
              className={`text-xs px-2.5 py-1 rounded-xl font-semibold border transition-all cursor-pointer ${
                showActiveComparison
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title="Toggle overlaying active section on spider chart"
            >
              Overlay: {comparisonSection.label}
            </button>
          )}

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse spider chart' : 'Expand spider chart'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Spider (Radar) Chart Canvas */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80">
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  data={radarData}
                  margin={{ top: 10, right: 25, bottom: 10, left: 25 }}
                >
                  {/* Spider Web Grid */}
                  <PolarGrid
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                  />

                  {/* Polar Axis Labels */}
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={({ x, y, payload }) => {
                      const item = radarData.find((d) => d.axis === payload.value);
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={4}
                            textAnchor="middle"
                            className="fill-slate-700 dark:fill-slate-200 text-xs font-bold font-['Plus_Jakarta_Sans']"
                          >
                            {payload.value}
                          </text>
                          {item && (
                            <text
                              x={0}
                              y={14}
                              textAnchor="middle"
                              className="fill-indigo-600 dark:fill-indigo-400 text-[10px] font-mono font-extrabold"
                            >
                              {item.songAverage}/10
                            </text>
                          )}
                        </g>
                      );
                    }}
                  />

                  {/* Radial Axis Scale (0 to 10) */}
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tickCount={6}
                    stroke="#94a3b8"
                    strokeOpacity={0.3}
                    tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                  />

                  {/* Tooltip */}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 space-y-1 z-50">
                            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                              <span>{data.icon}</span>
                              <span>{data.fullName}</span>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Song Average:{' '}
                              <span className="font-mono font-bold text-white text-xs">
                                {data.songAverage} / 10
                              </span>
                            </div>
                            {showActiveComparison && comparisonSection && data.comparison !== undefined && (
                              <div className="text-[11px] text-rose-300">
                                {comparisonSection.label}:{' '}
                                <span className="font-mono font-bold text-white text-xs">
                                  {data.comparison} / 10
                                </span>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 italic pt-0.5 border-t border-slate-800">
                              {data.description}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Determine which shape has smaller average values so we render it LAST (in front) */}
                  {(() => {
                    const avgSong = (summaryMetrics.avgIntensity + summaryMetrics.avgRhythmicDrive + summaryMetrics.avgTextureDensity) / 3;
                    const compSectionActive = showActiveComparison && comparisonSection;
                    const compVals = compSectionActive ? [comparisonSection.energyLevel ?? 5, comparisonSection.rhythmicDrive ?? 5, comparisonSection.textureDensity ?? 5] : [0,0,0];
                    const avgComp = compSectionActive ? (compVals[0] + compVals[1] + compVals[2]) / 3 : 0;
                    const isCompSmaller = compSectionActive && avgComp <= avgSong;

                    if (compSectionActive && isCompSmaller) {
                      return (
                        <>
                          <Radar
                            name="Song Average"
                            dataKey="songAverage"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="#6366f1"
                            fillOpacity={0.2}
                            isAnimationActive={true}
                            animationDuration={600}
                            dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                          />
                          <Radar
                            name={comparisonSection.label}
                            dataKey="comparison"
                            stroke={comparisonTheme?.hex || '#f43f5e'}
                            strokeWidth={2.5}
                            fill={comparisonTheme?.hex || '#f43f5e'}
                            fillOpacity={0.35}
                            isAnimationActive={true}
                            animationDuration={400}
                            dot={{ r: 4.5, fill: comparisonTheme?.hex || '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                          />
                        </>
                      );
                    } else if (compSectionActive) {
                      return (
                        <>
                          <Radar
                            name={comparisonSection.label}
                            dataKey="comparison"
                            stroke={comparisonTheme?.hex || '#f43f5e'}
                            strokeWidth={2}
                            fill={comparisonTheme?.hex || '#f43f5e'}
                            fillOpacity={0.2}
                            isAnimationActive={true}
                            animationDuration={400}
                            dot={{ r: 4.5, fill: comparisonTheme?.hex || '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                          />
                          <Radar
                            name="Song Average"
                            dataKey="songAverage"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            fill="#6366f1"
                            fillOpacity={0.35}
                            isAnimationActive={true}
                            animationDuration={600}
                            dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                          />
                        </>
                      );
                    } else {
                      return (
                        <Radar
                          name="Song Average"
                          dataKey="songAverage"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="#6366f1"
                          fillOpacity={0.3}
                          isAnimationActive={true}
                          animationDuration={600}
                          dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                        />
                      );
                    }
                  })()}
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend indicator */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-2xs inline-block" />
                <span>Overall Song Profile</span>
              </div>
              {showActiveComparison && comparisonSection && (
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full shadow-2xs inline-block"
                    style={{ backgroundColor: comparisonTheme?.hex || '#f43f5e' }}
                  />
                  <span>
                    Current: <strong className="text-slate-800 dark:text-slate-200">{comparisonSection.label}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Key Dimension Metrics & High-Level Narrative */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            {/* The 3 Core Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Average Intensity */}
              <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    Intensity
                  </span>
                  <span className="text-base font-mono font-extrabold text-rose-600 dark:text-rose-400">
                    {summaryMetrics.avgIntensity}
                    <span className="text-[10px] font-normal text-rose-400/80">/10</span>
                  </span>
                </div>
                {/* Visual meter bar */}
                <div className="w-full bg-rose-200/50 dark:bg-rose-900/40 h-1.5 rounded-full overflow-hidden my-2">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(summaryMetrics.avgIntensity / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-rose-800/80 dark:text-rose-300/80 leading-tight">
                  {descriptors.intensityDesc}
                </span>
              </div>

              {/* Average Rhythmic Drive */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-amber-500" />
                    Rhythm Drive
                  </span>
                  <span className="text-base font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    {summaryMetrics.avgRhythmicDrive}
                    <span className="text-[10px] font-normal text-amber-400/80">/10</span>
                  </span>
                </div>
                {/* Visual meter bar */}
                <div className="w-full bg-amber-200/50 dark:bg-amber-900/40 h-1.5 rounded-full overflow-hidden my-2">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(summaryMetrics.avgRhythmicDrive / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-amber-800/80 dark:text-amber-300/80 leading-tight">
                  {descriptors.rhythmDesc}
                </span>
              </div>

              {/* Average Texture Density */}
              <div className="bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-500" />
                    Texture Density
                  </span>
                  <span className="text-base font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                    {summaryMetrics.avgTextureDensity}
                    <span className="text-[10px] font-normal text-cyan-400/80">/10</span>
                  </span>
                </div>
                {/* Visual meter bar */}
                <div className="w-full bg-cyan-200/50 dark:bg-cyan-900/40 h-1.5 rounded-full overflow-hidden my-2">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(summaryMetrics.avgTextureDensity / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-cyan-800/80 dark:text-cyan-300/80 leading-tight">
                  {descriptors.textureDesc}
                </span>
              </div>
            </div>

            {/* High-Level Song Summary Callout */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Song Structure Takeaway</span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
                <p>
                  <strong>{songTitle}</strong> exhibits a{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {descriptors.intensityDesc.toLowerCase()}
                  </span>{' '}
                  character with{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {descriptors.rhythmDesc.toLowerCase()}
                  </span>{' '}
                  and a{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {descriptors.textureDesc.toLowerCase()}
                  </span>
                  .
                </p>

                {summaryMetrics.maxIntensitySection && summaryMetrics.minIntensitySection && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    ⚡ Dynamic Range: Peaks at{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {summaryMetrics.maxIntensitySection.label} (Energy {summaryMetrics.maxIntensitySection.energyLevel}/10)
                    </strong>
                    , with its softest valley in{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {summaryMetrics.minIntensitySection.label} (Energy {summaryMetrics.minIntensitySection.energyLevel}/10)
                    </strong>
                    .
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
