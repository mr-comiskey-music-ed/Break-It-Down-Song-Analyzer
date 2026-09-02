import React, { useMemo, useState } from 'react';
import { SongSection, SectionType } from '../types';
import { getSectionColorTheme, formatTimecode } from '../utils/musicTheory';
import { Zap, ArrowDown, TrendingUp, Music, Activity } from 'lucide-react';

interface TimelineWaveformOverlayProps {
  sections: SongSection[];
  totalTimelineDuration: number;
  currentTime: number;
  isPlaying: boolean;
  bpm: number | '';
  timeSignature: string;
  effectiveSongStart: number;
  effectiveSongEnd: number;
  onSeek?: (seconds: number) => void;
  opacity?: number; // 0 to 1
  styleMode?: 'spectrum' | 'contour' | 'bars';
}

export interface TransitionPoint {
  id: string;
  time: number;
  type: 'drop' | 'buildup' | 'breakdown' | 'rhythmic_shift' | 'energy_shift';
  label: string;
  deltaEnergy: number;
  fromSection: SongSection;
  toSection: SongSection;
}

/**
 * Generates deterministic pseudo-random audio waveform data points
 * using music theory parameters (energy level, rhythmic drive, texture density, section type, tempo).
 */
export function generateWaveformSamples(
  sections: SongSection[],
  totalDuration: number,
  sampleCount: number = 180,
  bpm: number | '' = 120
) {
  const effectiveBpm = typeof bpm === 'number' && bpm > 40 && bpm < 300 ? bpm : 120;
  const beatDuration = 60 / effectiveBpm;
  const step = totalDuration / sampleCount;

  const samples: {
    time: number;
    leftPct: number;
    amplitude: number; // 0.05 to 0.98
    rms: number;
    isTransientPeak: boolean;
    section: SongSection | null;
    color: string;
  }[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const time = i * step + step * 0.5;
    const leftPct = (time / totalDuration) * 100;

    // Find section containing this time point
    const section = sections.find((s) => time >= s.startTime && time < s.endTime) || null;

    if (!section) {
      // Ambient noise floor / silence outside of defined sections
      const noise = 0.05 + 0.03 * Math.sin(i * 0.4);
      samples.push({
        time,
        leftPct,
        amplitude: noise,
        rms: noise * 0.6,
        isTransientPeak: false,
        section: null,
        color: '#64748b',
      });
      continue;
    }

    const secDuration = Math.max(0.1, section.endTime - section.startTime);
    const progressInSection = (time - section.startTime) / secDuration;
    const theme = getSectionColorTheme(section);

    // Baseline metrics from 1-10 scale
    const baseEnergy = (section.energyLevel ?? 5) / 10;
    const baseRhythm = (section.rhythmicDrive ?? 5) / 10;
    const baseTexture = (section.textureDensity ?? 5) / 10;

    // Type-specific envelopes (e.g. builds crescendo, drops explode, breakdown hollows out)
    let envelopeMultiplier = 1.0;
    let transientBoost = 0;

    const labelLower = section.label.toLowerCase();
    const isBuild = labelLower.includes('build');
    const isDropOrChorus = section.type === 'chorus' || labelLower.includes('drop');
    const isBreakdownOrBridge = section.type === 'bridge' || labelLower.includes('break') || labelLower.includes('dip');

    if (isBuild) {
      // Progressive crescendo into the next section
      envelopeMultiplier = 0.5 + 0.7 * Math.pow(progressInSection, 1.6);
      // Snare roll / riser density increases near end
      if (progressInSection > 0.65) {
        transientBoost = 0.15 * Math.sin(progressInSection * 25);
      }
    } else if (isDropOrChorus) {
      // High, sustained punch with heavy kick/bass transients
      envelopeMultiplier = 0.95 + 0.15 * Math.sin(progressInSection * 12);
    } else if (isBreakdownOrBridge) {
      // Hollowed dynamic, sparse beats with occasional high transient snare/clap
      envelopeMultiplier = 0.4 + 0.25 * Math.sin(progressInSection * Math.PI);
    } else if (section.type === 'intro') {
      // Fade in
      envelopeMultiplier = Math.min(1.0, 0.2 + 0.9 * progressInSection);
    } else if (section.type === 'outro') {
      // Fade out
      envelopeMultiplier = Math.max(0.15, 1.0 - 0.85 * progressInSection);
    } else {
      // Standard verse / rhythm
      envelopeMultiplier = 0.8 + 0.1 * Math.sin(progressInSection * 8);
    }

    // Beat pulse synchronization based on BPM
    const beatPhase = (time % beatDuration) / beatDuration; // 0 to 1
    const isDownbeat = beatPhase < 0.18 || (beatPhase > 0.48 && beatPhase < 0.62);
    const rhythmicTransient = isDownbeat ? baseRhythm * 0.28 : 0.04 * Math.sin(i * 1.5);

    // Texture harmonic thickness
    const textureNoise = baseTexture * 0.18 * (0.5 + 0.5 * Math.sin(i * 2.8 + progressInSection * 5));

    // Combined amplitude
    let rawAmp = (baseEnergy * 0.55 + baseTexture * 0.25 + rhythmicTransient + textureNoise + transientBoost) * envelopeMultiplier;

    // Introduce natural organic fluctuations
    const microVariation = 0.06 * Math.cos(i * 0.85 + 1.2);
    rawAmp = Math.max(0.08, Math.min(0.98, rawAmp + microVariation));

    const isTransientPeak = isDownbeat && rawAmp > 0.65;
    const rms = Math.max(0.05, rawAmp * (0.6 + baseTexture * 0.3));

    samples.push({
      time,
      leftPct,
      amplitude: rawAmp,
      rms,
      isTransientPeak,
      section,
      color: theme.hex,
    });
  }

  return samples;
}

