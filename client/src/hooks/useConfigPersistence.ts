import { useState, useCallback } from 'react';
import type { WizardConfig } from '@/components/wizard-steps/types';

const STORAGE_KEY = 'qastarter-wizard-config';
const STORAGE_VERSION = '1.0';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SavedConfig {
  version: string;
  timestamp: number;
  config: WizardConfig;
  currentStep: number;
}

export function useConfigPersistence() {
  const [hasSavedConfig, setHasSavedConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: SavedConfig = JSON.parse(saved);
        // Check if config is expired (older than 24 hours)
        if (Date.now() - data.timestamp > MAX_AGE_MS) {
          localStorage.removeItem(STORAGE_KEY);
          return false;
        } else {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  });

  const saveConfig = useCallback((config: WizardConfig, currentStep: number) => {
    try {
      const data: SavedConfig = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        config,
        currentStep,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // Storage might be full or unavailable
      console.warn('Failed to save configuration:', error);
    }
  }, []);

  const loadConfig = useCallback((): SavedConfig | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const data: SavedConfig = JSON.parse(saved);

      // Validate version compatibility
      if (data.version !== STORAGE_VERSION) {
        console.warn('Saved configuration version mismatch, clearing...');
        localStorage.removeItem(STORAGE_KEY);
        setHasSavedConfig(false);
        return null;
      }

      // Check if config is expired
      const currentTime = Date.now();
      if (currentTime - data.timestamp > MAX_AGE_MS) {
        console.warn('Saved configuration expired, clearing...');
        localStorage.removeItem(STORAGE_KEY);
        setHasSavedConfig(false);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to load configuration:', error);
      return null;
    }
  }, []);

  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasSavedConfig(false);
    } catch (error) {
      console.warn('Failed to clear configuration:', error);
    }
  }, []);

  return {
    hasSavedConfig,
    saveConfig,
    loadConfig,
    clearConfig,
  };
}
