/**
 * Unit Tests for useAnalytics hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// We need to mock fetch and sendBeacon before importing the module
const mockFetch = vi.fn().mockResolvedValue({ ok: true });
const mockSendBeacon = vi.fn().mockReturnValue(true);

// Set up global mocks
beforeEach(() => {
  vi.useFakeTimers();
  global.fetch = mockFetch;
  Object.defineProperty(navigator, 'sendBeacon', {
    value: mockSendBeacon,
    writable: true,
    configurable: true,
  });
  sessionStorage.clear();
  mockFetch.mockClear();
  mockSendBeacon.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('useAnalytics', () => {
  async function loadAndRenderHook() {
    // Dynamic import to get fresh module state (event queue is module-level)
    const { useAnalytics } = await import('./useAnalytics');
    return renderHook(() => useAnalytics());
  }

  describe('session management', () => {
    it('should create session ID in sessionStorage', async () => {
      const { result } = await loadAndRenderHook();

      // Trigger useEffect
      await act(async () => {
        vi.runAllTimers();
      });

      const stored = sessionStorage.getItem('qa_session_id');
      expect(stored).toBeDefined();
      expect(stored).toMatch(/^sess_/);
    });

    it('should reuse existing session ID', async () => {
      sessionStorage.setItem('qa_session_id', 'sess_existing_123');

      const { result } = await loadAndRenderHook();

      await act(async () => {
        vi.runAllTimers();
      });

      expect(sessionStorage.getItem('qa_session_id')).toBe('sess_existing_123');
    });
  });

  describe('trackWizardStart', () => {
    it('should queue a wizard_start event', async () => {
      const { result } = await loadAndRenderHook();

      await act(async () => {
        vi.runAllTimers();
      });

      act(() => {
        result.current.trackWizardStart();
      });

      // Event is queued, flush after 2s debounce
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });

      expect(mockFetch).toHaveBeenCalled();
      const fetchCall = mockFetch.mock.calls.find(
        (call) => call[0]?.includes?.('analytics') || call[1]?.body?.includes?.('wizard_start')
      );
      // The hook sends batched events to /api/analytics/events
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/analytics/events',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('trackWizardStep', () => {
    it('should queue a wizard_step event with step data', async () => {
      const { result } = await loadAndRenderHook();

      await act(async () => {
        vi.runAllTimers();
      });

      // Clear the page_view event flush
      mockFetch.mockClear();

      act(() => {
        result.current.trackWizardStep(2, 'Framework', 'selenium');
      });

      await act(async () => {
        vi.advanceTimersByTime(2100);
      });

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const stepEvent = body.events.find((e: any) => e.eventType === 'wizard_step');
      expect(stepEvent).toBeDefined();
      expect(stepEvent.data.stepNumber).toBe(2);
      expect(stepEvent.data.stepName).toBe('Framework');
      expect(stepEvent.data.selection).toBe('selenium');
    });
  });

  describe('trackWizardComplete', () => {
    it('should send immediately (not batched)', async () => {
      const { result } = await loadAndRenderHook();

      await act(async () => {
        vi.runAllTimers();
      });

      mockFetch.mockClear();

      act(() => {
        result.current.trackWizardComplete({
          testingType: 'web',
          framework: 'selenium',
          language: 'java',
        });
      });

      // Should be sent immediately (no need to wait 2s)
      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('trackProjectDownload', () => {
    it('should send immediately with project details', async () => {
      const { result } = await loadAndRenderHook();

      await act(async () => {
        vi.runAllTimers();
      });

      mockFetch.mockClear();

      act(() => {
        result.current.trackProjectDownload('my-project', {
          testingType: 'api',
          framework: 'restassured',
          language: 'java',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('trackError', () => {
    it('should send error event immediately', async () => {
      const { result } = await loadAndRenderHook();

      await act(async () => {
        vi.runAllTimers();
      });

      mockFetch.mockClear();

      act(() => {
        result.current.trackError('GENERATION_FAILED', 'Something went wrong', {
          config: 'test',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('trackThemeToggle', () => {
    it('should queue a theme_toggle event', async () => {
      const { result } = await loadAndRenderHook();

      await act(async () => {
        vi.runAllTimers();
      });

      mockFetch.mockClear();

      act(() => {
        result.current.trackThemeToggle('dark');
      });

      // Batched - need to wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('error resilience', () => {
    it('should not break when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = await loadAndRenderHook();

      await act(async () => {
        vi.runAllTimers();
      });

      // Should not throw
      act(() => {
        result.current.trackWizardStart();
      });

      await act(async () => {
        vi.advanceTimersByTime(2100);
      });

      // Hook should still be functional
      expect(result.current.trackWizardStart).toBeDefined();
    });
  });
});