/**
 * Detects dramatic musical transitions between adjacent sections (drops, builds, breakdowns, rhythm shifts).
 */
export function detectTransitionPoints(sections: SongSection[]): TransitionPoint[] {
  const transitions: TransitionPoint[] = [];

  for (let i = 0; i < sections.length - 1; i++) {
    const from = sections[i];
    const to = sections[i + 1];

    const fromEnergy = from.energyLevel ?? 5;
    const toEnergy = to.energyLevel ?? 5;
    const deltaEnergy = toEnergy - fromEnergy;

    const fromRhythm = from.rhythmicDrive ?? 5;
    const toRhythm = to.rhythmicDrive ?? 5;
    const deltaRhythm = Math.abs(toRhythm - fromRhythm);

    const time = to.startTime;
    const id = `trans-${from.id}-${to.id}`;

    const fromLabel = from.label.toLowerCase();
    const toLabel = to.label.toLowerCase();
    const isToDrop = toLabel.includes('drop') || (to.type === 'chorus' && deltaEnergy >= 2);
    const isToBreakdown = toLabel.includes('break') || to.type === 'bridge' && deltaEnergy <= -2;
    const isToBuildup = toLabel.includes('build') || (from.type === 'verse' && to.type === 'intro');

    // Drop / Dynamic Explosion
    if (isToDrop || (deltaEnergy >= 3 && toEnergy >= 7)) {
      transitions.push({
        id,
        time,
        type: 'drop',
        label: toLabel.includes('drop') ? 'DROP / IMPACT' : 'ENERGY DROP',
        deltaEnergy,
        fromSection: from,
        toSection: to,
      });
    }
    // Breakdown / Dynamic Valley
    else if (isToBreakdown || deltaEnergy <= -3) {
      transitions.push({
        id,
        time,
        type: 'breakdown',
        label: 'BREAKDOWN',
        deltaEnergy,
        fromSection: from,
        toSection: to,
      });
    }
    // Buildup / Riser
    else if (isToBuildup) {
      transitions.push({
        id,
        time,
        type: 'buildup',
        label: 'BUILD-UP',
        deltaEnergy,
        fromSection: from,
        toSection: to,
      });
    }
    // Rhythmic Groove Shift
    else if (deltaRhythm >= 3) {
      transitions.push({
        id,
        time,
        type: 'rhythmic_shift',
        label: 'RHYTHM SHIFT',
        deltaEnergy,
        fromSection: from,
        toSection: to,
      });
    }
    // Significant Energy Shift
    else if (Math.abs(deltaEnergy) >= 2) {
      transitions.push({
        id,
        time,
        type: 'energy_shift',
        label: deltaEnergy > 0 ? 'ENERGY UP' : 'ENERGY DOWN',
        deltaEnergy,
        fromSection: from,
        toSection: to,
      });
    }
  }

  return transitions;
}

export interface WaveformSampleLandmark {
  id: string;
  time: number;
  type: 'drop' | 'energy_up' | 'energy_down' | 'buildup' | 'breakdown';
  label: string;
  amplitude: number;
}

/**
 * Detects Energy Up, Energy Down, Energy Drop landmarks directly from waveform sample amplitude changes over time
 * irrespective of user-defined song sections and time codes.
 */
