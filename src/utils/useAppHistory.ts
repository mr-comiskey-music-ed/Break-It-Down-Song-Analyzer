import { useState, useCallback, useRef } from 'react';
import { SongMetadata, SongSection } from '../types';

export interface AppSnapshot {
  songMetadata: SongMetadata;
  sections: SongSection[];
  studentName: string;
}

export function useAppHistory(initialState: AppSnapshot) {
  const [past, setPast] = useState<AppSnapshot[]>([]);
  const [future, setFuture] = useState<AppSnapshot[]>([]);
  const currentStateRef = useRef<AppSnapshot>(initialState);

  // Keep ref synchronized
  const setCurrentSnapshot = useCallback((state: AppSnapshot) => {
    currentStateRef.current = state;
  }, []);

  /**
   * Pushes the current state into the past stack before a mutation
   */
  const recordChange = useCallback((prevState: AppSnapshot) => {
    setPast((prevPast) => {
      // Max 40 history snapshots
      const newPast = [...prevPast, prevState];
      if (newPast.length > 40) {
        return newPast.slice(newPast.length - 40);
      }
      return newPast;
    });
    // Clear redo branch on new action
    setFuture([]);
  }, []);

  /**
   * Undo to previous state
   */
  const undo = useCallback((): AppSnapshot | null => {
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prevFuture) => [currentStateRef.current, ...prevFuture]);
    setPast(newPast);
    currentStateRef.current = previous;

    return previous;
  }, [past]);

  /**
   * Redo to future state
   */
  const redo = useCallback((): AppSnapshot | null => {
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prevPast) => [...prevPast, currentStateRef.current]);
    setFuture(newFuture);
    currentStateRef.current = next;

    return next;
  }, [future]);

  /**
   * Reset history (e.g. On loading a preset or resetting project)
   */
  const resetHistory = useCallback((newInitialState: AppSnapshot) => {
    setPast([]);
    setFuture([]);
    currentStateRef.current = newInitialState;
  }, []);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pastCount: past.length,
    futureCount: future.length,
    recordChange,
    undo,
    redo,
    setCurrentSnapshot,
    resetHistory,
  };
}
