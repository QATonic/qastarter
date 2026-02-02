/**
 * Analytics Service for QAStarter
 *
 * Privacy-friendly anonymous analytics without requiring login/signup.
 * Tracks usage patterns without collecting personally identifiable information.
 */

import { logger } from '../utils/logger';
import { storage } from '../storage';
import { ProjectConfig } from '@shared/schema';

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
  totalGenerated: number;
  byTestingType: any[];
  byFramework: any[];
  byLanguage: any[];
  recentGenerations: any[];
}

// In-memory analytics store for high-volume ephemeral events (wizard steps, etc.)
// Project generation data is persisted to DB via storage.ts
class EphemeralAnalyticsStore {
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 10000; // Keep only last 10k events in memory
  private readonly MAX_MEMORY_MB = 50; // Maximum memory for analytics store
  private memoryCheckCounter = 0;

  addEvent(event: AnalyticsEvent): void {
    this.events.push(event);

    // Trim old events if count exceeded
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Periodically check memory usage (every 500 events)
    this.memoryCheckCounter++;
    if (this.memoryCheckCounter >= 500) {
      this.memoryCheckCounter = 0;
      this.checkMemoryUsage();
    }

    // Log for structured logging
    logger.info('Analytics event', {
      eventType: event.eventType,
      sessionId: event.sessionId.substring(0, 8), // Only log partial session ID
      data: event.data,
    });
  }

  private checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;

    if (heapUsedMB > this.MAX_MEMORY_MB) {
      logger.warn(`Analytics memory usage high (${heapUsedMB.toFixed(1)}MB), trimming events`);
      // Aggressively trim to half
      this.events = this.events.slice(-Math.floor(this.MAX_EVENTS / 2));
    }
  }

  getRecentEvents(limit: number = 100): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  getEventsBySession(sessionId: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.sessionId === sessionId);
  }
}

// Singleton instance for ephemeral events
const ephemeralStore = new EphemeralAnalyticsStore();

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

  ephemeralStore.addEvent(event);
}

/**
 * Track project generation with persistent storage
 */
export async function trackProjectGeneration(
  sessionId: string,
  config: {
    testingType: string;
    framework: string;
    language: string;
    testRunner: string;
    buildTool: string;
    projectName: string; // Added projectName
    cicdTool?: string;
    reportingTool?: string;
    utilities?: Record<string, boolean>;
  },
  metadata: AnalyticsEvent['metadata'] = {}
): Promise<void> {
  const enabledUtilities = config.utilities
    ? Object.entries(config.utilities)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key)
    : [];

  // 1. Track ephemeral event for live monitoring/logging
  trackEvent(
    'project_generate',
    sessionId,
    {
      ...config,
      utilitiesCount: enabledUtilities.length,
      utilities: enabledUtilities,
    },
    metadata
  );

  // 2. Persist to storage (DB)
  try {
    // Adapter to match ProjectConfig interface if needed, or pass directly if matches
    // config has almost all ProjectConfig fields except maybe testingPattern if not passed
    const projectConfig: ProjectConfig = {
      projectName: config.projectName || 'untitled-project',
      testingType: config.testingType as any,
      framework: config.framework,
      language: config.language,
      testRunner: config.testRunner,
      buildTool: config.buildTool,
      testingPattern: 'page-object-model', // Default implicitly
      cicdTool: config.cicdTool,
      reportingTool: config.reportingTool,
      includeSampleTests: true,
      utilities: config.utilities
    };

    await storage.saveProjectGeneration(projectConfig);
  } catch (error) {
    logger.error('Failed to persist project generation stats', { error });
  }
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
 * Get aggregated analytics stats from persistent storage
 */
export async function getAnalyticsStats(): Promise<GenerationStats> {
  return await storage.getProjectGenerationStats();
}

/**
 * Get recent analytics events
 */
export function getRecentAnalyticsEvents(limit: number = 100): AnalyticsEvent[] {
  return ephemeralStore.getRecentEvents(limit);
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
