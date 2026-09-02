import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SongMetadata, SongSection, SectionType, SectionAnalysisData } from './types';
import { calculateSectionBars, SECTION_CONFIGS, recalculateSectionLabels } from './utils/musicTheory';
import { PRESET_SONGS } from './utils/genrePresets';
import {
  getActiveDemoExample,
  getDemoExampleBySlot,
  saveCurrentInputsAsDemo,
  hasCustomSavedDemo,
  resetDemoToDefault,
} from './utils/demoStorage';
import { decodeShareState, extractYouTubeId } from './utils/sharePayload';
import { useAppHistory } from './utils/useAppHistory';
import { Header } from './components/Header';
import { SongMetadataBoxes } from './components/SongMetadataBoxes';
import { YouTubePlayer } from './components/YouTubePlayer';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { SongSpiderChart } from './components/SongSpiderChart';
import { SectionDetailsList } from './components/SectionDetailsList';
import { SectionTypeModal } from './components/SectionTypeModal';
import { AddSectionChoiceModal } from './components/AddSectionChoiceModal';
import { InitialGuidePopup } from './components/InitialGuidePopup';
import { TutorialModal } from './components/TutorialModal';
import { ShareEvaluationModal } from './components/ShareEvaluationModal';
import { SongComparisonView } from './components/SongComparisonView';
import { CheckCircle2, Youtube } from 'lucide-react';

const DEFAULT_METADATA: SongMetadata = {
  title: '',
  artist: '',
  album: '',
  year: '',
  genre: '',
  timeSignature: '4/4',
  bpm: '',
  referenceBpm: 96,
  youtubeUrl: 'https://www.youtube.com/watch?v=qdmWbJ8ISP4',
  youtubeId: 'qdmWbJ8ISP4',
  videoDuration: 238,
};

