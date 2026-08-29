import { useEffect, useRef } from 'react';
import { FormData, FieldConfig } from '../types/form';
import { useLocalStorage } from './useLocalStorage';

interface AutoSaveData {
  formData: FormData;
  fields: FieldConfig[];
  timestamp: number;
}

export function useAutoSave(formData: FormData, fields: FieldConfig[]) {
  const [savedData, setSavedData, removeSavedData] = useLocalStorage<AutoSaveData | null>(
    `autosave-hr-intake-form`,
    null,
  );

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Auto-save with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only save if there's actual data
    const hasData = Object.values(formData).some((value) => value.trim() !== '');

    if (hasData) {
      timeoutRef.current = setTimeout(() => {
        const now = Date.now();
        // Only save if it's been at least 1 second since last save
        if (now - lastSaveRef.current > 1000) {
          setSavedData({
            formData,
            fields,
            timestamp: now,
          });
          lastSaveRef.current = now;
        }
      }, 2000); // 2 second debounce
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, fields, setSavedData]);

  // Manual save function
  const saveNow = () => {
    setSavedData({
      formData,
      fields,
      timestamp: Date.now(),
    });
    lastSaveRef.current = Date.now();
  };

  // Clear saved data
  const clearSavedData = () => {
    removeSavedData();
  };

  // Get formatted last save time
  const getLastSaveTime = () => {
    if (!savedData?.timestamp) return undefined;

    const now = Date.now();
    const diff = now - savedData.timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `vor ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
    } else if (seconds > 5) {
      return `vor ${seconds} Sekunden`;
    } else {
      return 'gerade eben';
    }
  };

  return {
    savedData,
    saveNow,
    clearSavedData,
    getLastSaveTime,
    hasSavedData: !!savedData,
  };
}
