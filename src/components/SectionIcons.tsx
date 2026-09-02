import React from 'react';
import { motion } from 'motion/react';
import { Hand, BookOpen, Flame, Milestone, Pause, Tag } from 'lucide-react';
import { SectionType } from '../types';

export const SwellingCrescendo = ({ className = "w-3 h-3" }: { className?: string }) => (
  <motion.div
    animate={{ scaleX: [1, 1.4, 1], scaleY: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
    transition={{
      duration: 1.8,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    style={{ transformOrigin: "left center", display: "inline-flex" }}
  >
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 5L3 12L21 19" />
    </svg>
  </motion.div>
);

export const WavingHand = ({ className = "w-3 h-3" }: { className?: string }) => (
  <motion.div
    animate={{ rotate: [0, 16, -10, 16, -6, 12, 0] }}
    transition={{
      duration: 2.2,
      repeat: Infinity,
      repeatDelay: 0.8,
      ease: "easeInOut",
    }}
    style={{ transformOrigin: "bottom center", display: "inline-flex" }}
  >
    <Hand className={className} />
  </motion.div>
);

export const RockHand = ({ className = "w-3 h-3" }: { className?: string }) => (
  <motion.div
    animate={{ rotate: [0, -12, 12, -6, 0], scale: [1, 1.1, 1] }}
    transition={{
      duration: 1.8,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    style={{ transformOrigin: "bottom center", display: "inline-flex" }}
  >
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Index finger up */}
      <path d="M7 11V4a1 1 0 0 1 2 0v7" />
      {/* Pinky finger up */}
      <path d="M17 11V4a1 1 0 0 1 2 0v7" />
      {/* Folded middle and ring fingers */}
      <path d="M9 11v3a1 1 0 0 0 2 0v-1" />
      <path d="M13 11v3a1 1 0 0 0 2 0v-1" />
      {/* Thumb extended out */}
      <path d="M5 14l-2 1" />
      {/* Palm */}
      <path d="M7 11h10a2 2 0 0 1 2 2v4a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-4a2 2 0 0 1 2-2z" />
    </svg>
  </motion.div>
);

export const TurningBook = ({ className = "w-3 h-3" }: { className?: string }) => (
  <motion.div
    animate={{ rotateY: [0, -35, 0], scaleX: [1, 0.85, 1] }}
    transition={{
      duration: 3,
      repeat: Infinity,
      repeatDelay: 1,
      ease: "easeInOut",
    }}
    style={{ transformOrigin: "center center", display: "inline-flex" }}
  >
    <BookOpen className={className} />
  </motion.div>
);

export const FlickeringFlame = ({ className = "w-3 h-3" }: { className?: string }) => (
  <motion.div
    animate={{
      scale: [1, 1.15, 0.92, 1.1, 1],
      opacity: [0.85, 1, 0.75, 1, 0.85],
      rotate: [0, -4, 4, -2, 0],
    }}
    transition={{
      duration: 0.9,
      repeat: Infinity,
      repeatDelay: 2.5,
      ease: "easeInOut",
    }}
    style={{ transformOrigin: "bottom center", display: "inline-flex" }}
  >
    <Flame className={className} />
  </motion.div>
);

export const SpinningMilestone = ({ className = "w-3 h-3" }: { className?: string }) => (
  <motion.div
    animate={{ rotate: [0, 360] }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 4,
      ease: "easeInOut",
    }}
    style={{ transformOrigin: "center center", display: "inline-flex" }}
  >
    <Milestone className={className} />
  </motion.div>
);

export const PauseIconAnim = ({ className = "w-3 h-3" }: { className?: string }) => (
  <motion.div
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    style={{ display: "inline-flex" }}
  >
    <Pause className={className} />
  </motion.div>
);

export const DownChorusIcon = ({ className = "w-2 h-2 text-pink-500" }: { className?: string }) => (
  <motion.div
    animate={{
      scale: [1, 1.1, 0.95, 1.05, 1],
      opacity: [0.8, 1, 0.7, 1, 0.8],
    }}
    transition={{
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    style={{ transformOrigin: "bottom center", display: "inline-flex" }}
  >
    <Flame className={className} />
  </motion.div>
);

export function getSectionIconComponent(type: SectionType): React.ComponentType<{ className?: string }> | null {
  switch (type) {
    case 'intro':
    case 'outro':
      return WavingHand;
    case 'verse':
      return TurningBook;
    case 'pre_chorus':
      return SwellingCrescendo;
    case 'chorus':
      return FlickeringFlame;
    case 'down_chorus':
      return DownChorusIcon;
    case 'bridge':
      return SpinningMilestone;
    case 'interlude':
      return PauseIconAnim;
    case 'instrumental_solo':
      return RockHand;
    case 'custom':
      return Tag;
    default:
      return WavingHand;
  }
}
