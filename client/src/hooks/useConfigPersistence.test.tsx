/**
 * Unit Tests for useConfigPersistence hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigPersistence } from './useConfigPersistence';

const STORAGE_KEY = 'qastarter-wizard-config';

describe('useConfigPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('hasSavedConfig', () => {
    it('should be false initially when nothing is saved', () => {
      const { result } = renderHook(() => useConfigPersistence());
      expect(result.current.hasSavedConfig).toBe(false);
    });

    it('should be true when valid config exists in localStorage', async () => {
      const savedData = {
        version: '1.0',
        timestamp: Date.now(),
        config: { testingType: 'web' },
        currentStep: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useConfigPersistence());

      // Wait for useEffect
      await vi.waitFor(() => {
        expect(result.current.hasSavedConfig).toBe(true);
      });
    });

    it('should be false when saved config is expired (>24h)', async () => {
      const expiredData = {
        version: '1.0',
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        config: { testingType: 'web' },
        currentStep: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expiredData));

      const { result } = renderHook(() => useConfigPersistence());

      await vi.waitFor(() => {
        expect(result.current.hasSavedConfig).toBe(false);
      });

      // Should also clean up localStorage
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should be false when localStorage has invalid JSON', async () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json');

      const { result } = renderHook(() => useConfigPersistence());

      await vi.waitFor(() => {
        expect(result.current.hasSavedConfig).toBe(false);
      });
    });
  });

  describe('saveConfig', () => {
    it('should save config to localStorage', () => {
      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        result.current.saveConfig({ testingType: 'web', framework: 'selenium' }, 3);
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(saved.version).toBe('1.0');
      expect(saved.config.testingType).toBe('web');
      expect(saved.config.framework).toBe('selenium');
      expect(saved.currentStep).toBe(3);
      expect(typeof saved.timestamp).toBe('number');
    });

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useConfigPersistence());

      // Should not throw
      act(() => {
        result.current.saveConfig({ testingType: 'web' }, 1);
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('loadConfig', () => {
    it('should return null when nothing is saved', () => {
      const { result } = renderHook(() => useConfigPersistence());
      expect(result.current.loadConfig()).toBeNull();
    });

    it('should return saved data when valid', () => {
      const savedData = {
        version: '1.0',
        timestamp: Date.now(),
        config: { testingType: 'api' },
        currentStep: 5,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useConfigPersistence());
      const loaded = result.current.loadConfig();

      expect(loaded).not.toBeNull();
      expect(loaded!.config.testingType).toBe('api');
      expect(loaded!.currentStep).toBe(5);
    });

    it('should return null for version mismatch', () => {
      const savedData = {
        version: '0.9', // Different version
        timestamp: Date.now(),
        config: { testingType: 'web' },
        currentStep: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useConfigPersistence());
      expect(result.current.loadConfig()).toBeNull();
    });

    it('should return null for expired config', () => {
      const expiredData = {
        version: '1.0',
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
        config: { testingType: 'web' },
        currentStep: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expiredData));

      const { result } = renderHook(() => useConfigPersistence());
      expect(result.current.loadConfig()).toBeNull();
    });

    it('should return null and handle invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'corrupted-data');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useConfigPersistence());
      expect(result.current.loadConfig()).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('clearConfig', () => {
    it('should remove config from localStorage', async () => {
      const savedData = {
        version: '1.0',
        timestamp: Date.now(),
        config: { testingType: 'web' },
        currentStep: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useConfigPersistence());

      act(() => {
        result.current.clearConfig();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(result.current.hasSavedConfig).toBe(false);
    });
  });
});
