/**
 * Analytics Service for QAStarter
 * 
 * Privacy-friendly anonymous analytics without requiring login/signup.
 * Tracks usage patterns without collecting personally identifiable information.
 */

import { logger } from '../utils/logger';

// Analytics event types
export type AnalyticsEventType =
    | 'page_view'
    | 'wizard_start'
    | 'wizard_step'
    | 'wizard_complete'
    | 'project_generate'
    | 'project_download'
    | 'error';

export interface AnalyticsEvent {
    eventType: AnalyticsEventType;
    timestamp: Date;
    sessionId: string;
    data: Record<string, any>;
    metadata: {
        userAgent?: string;
        country?: string;
        deviceType?: 'mobile' | 'tablet' | 'desktop';
        referrer?: string;
    };
}

export interface GenerationStats {
    totalGenerations: number;
    byTestingType: Record<string, number>;
    byFramework: Record<string, number>;
    byLanguage: Record<string, number>;
    byCiCd: Record<string, number>;
    popularCombinations: Array<{
        testingType: string;
        framework: string;
        language: string;
        count: number;
    }>;
    recentGenerations: number; // Last 24 hours
}

// In-memory analytics store (for development/simple deployments)
// In production, you'd use a database or external analytics service
class AnalyticsStore {
    private events: AnalyticsEvent[] = [];
    private generationStats: GenerationStats = {
        totalGenerations: 0,
        byTestingType: {},
        byFramework: {},
        byLanguage: {},
        byCiCd: {},
        popularCombinations: [],
        recentGenerations: 0,
    };
    private combinationCounts: Map<string, number> = new Map();
    private readonly MAX_EVENTS = 10000; // Keep only last 10k events in memory

    addEvent(event: AnalyticsEvent): void {
        this.events.push(event);

        // Trim old events if needed
        if (this.events.length > this.MAX_EVENTS) {
            this.events = this.events.slice(-this.MAX_EVENTS);
        }

        // Update stats for generation events
        if (event.eventType === 'project_generate') {
            this.updateGenerationStats(event);
        }

        // Log for structured logging
        logger.info('Analytics event', {
            eventType: event.eventType,
            sessionId: event.sessionId.substring(0, 8), // Only log partial session ID
            data: event.data,
        });
    }

    private updateGenerationStats(event: AnalyticsEvent): void {
        const { testingType, framework, language, cicdTool } = event.data;

        this.generationStats.totalGenerations++;

        // Update by category
        if (testingType) {
            this.generationStats.byTestingType[testingType] =
                (this.generationStats.byTestingType[testingType] || 0) + 1;
        }
        if (framework) {
            this.generationStats.byFramework[framework] =
                (this.generationStats.byFramework[framework] || 0) + 1;
        }
        if (language) {
            this.generationStats.byLanguage[language] =
                (this.generationStats.byLanguage[language] || 0) + 1;
        }
        if (cicdTool) {
            this.generationStats.byCiCd[cicdTool] =
                (this.generationStats.byCiCd[cicdTool] || 0) + 1;
        }

        // Track popular combinations
        if (testingType && framework && language) {
            const combo = `${testingType}|${framework}|${language}`;
            this.combinationCounts.set(combo, (this.combinationCounts.get(combo) || 0) + 1);
            this.updatePopularCombinations();
        }
    }

    private updatePopularCombinations(): void {
        const combos = Array.from(this.combinationCounts.entries())
            .map(([key, count]) => {
                const [testingType, framework, language] = key.split('|');
                return { testingType, framework, language, count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        this.generationStats.popularCombinations = combos;
    }

    getStats(): GenerationStats {
        // Calculate recent generations (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.generationStats.recentGenerations = this.events.filter(
            e => e.eventType === 'project_generate' && e.timestamp > oneDayAgo
        ).length;

        return { ...this.generationStats };
    }

    getRecentEvents(limit: number = 100): AnalyticsEvent[] {
        return this.events.slice(-limit);
    }

    getEventsBySession(sessionId: string): AnalyticsEvent[] {
        return this.events.filter(e => e.sessionId === sessionId);
    }
}

// Singleton instance
const analyticsStore = new AnalyticsStore();

/**
 * Generate a session ID (for anonymous session tracking)
 */
export function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Parse device type from user agent
 */
export function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
        return 'mobile';
    }
    if (/ipad|tablet|playbook|silk/i.test(ua)) {
        return 'tablet';
    }
    return 'desktop';
}

/**
 * Track an analytics event
 */
export function trackEvent(
    eventType: AnalyticsEventType,
    sessionId: string,
    data: Record<string, any>,
    metadata: AnalyticsEvent['metadata'] = {}
): void {
    const event: AnalyticsEvent = {
        eventType,
        timestamp: new Date(),
        sessionId,
        data,
        metadata,
    };

    analyticsStore.addEvent(event);
}

/**
 * Track project generation with full configuration
 */
export function trackProjectGeneration(
    sessionId: string,
    config: {
        testingType: string;
        framework: string;
        language: string;
        testRunner: string;
        buildTool: string;
        cicdTool?: string;
        reportingTool?: string;
        utilities?: Record<string, boolean>;
    },
    metadata: AnalyticsEvent['metadata'] = {}
): void {
    const enabledUtilities = config.utilities
        ? Object.entries(config.utilities)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key)
        : [];

    trackEvent('project_generate', sessionId, {
        testingType: config.testingType,
        framework: config.framework,
        language: config.language,
        testRunner: config.testRunner,
        buildTool: config.buildTool,
        cicdTool: config.cicdTool || 'none',
        reportingTool: config.reportingTool || 'none',
        utilitiesCount: enabledUtilities.length,
        utilities: enabledUtilities,
    }, metadata);
}

/**
 * Track wizard step completion
 */
export function trackWizardStep(
    sessionId: string,
    stepNumber: number,
    stepName: string,
    selection?: string
): void {
    trackEvent('wizard_step', sessionId, {
        stepNumber,
        stepName,
        selection,
    });
}

/**
 * Get aggregated analytics stats
 */
export function getAnalyticsStats(): GenerationStats {
    return analyticsStore.getStats();
}

/**
 * Get recent analytics events
 */
export function getRecentAnalyticsEvents(limit: number = 100): AnalyticsEvent[] {
    return analyticsStore.getRecentEvents(limit);
}

export default {
    trackEvent,
    trackProjectGeneration,
    trackWizardStep,
    getAnalyticsStats,
    getRecentAnalyticsEvents,
    generateSessionId,
    getDeviceType,
};
