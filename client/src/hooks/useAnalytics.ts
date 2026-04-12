/**
 * Client-side Analytics Hook for QAStarter
 *
 * Provides privacy-friendly analytics tracking without cookies.
 * Uses sessionStorage for session persistence within a browser tab.
 */

import { useEffect, useRef, useCallback } from 'react';

// Generate a session ID
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Get or create session ID from sessionStorage
function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();

  let sessionId = sessionStorage.getItem('qa_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('qa_session_id', sessionId);
  }
  return sessionId;
}

// Analytics event types
type EventType =
  | 'page_view'
  | 'wizard_start'
  | 'wizard_step'
  | 'wizard_complete'
  | 'wizard_abandon'
  | 'project_download'
  | 'theme_toggle'
  | 'error';

interface TrackEventOptions {
  immediate?: boolean; // Send immediately instead of batching
}

// Batch events for efficient sending
const MAX_QUEUE_SIZE = 200; // Cap to prevent unbounded memory growth

let eventQueue: Array<{
  eventType: EventType;
  data: Record<string, any>;
  timestamp: number;
}> = [];

let flushTimeout: ReturnType<typeof setTimeout> | null = null;

async function flushEvents(sessionId: string): Promise<void> {
  if (eventQueue.length === 0) return;

  // Snapshot events to send, but don't clear queue yet — only clear on success
  const events = [...eventQueue];

  try {
    const res = await fetch('/api/v1/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        events,
        metadata: {
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          language: navigator.language,
          referrer: document.referrer || undefined,
        },
      }),
    });

    if (res.ok) {
      // Only clear the events we successfully sent (new events may have arrived during fetch)
      eventQueue = eventQueue.slice(events.length);
    }
    // On non-ok response, keep events for retry on next flush
  } catch (error) {
    // Silently fail — events stay in queue for next flush attempt
    console.debug('Analytics flush failed:', error);
  }
}

function queueEvent(
  sessionId: string,
  eventType: EventType,
  data: Record<string, any>,
  options: TrackEventOptions = {}
): void {
  // Enforce queue cap — drop oldest events if at limit
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    eventQueue = eventQueue.slice(-Math.floor(MAX_QUEUE_SIZE / 2));
  }

  eventQueue.push({
    eventType,
    data,
    timestamp: Date.now(),
  });

  if (options.immediate) {
    if (flushTimeout) clearTimeout(flushTimeout);
    flushEvents(sessionId);
  } else {
    // Debounce: flush after 2 seconds of inactivity
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(() => flushEvents(sessionId), 2000);
  }
}

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const sessionIdRef = useRef<string>('');
  // Use a lazy initialization for the ref to avoid impure call warning, though useRef init is only run once.
  // Better yet, initialize in useEffect to be strictly pure or use a lazy init function.
  const startTimeRef = useRef<number>(0);
  const lastStepRef = useRef<number>(0);

  useEffect(() => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    startTimeRef.current = Date.now();

    // Track page view on mount
    queueEvent(sessionIdRef.current, 'page_view', {
      path: window.location.pathname,
    });

    // Track page unload to flush pending events
    const handleUnload = () => {
      if (eventQueue.length > 0) {
        // Use sendBeacon with Blob for reliable delivery on page unload
        // Blob ensures Content-Type: application/json so Express can parse the body
        const payload = JSON.stringify({
          sessionId: sessionIdRef.current,
          events: eventQueue,
          metadata: {
            userAgent: navigator.userAgent,
            timeOnPage: Date.now() - startTimeRef.current,
          },
        });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/v1/analytics/events', blob);
        eventQueue = []; // Clear after beacon (best-effort, no retry on unload)
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      // Flush on unmount
      flushEvents(sessionIdRef.current);
    };
  }, []);

  const trackWizardStart = useCallback(() => {
    startTimeRef.current = Date.now();
    lastStepRef.current = 0;
    queueEvent(sessionIdRef.current, 'wizard_start', {});
  }, []);

  const trackWizardStep = useCallback(
    (stepNumber: number, stepName: string, selection?: string) => {
      const timeOnStep = Date.now() - startTimeRef.current;
      lastStepRef.current = stepNumber;

      queueEvent(sessionIdRef.current, 'wizard_step', {
        stepNumber,
        stepName,
        selection,
        timeOnStep,
      });
    },
    []
  );

  const trackWizardComplete = useCallback((config: Record<string, any>) => {
    const totalTime = Date.now() - startTimeRef.current;

    queueEvent(
      sessionIdRef.current,
      'wizard_complete',
      {
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
        totalSteps: lastStepRef.current + 1,
        totalTimeMs: totalTime,
      },
      { immediate: true }
    );
  }, []);

  const trackProjectDownload = useCallback((projectName: string, config: Record<string, any>) => {
    queueEvent(
      sessionIdRef.current,
      'project_download',
      {
        projectName,
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
      },
      { immediate: true }
    );
  }, []);

  const trackError = useCallback(
    (errorType: string, message: string, context?: Record<string, any>) => {
      queueEvent(
        sessionIdRef.current,
        'error',
        {
          errorType,
          message,
          ...context,
        },
        { immediate: true }
      );
    },
    []
  );

  const trackThemeToggle = useCallback((theme: string) => {
    queueEvent(sessionIdRef.current, 'theme_toggle', { theme });
  }, []);

  return {
    sessionId: sessionIdRef.current,
    trackWizardStart,
    trackWizardStep,
    trackWizardComplete,
    trackProjectDownload,
    trackError,
    trackThemeToggle,
  };
}

export default useAnalytics;
