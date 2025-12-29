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
let eventQueue: Array<{
    eventType: EventType;
    data: Record<string, any>;
    timestamp: number;
}> = [];

let flushTimeout: ReturnType<typeof setTimeout> | null = null;

async function flushEvents(sessionId: string): Promise<void> {
    if (eventQueue.length === 0) return;

    const events = [...eventQueue];
    eventQueue = [];

    try {
        await fetch('/api/analytics/events', {
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
    } catch (error) {
        // Silently fail - analytics should never break the app
        console.debug('Analytics flush failed:', error);
    }
}

function queueEvent(
    sessionId: string,
    eventType: EventType,
    data: Record<string, any>,
    options: TrackEventOptions = {}
): void {
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
    const startTimeRef = useRef<number>(Date.now());
    const lastStepRef = useRef<number>(0);

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
                // Use sendBeacon for reliable delivery on page unload
                const data = JSON.stringify({
                    sessionId: sessionIdRef.current,
                    events: eventQueue,
                    metadata: {
                        userAgent: navigator.userAgent,
                        timeOnPage: Date.now() - startTimeRef.current,
                    },
                });
                navigator.sendBeacon('/api/analytics/events', data);
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

    const trackWizardStep = useCallback((stepNumber: number, stepName: string, selection?: string) => {
        const timeOnStep = Date.now() - startTimeRef.current;
        lastStepRef.current = stepNumber;

        queueEvent(sessionIdRef.current, 'wizard_step', {
            stepNumber,
            stepName,
            selection,
            timeOnStep,
        });
    }, []);

    const trackWizardComplete = useCallback((config: Record<string, any>) => {
        const totalTime = Date.now() - startTimeRef.current;

        queueEvent(sessionIdRef.current, 'wizard_complete', {
            testingType: config.testingType,
            framework: config.framework,
            language: config.language,
            totalSteps: lastStepRef.current + 1,
            totalTimeMs: totalTime,
        }, { immediate: true });
    }, []);

    const trackProjectDownload = useCallback((projectName: string, config: Record<string, any>) => {
        queueEvent(sessionIdRef.current, 'project_download', {
            projectName,
            testingType: config.testingType,
            framework: config.framework,
            language: config.language,
        }, { immediate: true });
    }, []);

    const trackError = useCallback((errorType: string, message: string, context?: Record<string, any>) => {
        queueEvent(sessionIdRef.current, 'error', {
            errorType,
            message,
            ...context,
        }, { immediate: true });
    }, []);

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