export default function App() {
  // Main Project State
  const [songMetadata, setSongMetadata] = useState<SongMetadata>(DEFAULT_METADATA);
  const [sections, setSections] = useState<SongSection[]>([]);
  const [studentName, setStudentName] = useState('');
  const [tapTempoUsed, setTapTempoUsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [comparedSong, setComparedSong] = useState<{
    songMetadata: SongMetadata;
    sections: SongSection[];
    studentName?: string;
  } | null>(null);

  // Undo / Redo History Engine
  const history = useAppHistory({
    songMetadata: DEFAULT_METADATA,
    sections: [],
    studentName: '',
  });

  // Keep history snapshot current
  useEffect(() => {
    history.setCurrentSnapshot({
      songMetadata,
      sections,
      studentName,
    });
  }, [songMetadata, sections, studentName, history]);

  // Helper to record history before user mutation
  const recordSnapshot = useCallback(() => {
    history.recordChange({
      songMetadata,
      sections,
      studentName,
    });
  }, [songMetadata, sections, studentName, history]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Undo / Redo Handlers
  const handleUndo = useCallback(() => {
    const prev = history.undo();
    if (prev) {
      setSongMetadata(prev.songMetadata);
      setSections(prev.sections);
      setStudentName(prev.studentName);
      if (prev.songMetadata.videoDuration) {
        setDuration(prev.songMetadata.videoDuration);
      }
      showToast('Undo applied');
    }
  }, [history, showToast]);

  const handleRedo = useCallback(() => {
    const next = history.redo();
    if (next) {
      setSongMetadata(next.songMetadata);
      setSections(next.sections);
      setStudentName(next.studentName);
      if (next.songMetadata.videoDuration) {
        setDuration(next.songMetadata.videoDuration);
      }
      showToast('Redo applied');
    }
  }, [history, showToast]);

  // Global Keyboard Shortcuts (Ctrl+Z / Cmd+Z, Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      } else if (modifier && (e.key === 'y' || e.key === 'Y')) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(238);
  const [isPlaying, setIsPlaying] = useState(false);

  // Modals & UI state
  const [isInitialGuideOpen, setIsInitialGuideOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSectionTypeModalOpen, setIsSectionTypeModalOpen] = useState(false);
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [targetModalTimecode, setTargetModalTimecode] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoadingAutoFill, setIsLoadingAutoFill] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  const [hasCustomDemo, setHasCustomDemo] = useState(hasCustomSavedDemo());
  const [activeDemoSlot, setActiveDemoSlot] = useState<number | null>(1);

  useEffect(() => {
    if (!isTutorialOpen) return;
    const scrollToElement = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -140; // larger offset for top header/padding so bouncing badge & top boundary are fully visible
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    };

    if (tutorialStep === 0 || tutorialStep === 4) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tutorialStep === 1) {
      scrollToElement('tutorial-step-1');
    } else if (tutorialStep === 2) {
      scrollToElement('tutorial-step-2');
    } else if (tutorialStep === 3) {
      scrollToElement('tutorial-step-3');
    }
  }, [isTutorialOpen, tutorialStep]);

  // Number of times "+ Add Section" was clicked while paused
  const addSectionClickCountRef = useRef(0);

  // YouTube player controller handle
  const playerRefHandle = useRef<{
    seekTo: (seconds: number, play?: boolean) => void;
    togglePlay: () => void;
    play: () => void;
    pause: () => void;
  } | null>(null);

  // Clipboard for Section Analysis details (energy, rhythm, vocals, texture, instruments)
  const [copiedAnalysis, setCopiedAnalysis] = useState<SectionAnalysisData | null>(null);

  const handleCopyAnalysis = (sourceSection: SongSection) => {
    setCopiedAnalysis({
      energyLevel: sourceSection.energyLevel,
      rhythmicDrive: sourceSection.rhythmicDrive,
      vocalComplexity: sourceSection.vocalComplexity,
      hasVocals: sourceSection.hasVocals,
      textureDensity: sourceSection.textureDensity,
      instrumentationNotes: sourceSection.instrumentationNotes,
      sourceLabel: sourceSection.label,
    });
    showToast(`Copied analysis from ${sourceSection.label}`);
  };

  const handlePasteAnalysis = (targetSectionId: string) => {
    if (!copiedAnalysis) return;
    recordSnapshot();
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== targetSectionId) return s;
        return {
          ...s,
          energyLevel: copiedAnalysis.energyLevel,
          rhythmicDrive: copiedAnalysis.rhythmicDrive,
          vocalComplexity: copiedAnalysis.vocalComplexity,
          hasVocals: copiedAnalysis.hasVocals,
          textureDensity: copiedAnalysis.textureDensity,
          instrumentationNotes: copiedAnalysis.instrumentationNotes,
        };
      })
    );
    const target = sections.find((s) => s.id === targetSectionId);
    showToast(`Pasted analysis ${copiedAnalysis.sourceLabel ? `from ${copiedAnalysis.sourceLabel} ` : ''}into ${target?.label || 'section'}`);
  };

  // Check URL hash for shared assignment on load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('assignment=')) {
      const param = hash.split('assignment=')[1];
      if (param) {
        const decoded = decodeShareState(param);
        if (decoded && decoded.songMetadata && decoded.sections) {
          setSongMetadata(decoded.songMetadata);
          setSections(decoded.sections);
          setStudentName(decoded.studentName || '');
          setIsSharedView(true);
          if (decoded.songMetadata.videoDuration) {
            setDuration(decoded.songMetadata.videoDuration);
          }
          return;
        }
      }
    }

    // If not a shared view, show the first-time guide popup
    const visited = localStorage.getItem('song_form_guide_seen');
    if (!visited) {
      setIsInitialGuideOpen(true);
      localStorage.setItem('song_form_guide_seen', 'true');
    }
  }, []);

  // Update calculated bars across all sections whenever BPM or Time Signature changes
  useEffect(() => {
    if (sections.length === 0) return;

    setSections((prevSections) =>
      prevSections.map((sec) => {
        const secDuration = sec.endTime - sec.startTime;
        const calc = calculateSectionBars(
          secDuration,
          songMetadata.bpm,
          songMetadata.timeSignature,
          sec.type,
          songMetadata.referenceBpm
        );
        return {
          ...sec,
          calculatedBars: calc.bars,
          barExplanation: calc.explanation,
        };
      })
    );
  }, [songMetadata.bpm, songMetadata.timeSignature, songMetadata.referenceBpm]);

  // Handle URL change
  const handleUrlChange = (url: string, id: string) => {
    const demo1Url = getDemoExampleBySlot(1).songMetadata.youtubeUrl;
    const demo2Url = getDemoExampleBySlot(2).songMetadata.youtubeUrl;
    if (url === demo1Url) {
      setActiveDemoSlot(1);
    } else if (url === demo2Url) {
      setActiveDemoSlot(2);
    } else {
      setActiveDemoSlot(null);
    }
    setSongMetadata((prev) => ({
      ...prev,
      youtubeUrl: url,
      youtubeId: id,
    }));
  };

  // Auto populate metadata using iTunes catalog, YouTube oEmbed, and Gemini /api/song-metadata
  const handleAutoPopulate = async () => {
    setIsLoadingAutoFill(true);
    try {
      const combinedQuery = [songMetadata.artist, songMetadata.title].filter(Boolean).join(' - ') ||
        songMetadata.title ||
        songMetadata.artist ||
        '';

      const res = await fetch('/api/song-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: songMetadata.title || '',
          artist: songMetadata.artist || '',
          query: combinedQuery,
          youtubeUrl: songMetadata.youtubeUrl || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSongMetadata((prev) => ({
          ...prev,
          title: data.title || prev.title,
          artist: data.artist || prev.artist,
          album: data.album || prev.album,
          year: data.year || prev.year,
          genre: data.genre || prev.genre,
          timeSignature: data.timeSignature || prev.timeSignature || '4/4',
          referenceBpm: data.referenceBpm || prev.referenceBpm,
        }));
      }
    } catch (err) {
      console.error('Error auto-populating song info:', err);
    } finally {
      setIsLoadingAutoFill(false);
    }
  };

  // Counting section types for auto numbering
  const countSectionTypes = useCallback(() => {
    let verses = 0;
    let choruses = 0;
    let bridges = 0;
    let intros = 0;
    let outros = 0;
    let preChoruses = 0;

    sections.forEach((s) => {
      if (s.type === 'verse') verses++;
      if (s.type === 'chorus') choruses++;
      if (s.type === 'bridge') bridges++;
      if (s.type === 'intro') intros++;
      if (s.type === 'outro') outros++;
      if (s.type === 'pre_chorus') preChoruses++;
    });

    return { verses, choruses, bridges, intros, outros, preChoruses };
  }, [sections]);

  // Core Section Addition Logic:
  // User Requirement: If a section is added on top of an existing section span or in the middle of it,
  // end the previously existing section where the new section was created, ignore the 10s default length,
  // and extend the new section to the previously established next section's start point.
  const addSectionWithType = (
    type: SectionType,
    customLabel?: string,
    forcedStartTime?: number
  ) => {
    recordSnapshot();
    const counts = countSectionTypes();
    const sortedPrev = [...sections].sort((a, b) => a.startTime - b.startTime);
    const lastSection = sortedPrev.length > 0 ? sortedPrev[sortedPrev.length - 1] : null;

    let startTime = forcedStartTime !== undefined
      ? forcedStartTime
      : lastSection
        ? lastSection.endTime
        : (songMetadata.songStartTime || 0);

    if (startTime < 0) startTime = 0;
    startTime = Math.round(startTime * 10) / 10;

    // Determine label
    let label = customLabel || '';
    if (!label) {
      if (type === 'intro') {
        label = counts.intros === 0 ? 'Intro' : `Intro ${counts.intros + 1}`;
      } else if (type === 'verse') {
        label = `Verse ${counts.verses + 1}`;
      } else if (type === 'pre_chorus') {
        label = counts.preChoruses === 0 ? 'Pre-Chorus/Pre-Hook' : `Pre-Chorus/Pre-Hook ${counts.preChoruses + 1}`;
      } else if (type === 'chorus') {
        label = counts.choruses === 0 ? 'Chorus/Hook' : `Chorus/Hook ${counts.choruses + 1}`;
      } else if (type === 'bridge') {
        label = counts.bridges === 0 ? 'Bridge' : `Bridge ${counts.bridges + 1}`;
      } else if (type === 'outro') {
        label = counts.outros === 0 ? 'Outro' : `Outro ${counts.outros + 1}`;
      } else {
        label = 'Section';
      }
    }

    const defaultSecDuration = 20;
    const newId = `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    setSections((prev) => {
      if (prev.length === 0) {
        let endTime = Math.round((startTime + defaultSecDuration) * 10) / 10;
        if (duration > 0 && endTime > duration + 30) {
          endTime = duration;
        }
        const calc = calculateSectionBars(
          endTime - startTime,
          songMetadata.bpm,
          songMetadata.timeSignature,
          type,
          songMetadata.referenceBpm
        );
        const newSec: SongSection = {
          id: newId,
          type,
          label,
          startTime,
          endTime,
          calculatedBars: calc.bars,
          barExplanation: calc.explanation,
          energyLevel: type === 'chorus' ? 8 : type === 'intro' ? 4 : 6,
          rhythmicDrive: type === 'chorus' ? 8 : 6,
          vocalComplexity: type === 'intro' ? 1 : 6,
          hasVocals: type !== 'intro',
          textureDensity: type === 'chorus' ? 7 : 4,
          instrumentationNotes: '',
          color: SECTION_CONFIGS[type]?.colorName || 'indigo',
        };
        return [newSec];
      }

      // Sort existing sections chronologically
      const currentSections = [...prev].sort((a, b) => a.startTime - b.startTime);

      // Case 1: startTime falls strictly inside an existing section span (on top of or in the middle of it)
      const overlappingIndex = currentSections.findIndex(
        (s) => startTime > s.startTime && startTime < s.endTime
      );

      if (overlappingIndex !== -1) {
        const targetSec = { ...currentSections[overlappingIndex] };
        const originalTargetEndTime = targetSec.endTime;

        // End the previously existing section where the new section was created
        targetSec.endTime = startTime;
        const targetCalc = calculateSectionBars(
          targetSec.endTime - targetSec.startTime,
          songMetadata.bpm,
          songMetadata.timeSignature,
          targetSec.type,
          songMetadata.referenceBpm
        );
        targetSec.calculatedBars = targetCalc.bars;
        targetSec.barExplanation = targetCalc.explanation;

        // Ignore 10s default length and extend new section to the previously established next section's start point
        let newEndTime = originalTargetEndTime;
        if (newEndTime <= startTime) {
          newEndTime = Math.round((startTime + defaultSecDuration) * 10) / 10;
        }

        const newCalc = calculateSectionBars(
          newEndTime - startTime,
          songMetadata.bpm,
          songMetadata.timeSignature,
          type,
          songMetadata.referenceBpm
        );

        const newSec: SongSection = {
          id: newId,
          type,
          label,
          startTime,
          endTime: newEndTime,
          calculatedBars: newCalc.bars,
          barExplanation: newCalc.explanation,
          energyLevel: type === 'chorus' ? 8 : type === 'intro' ? 4 : 6,
          rhythmicDrive: type === 'chorus' ? 8 : 6,
          vocalComplexity: type === 'intro' ? 1 : 6,
          hasVocals: type !== 'intro',
          textureDensity: type === 'chorus' ? 7 : 4,
          instrumentationNotes: '',
          color: SECTION_CONFIGS[type]?.colorName || 'indigo',
        };

        const result = [...currentSections];
        result[overlappingIndex] = targetSec;
        result.splice(overlappingIndex + 1, 0, newSec);
        return result;
      }

      // Case 2: startTime is before an existing future section (gap or inserted before)
      const nextSectionIndex = currentSections.findIndex((s) => s.startTime > startTime);
      const prevSectionIndex = currentSections.reduce(
        (lastIdx, s, idx) => (s.startTime < startTime ? idx : lastIdx),
        -1
      );

      if (nextSectionIndex !== -1) {
        const nextSec = currentSections[nextSectionIndex];
        const newEndTime = nextSec.startTime;

        const result = [...currentSections];
        if (prevSectionIndex !== -1) {
          const prevSec = { ...result[prevSectionIndex] };
          if (prevSec.endTime < startTime) {
            prevSec.endTime = startTime;
            const prevCalc = calculateSectionBars(
              prevSec.endTime - prevSec.startTime,
              songMetadata.bpm,
              songMetadata.timeSignature,
              prevSec.type,
              songMetadata.referenceBpm
            );
            prevSec.calculatedBars = prevCalc.bars;
            prevSec.barExplanation = prevCalc.explanation;
            result[prevSectionIndex] = prevSec;
          }
        }

        const newCalc = calculateSectionBars(
          newEndTime - startTime,
          songMetadata.bpm,
          songMetadata.timeSignature,
          type,
          songMetadata.referenceBpm
        );

        const newSec: SongSection = {
          id: newId,
          type,
          label,
          startTime,
          endTime: newEndTime,
          calculatedBars: newCalc.bars,
          barExplanation: newCalc.explanation,
          energyLevel: type === 'chorus' ? 8 : type === 'intro' ? 4 : 6,
          rhythmicDrive: type === 'chorus' ? 8 : 6,
          vocalComplexity: type === 'intro' ? 1 : 6,
          hasVocals: type !== 'intro',
          textureDensity: type === 'chorus' ? 7 : 4,
          instrumentationNotes: '',
          color: SECTION_CONFIGS[type]?.colorName || 'indigo',
        };

        result.splice(nextSectionIndex, 0, newSec);
        return result;
      }

      // Case 3: startTime is at or after the last section (leading edge of timeline)
      const lastIndex = currentSections.length - 1;
      const lastSec = { ...currentSections[lastIndex] };

      if (startTime > lastSec.startTime) {
        lastSec.endTime = startTime;
        const lastCalc = calculateSectionBars(
          lastSec.endTime - lastSec.startTime,
          songMetadata.bpm,
          songMetadata.timeSignature,
          lastSec.type,
          songMetadata.referenceBpm
        );
        lastSec.calculatedBars = lastCalc.bars;
        lastSec.barExplanation = lastCalc.explanation;
        currentSections[lastIndex] = lastSec;
      }

      let newEndTime = Math.round((startTime + defaultSecDuration) * 10) / 10;
      if (duration > 0 && newEndTime > duration + 30) {
        newEndTime = duration;
      }

      const newCalc = calculateSectionBars(
        newEndTime - startTime,
        songMetadata.bpm,
        songMetadata.timeSignature,
        type,
        songMetadata.referenceBpm
      );

      const newSec: SongSection = {
        id: newId,
        type,
        label,
        startTime,
        endTime: newEndTime,
        calculatedBars: newCalc.bars,
        barExplanation: newCalc.explanation,
        energyLevel: type === 'chorus' ? 8 : type === 'intro' ? 4 : 6,
        rhythmicDrive: type === 'chorus' ? 8 : 6,
        vocalComplexity: type === 'intro' ? 1 : 6,
        hasVocals: type !== 'intro',
        textureDensity: type === 'chorus' ? 7 : 4,
        instrumentationNotes: '',
        color: SECTION_CONFIGS[type]?.colorName || 'indigo',
      };

      return [...currentSections, newSec];
    });

    setSelectedSectionId(newId);
  };

  // Main "+ Add Section" click handler
  const handleAddSectionMainClick = () => {
    // If video is currently playing, go straight to current playhead section modal
    if (isPlaying) {
      const roundedCurTime = Math.round(currentTime * 10) / 10;
      setTargetModalTimecode(roundedCurTime);
      setIsSectionTypeModalOpen(true);
      return;
    }

    // When video is not playing (blue/purple state), give user choice of current playhead or end of timeline
    setIsAddChoiceModalOpen(true);
  };

  // Mark section at current timestamp button
  const handleAddSectionAtCurrentTime = () => {
    const roundedCurTime = Math.round(currentTime * 10) / 10;
    setTargetModalTimecode(roundedCurTime);
    setIsSectionTypeModalOpen(true);
  };

  // First section start boundary adjustment
  const handleUpdateFirstSectionStart = (newTime: number) => {
    recordSnapshot();
    setSections((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const firstSec = { ...updated[0] };
      const safeStart = Math.min(firstSec.endTime - 0.5, Math.max(0, Math.round(newTime * 10) / 10));
      firstSec.startTime = Math.max(0, safeStart);

      const calc = calculateSectionBars(
        firstSec.endTime - firstSec.startTime,
        songMetadata.bpm,
        songMetadata.timeSignature,
        firstSec.type,
        songMetadata.referenceBpm
      );
      firstSec.calculatedBars = calc.bars;
      firstSec.barExplanation = calc.explanation;

      updated[0] = firstSec;
      return updated;
    });
  };

  // Last section end boundary adjustment
  const handleUpdateLastSectionEnd = (newTime: number) => {
    recordSnapshot();
    setSections((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastIdx = prev.length - 1;
      const lastSec = { ...updated[lastIdx] };
      const safeEnd = Math.max(lastSec.startTime + 0.5, Math.round(newTime * 10) / 10);
      lastSec.endTime = safeEnd;

      const calc = calculateSectionBars(
        lastSec.endTime - lastSec.startTime,
        songMetadata.bpm,
        songMetadata.timeSignature,
        lastSec.type,
        songMetadata.referenceBpm
      );
      lastSec.calculatedBars = calc.bars;
      lastSec.barExplanation = calc.explanation;

      updated[lastIdx] = lastSec;
      return updated;
    });
  };

  // Boundary adjustment
  const handleUpdateBoundary = (index: number, newTime: number) => {
    recordSnapshot();
    setSections((prev) => {
      if (index < 0 || index >= prev.length - 1) return prev;
      const updated = [...prev];
      const leftSec = { ...updated[index] };
      const rightSec = { ...updated[index + 1] };

      const clampedTime = Math.max(
        leftSec.startTime + 0.5,
        Math.min(rightSec.endTime - 0.5, Math.round(newTime * 10) / 10)
      );

      leftSec.endTime = clampedTime;
      rightSec.startTime = clampedTime;

      // Recalculate bars for both sections
      const calcLeft = calculateSectionBars(
        leftSec.endTime - leftSec.startTime,
        songMetadata.bpm,
        songMetadata.timeSignature,
        leftSec.type,
        songMetadata.referenceBpm
      );
      leftSec.calculatedBars = calcLeft.bars;
      leftSec.barExplanation = calcLeft.explanation;

      const calcRight = calculateSectionBars(
        rightSec.endTime - rightSec.startTime,
        songMetadata.bpm,
        songMetadata.timeSignature,
        rightSec.type,
        songMetadata.referenceBpm
      );
      rightSec.calculatedBars = calcRight.bars;
      rightSec.barExplanation = calcRight.explanation;

      updated[index] = leftSec;
      updated[index + 1] = rightSec;
      return updated;
    });
  };

  // Update specific section
  const handleUpdateSection = (id: string, updatedFields: Partial<SongSection>) => {
    recordSnapshot();
    setSections((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== id) return s;
        const merged = { ...s, ...updatedFields };
        if (updatedFields.startTime !== undefined || updatedFields.endTime !== undefined) {
          const calc = calculateSectionBars(
            merged.endTime - merged.startTime,
            songMetadata.bpm,
            songMetadata.timeSignature,
            merged.type,
            songMetadata.referenceBpm
          );
          merged.calculatedBars = calc.bars;
          merged.barExplanation = calc.explanation;
        }
        if (updatedFields.type !== undefined && updatedFields.type !== 'custom') {
          merged.color = SECTION_CONFIGS[updatedFields.type]?.colorName || merged.color;
        }
        return merged;
      });
      if (updatedFields.type !== undefined) {
        return recalculateSectionLabels(updated);
      }
      return updated;
    });
  };

  // Update all sections of a given type
  const handleUpdateAllSectionsOfType = (sectionType: SectionType, color: string) => {
    recordSnapshot();
    setSections((prev) =>
      prev.map((s) => (s.type === sectionType ? { ...s, color } : s))
    );
  };

  // Delete section
  const handleDeleteSection = (id: string) => {
    recordSnapshot();
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  };

  // Play from section start time
  const handlePlaySection = (section: SongSection) => {
    setSelectedSectionId(section.id);
    playerRefHandle.current?.seekTo(section.startTime, true);
  };

  // Load example song for tutorial
  const handleLoadExampleSong = (fullAnalysis: boolean, demoSlot: number = 1) => {
    recordSnapshot();
    setActiveDemoSlot(demoSlot);
    const demo = getDemoExampleBySlot(demoSlot);
    setSongMetadata(demo.songMetadata);
    setDuration(demo.songMetadata.videoDuration || 238);
    setTapTempoUsed(true);

    if (fullAnalysis && demo.sections && demo.sections.length > 0) {
      setSections(demo.sections);
      setSelectedSectionId(demo.sections[0]?.id || null);
      showToast(`Loaded Demo ${demoSlot}: "${demo.songMetadata.title || 'Demo'}" (${demo.songMetadata.bpm} BPM)`);
    } else {
      setSections([]);
      addSectionClickCountRef.current = 0;
      setSelectedSectionId(null);
    }
  };

  // Reset to blank project / New Song Analysis
  const handleResetProject = () => {
    if (!window.confirm('Are you sure you want to clear your current entries and start analyzing a new song?')) {
      return;
    }
    recordSnapshot();
    setActiveDemoSlot(null);
    setSongMetadata({
      ...DEFAULT_METADATA,
      title: '',
      artist: '',
      album: '',
      year: '',
      genre: '',
      bpm: '',
      youtubeUrl: '',
      youtubeId: '',
      videoDuration: 0,
    });
    setSections([]);
    addSectionClickCountRef.current = 0;
    setSelectedSectionId(null);
    setTapTempoUsed(false);
    setIsSharedView(false);
    window.location.hash = '';
  };

  const handleTogglePlay = () => {
    playerRefHandle.current?.togglePlay();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700/60 dark:border-slate-300 flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header with Undo/Redo (Desktop) and Start/Stop (Mobile/Tablet) */}
      <Header
        onOpenTutorial={() => {
          handleLoadExampleSong(true);
          setTutorialStep(0);
          setIsTutorialOpen(true);
        }}
        onOpenShare={() => setIsShareModalOpen(true)}
        onReset={handleResetProject}
        onLoadDemo={() => handleLoadExampleSong(true, 1)}
        onLoadSecondDemo={() => handleLoadExampleSong(true, 2)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isSharedView={isSharedView}
        studentName={studentName}
        sectionCount={sections.length}
        hasCustomDemo={hasCustomDemo}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        isShareButtonHighlighted={isTutorialOpen && tutorialStep === 4}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {comparedSong ? (
          <SongComparisonView
            songA={{ metadata: songMetadata, sections, studentName }}
            songB={comparedSong}
            onClose={() => setComparedSong(null)}
          />
        ) : (
          <>
            {/* Video Player & Metadata - Combined Segmented Box */}
            <div 
              id="tutorial-step-1" 
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 sm:p-6 transition-all relative ${isTutorialOpen && tutorialStep === 1 ? 'ring-4 ring-amber-500/80 dark:ring-amber-400/80 shadow-2xl shadow-amber-500/25' : ''}`}
            >
              {isTutorialOpen && tutorialStep === 1 && (
                <div className="absolute -top-3.5 right-6 z-30 bg-amber-600 text-white text-[11px] font-bold px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none">
                  <span>💡 Step 1</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Youtube className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-['Outfit']">
                    Video Source &amp; Song Assignment Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste your YouTube link and fill out the assignment details for your track side-by-side.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Segment: YouTube Player & URL */}
                <div className="lg:col-span-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between h-full gap-4">
                  <div className="flex flex-col gap-4 flex-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Youtube className="w-4 h-4 text-red-500" />
                      <span>YouTube Video Player</span>
                    </h3>
                    <YouTubePlayer
                      youtubeUrl={songMetadata.youtubeUrl}
                      youtubeId={songMetadata.youtubeId}
                      onUrlChange={handleUrlChange}
                      currentTime={currentTime}
                      duration={duration}
                      isPlaying={isPlaying}
                      onTimeUpdate={setCurrentTime}
                      onDurationChange={setDuration}
                      onPlayingChange={setIsPlaying}
                      playerRefHandle={playerRefHandle}
                      isHighlighted={false}
                      isExampleSong={activeDemoSlot !== null}
                      standalone={false}
                    />
                  </div>
                </div>

                {/* Right Segment: Song Assignment Information */}
                <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between h-full gap-4">
                  <SongMetadataBoxes
                    metadata={songMetadata}
                    onChange={(updated) => setSongMetadata((prev) => ({ ...prev, ...updated }))}
                    onAutoPopulate={handleAutoPopulate}
                    isLoadingAutoFill={isLoadingAutoFill}
                    onTapTempoRecorded={() => setTapTempoUsed(true)}
                    isHighlighted={false}
                    standalone={false}
                  />
                </div>
              </div>
            </div>

            {/* Horizontal Drag-and-Drop / Resizable Timeline Visualizer */}
            <div id="tutorial-step-2">
              <TimelineVisualizer
                sections={sections}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                bpm={songMetadata.bpm}
                timeSignature={songMetadata.timeSignature}
                referenceBpm={songMetadata.referenceBpm}
                onSectionClick={handlePlaySection}
                onSeek={(seconds) => {
                  setCurrentTime(seconds);
                  playerRefHandle.current?.seekTo(seconds, isPlaying);
                }}
                onAddSectionClick={handleAddSectionMainClick}
                onUpdateBoundary={handleUpdateBoundary}
                onUpdateFirstSectionStart={handleUpdateFirstSectionStart}
                onUpdateLastSectionEnd={handleUpdateLastSectionEnd}
                onDeleteSection={handleDeleteSection}
                onSelectSectionForDetails={setSelectedSectionId}
                selectedSectionId={selectedSectionId}
                isHighlighted={isTutorialOpen && tutorialStep === 2}
              />
            </div>

            {/* Section Detail Cards with Rating Sliders & Instrumentation */}
            <div id="tutorial-step-3">
              <SectionDetailsList
                sections={sections}
                genre={songMetadata.genre}
                timeSignature={songMetadata.timeSignature}
                bpm={songMetadata.bpm}
                selectedSectionId={selectedSectionId}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onUpdateSection={handleUpdateSection}
                onUpdateAllSectionsOfType={handleUpdateAllSectionsOfType}
                onDeleteSection={handleDeleteSection}
                onPlaySection={handlePlaySection}
                onAddSectionClick={handleAddSectionMainClick}
                onCopyAnalysis={handleCopyAnalysis}
                onPasteAnalysis={handlePasteAnalysis}
                copiedAnalysis={copiedAnalysis}
                isHighlighted={isTutorialOpen && tutorialStep === 3}
              />
            </div>

            {/* Dynamic Song Sonic Profile Radar Summary (Average Intensity, Rhythmic Drive, Texture Density) */}
            <SongSpiderChart
              sections={sections}
              currentTime={currentTime}
              selectedSectionId={selectedSectionId}
              songTitle={songMetadata.title || 'Current Song'}
              artist={songMetadata.artist}
            />
          </>
        )}
      </main>

      {/* Modals & Guides */}
      <InitialGuidePopup
        isOpen={isInitialGuideOpen}
        onClose={() => setIsInitialGuideOpen(false)}
        onStartTutorial={() => {
          handleLoadExampleSong(true);
          setTutorialStep(0);
          setIsTutorialOpen(true);
        }}
        onQuickAddIntro={() => {
          if (sections.length === 0) {
            addSectionWithType('intro', 'Intro', 0);
          }
        }}
      />

      <SectionTypeModal
        isOpen={isSectionTypeModalOpen}
        onClose={() => setIsSectionTypeModalOpen(false)}
        onSelectType={(type, customLabel) => addSectionWithType(type, customLabel, targetModalTimecode)}
        targetTimecode={targetModalTimecode}
        existingSectionCount={countSectionTypes()}
      />

      <AddSectionChoiceModal
        isOpen={isAddChoiceModalOpen}
        onClose={() => setIsAddChoiceModalOpen(false)}
        currentTime={currentTime}
        endOfTimelineTime={(() => {
          const sortedSecs = [...sections].sort((a, b) => a.startTime - b.startTime);
          const lastSec = sortedSecs.length > 0 ? sortedSecs[sortedSecs.length - 1] : null;
          return lastSec ? lastSec.endTime : (songMetadata.songStartTime || 0);
        })()}
        onChooseCurrent={() => {
          const roundedCurTime = Math.round(currentTime * 10) / 10;
          setTargetModalTimecode(roundedCurTime);
          setIsAddChoiceModalOpen(false);
          setIsSectionTypeModalOpen(true);
        }}
        onChooseEnd={() => {
          const sortedSecs = [...sections].sort((a, b) => a.startTime - b.startTime);
          const lastSec = sortedSecs.length > 0 ? sortedSecs[sortedSecs.length - 1] : null;
          const startAt = lastSec ? lastSec.endTime : (songMetadata.songStartTime || 0);
          setTargetModalTimecode(Math.round(startAt * 10) / 10);
          setIsAddChoiceModalOpen(false);
          setIsSectionTypeModalOpen(true);
        }}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => {
          setIsTutorialOpen(false);
          setTutorialStep(0);
        }}
        onLoadExampleSong={handleLoadExampleSong}
        currentSongTitle={songMetadata.title}
        hasSections={sections.length > 0}
        currentStep={tutorialStep}
        onStepChange={setTutorialStep}
      />

      <ShareEvaluationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        songMetadata={songMetadata}
        sections={sections}
        studentName={studentName}
        onStudentNameChange={setStudentName}
        tapTempoUsed={tapTempoUsed}
        onImportComparison={setComparedSong}
      />
    </div>
  );
}