export function detectWaveformTransitionsFromSamples(
  samples: { time: number; amplitude: number; rms: number; isTransientPeak: boolean }[]
): WaveformSampleLandmark[] {
  if (samples.length < 15) return [];

  const landmarks: WaveformSampleLandmark[] = [];
  const window = 8;

  for (let i = window; i < samples.length - window; i += 3) {
    const prevBlock = samples.slice(i - window, i);
    const nextBlock = samples.slice(i, i + window);

    const avgPrev = prevBlock.reduce((acc, s) => acc + s.amplitude, 0) / window;
    const avgNext = nextBlock.reduce((acc, s) => acc + s.amplitude, 0) / window;
    const sample = samples[i];
    const diff = avgNext - avgPrev;

    const lastTime = landmarks.length > 0 ? landmarks[landmarks.length - 1].time : -99;

    if (sample.time - lastTime > 2.2) {
      if (diff > 0.22 && sample.amplitude > 0.62 && sample.isTransientPeak) {
        landmarks.push({
          id: `wf-drop-${i}`,
          time: sample.time,
          type: 'drop',
          label: 'ENERGY DROP',
          amplitude: sample.amplitude,
        });
      } else if (diff > 0.15 && avgPrev < 0.52) {
        landmarks.push({
          id: `wf-up-${i}`,
          time: sample.time,
          type: 'energy_up',
          label: 'ENERGY UP',
          amplitude: sample.amplitude,
        });
      } else if (diff < -0.16 && avgPrev > 0.55) {
        landmarks.push({
          id: `wf-down-${i}`,
          time: sample.time,
          type: 'energy_down',
          label: 'ENERGY DOWN',
          amplitude: sample.amplitude,
        });
      }
    }
  }

  return landmarks;
}

export function TimelineWaveformOverlay({
  sections,
  totalTimelineDuration,
  currentTime,
  isPlaying,
  bpm,
  timeSignature,
  effectiveSongStart,
  effectiveSongEnd,
  onSeek,
  opacity = 0.55,
  styleMode = 'spectrum',
}: TimelineWaveformOverlayProps) {
  const [hoveredSampleIndex, setHoveredSampleIndex] = useState<number | null>(null);

  // Generate waveform samples across the entire timeline
  const samples = useMemo(() => {
    return generateWaveformSamples(sections, totalTimelineDuration, 200, bpm);
  }, [sections, totalTimelineDuration, bpm]);

  // Detect key musical transition landmarks (drops, rhythm shifts, breakdowns)
  const transitions = useMemo(() => {
    return detectTransitionPoints(sections);
  }, [sections]);

  const currentPlayPct = Math.min(100, Math.max(0, (currentTime / totalTimelineDuration) * 100));

  return (
    <div
      className="absolute inset-0 pointer-events-none z-12 overflow-hidden select-none flex items-center justify-between"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* SVG Waveform Mirror Bars */}
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${samples.length * 4} 100`}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradients for dynamic audio visualizer look */}
          <linearGradient id="waveform-played-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="waveform-unplayed-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" />
          </linearGradient>

          <filter id="waveform-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Center baseline axis line */}
        <line
          x1="0"
          y1="50"
          x2={samples.length * 4}
          y2="50"
          stroke="#94a3b8"
          strokeOpacity="0.25"
          strokeWidth="0.75"
          strokeDasharray="2 4"
        />

        {/* Individual Waveform Slices */}
        {samples.map((sample, idx) => {
          const x = idx * 4 + 1;
          const isPlayed = sample.time <= currentTime;
          const isCurrentSec = sample.section
            ? currentTime >= sample.section.startTime && currentTime < sample.section.endTime
            : false;

          // Symmetrical height around y=50
          const barHeight = Math.max(4, sample.amplitude * 88);
          const yTop = 50 - barHeight / 2;

          // Inner RMS core bar
          const rmsHeight = Math.max(2, sample.rms * 50);
          const yRmsTop = 50 - rmsHeight / 2;

          let barColor = isPlayed ? sample.color : '#94a3b8';
          let barOpacity = isPlayed ? 0.85 : 0.4;

          if (isCurrentSec && isPlayed) {
            barOpacity = 0.95;
          }

          if (sample.isTransientPeak) {
            barOpacity = isPlayed ? 1.0 : 0.65;
          }

          return (
            <g key={`wf-${idx}`}>
              {/* Outer Peak Transient Bar */}
              <rect
                x={x}
                y={yTop}
                width={2.2}
                height={barHeight}
                rx={1.1}
                fill={barColor}
                fillOpacity={barOpacity}
                filter={sample.isTransientPeak && isPlayed ? 'url(#waveform-glow)' : undefined}
              />

              {/* Core RMS Energy Density Inner Bar */}
              <rect
                x={x + 0.3}
                y={yRmsTop}
                width={1.6}
                height={rmsHeight}
                rx={0.8}
                fill={isPlayed ? '#ffffff' : '#e2e8f0'}
                fillOpacity={isPlayed ? 0.6 : 0.35}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
