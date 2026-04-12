/**
 * Unit Tests for Analytics Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage to avoid file system / DB dependencies in unit tests
vi.mock('../storage', () => {
  const generations: any[] = [];
  return {
    storage: {
      saveProjectGeneration: vi.fn(async (config: any) => {
        generations.push({ ...config, createdAt: new Date().toISOString() });
        return String(generations.length);
      }),
      getProjectGenerationStats: vi.fn(async () => {
        const byTestingType = new Map<string, number>();
        const byFramework = new Map<string, number>();
        const byLanguage = new Map<string, number>();
        for (const g of generations) {
          byTestingType.set(g.testingType, (byTestingType.get(g.testingType) || 0) + 1);
          byFramework.set(g.framework, (byFramework.get(g.framework) || 0) + 1);
          byLanguage.set(g.language, (byLanguage.get(g.language) || 0) + 1);
        }
        const mapToArray = (map: Map<string, number>, keyName: string) =>
          Array.from(map.entries())
            .map(([key, count]) => ({ [keyName]: key, count }))
            .sort((a, b) => b.count - a.count);
        return {
          totalGenerated: generations.length,
          byTestingType: mapToArray(byTestingType, 'testingType'),
          byFramework: mapToArray(byFramework, 'framework'),
          byLanguage: mapToArray(byLanguage, 'language'),
          recentGenerations: generations.slice(-10).reverse(),
        };
      }),
    },
  };
});

import analyticsService, {
  generateSessionId,
  getDeviceType,
  trackEvent,
  trackProjectGeneration,
  trackWizardStep,
  getAnalyticsStats,
  getRecentAnalyticsEvents,
  type AnalyticsEventType,
} from './analyticsService';

describe('AnalyticsService', () => {
  beforeEach(() => {
    // Reset analytics between tests by tracking a reset event
    // Note: In a real scenario, we'd have a reset method
  });

  describe('generateSessionId', () => {
    it('should generate a session ID with correct format (sess_ + UUID)', () => {
      const sessionId = generateSessionId();

      // Format: sess_{uuid-v4}
      expect(sessionId).toMatch(
        /^sess_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();

      expect(id1).not.toBe(id2);
    });

    it('should start with sess_ prefix', () => {
      const sessionId = generateSessionId();
      expect(sessionId.startsWith('sess_')).toBe(true);
      // UUID portion should be 36 chars (8-4-4-4-12)
      expect(sessionId.substring(5)).toHaveLength(36);
    });
  });

  describe('getDeviceType', () => {
    it('should detect mobile devices', () => {
      const mobileAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (Linux; Android 10; SM-G960F)',
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)',
      ];

      mobileAgents.forEach((ua) => {
        expect(getDeviceType(ua)).toBe('mobile');
      });
    });

    it('should detect tablet devices', () => {
      const tabletAgents = [
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0)',
        'Mozilla/5.0 (Linux; U; en-US) AppleWebKit/537.36 (KHTML, like Gecko) Silk/85.3.2',
      ];

      tabletAgents.forEach((ua) => {
        expect(getDeviceType(ua)).toBe('tablet');
      });
    });

    it('should detect desktop devices', () => {
      const desktopAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      ];

      desktopAgents.forEach((ua) => {
        expect(getDeviceType(ua)).toBe('desktop');
      });
    });

    it('should default to desktop for unknown user agents', () => {
      expect(getDeviceType('')).toBe('desktop');
      expect(getDeviceType('Unknown Agent')).toBe('desktop');
    });
  });

  describe('trackEvent', () => {
    it('should track a basic event', () => {
      const sessionId = generateSessionId();

      // Should not throw
      expect(() => {
        trackEvent('page_view', sessionId, { page: '/home' });
      }).not.toThrow();
    });

    it('should track event with metadata', () => {
      const sessionId = generateSessionId();

      expect(() => {
        trackEvent(
          'wizard_start',
          sessionId,
          { step: 1 },
          {
            userAgent: 'Test Agent',
            deviceType: 'desktop',
          }
        );
      }).not.toThrow();
    });

    it('should store events that can be retrieved', () => {
      const sessionId = generateSessionId();
      trackEvent('project_download', sessionId, { projectName: 'test' });

      const events = getRecentAnalyticsEvents(100);
      const found = events.find(
        (e) => e.sessionId === sessionId && e.eventType === 'project_download'
      );

      expect(found).toBeDefined();
      expect(found?.data.projectName).toBe('test');
    });
  });

  describe('trackProjectGeneration', () => {
    it('should track project generation with full config', async () => {
      const sessionId = generateSessionId();

      await expect(
        trackProjectGeneration(sessionId, {
          testingType: 'web',
          framework: 'selenium',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          projectName: 'full-config-test',
          cicdTool: 'github-actions',
          reportingTool: 'allure',
          utilities: {
            logger: true,
            configReader: true,
          },
        })
      ).resolves.not.toThrow();
    });

    it('should handle missing optional fields', async () => {
      const sessionId = generateSessionId();

      await expect(
        trackProjectGeneration(sessionId, {
          testingType: 'api',
          framework: 'restassured',
          language: 'java',
          testRunner: 'testng',
          buildTool: 'maven',
          projectName: 'minimal-config-test',
        })
      ).resolves.not.toThrow();
    });

    it('should update generation stats', async () => {
      const sessionId = generateSessionId();
      const statsBefore = await getAnalyticsStats();
      const totalBefore = statsBefore.totalGenerated;

      await trackProjectGeneration(sessionId, {
        testingType: 'web',
        framework: 'playwright',
        language: 'typescript',
        testRunner: 'jest',
        buildTool: 'npm',
        projectName: 'stats-test',
      });

      const statsAfter = await getAnalyticsStats();
      expect(statsAfter.totalGenerated).toBe(totalBefore + 1);
    });
  });

  describe('trackWizardStep', () => {
    it('should track wizard step completion', () => {
      const sessionId = generateSessionId();

      expect(() => {
        trackWizardStep(sessionId, 1, 'testing-type', 'web');
      }).not.toThrow();
    });

    it('should track step without selection', () => {
      const sessionId = generateSessionId();

      expect(() => {
        trackWizardStep(sessionId, 5, 'configuration');
      }).not.toThrow();
    });
  });

  describe('getAnalyticsStats', () => {
    it('should return stats object with required fields', async () => {
      const stats = await getAnalyticsStats();

      expect(stats).toHaveProperty('totalGenerated');
      expect(stats).toHaveProperty('byTestingType');
      expect(stats).toHaveProperty('byFramework');
      expect(stats).toHaveProperty('byLanguage');
      expect(stats).toHaveProperty('recentGenerations');
    });

    it('should track by testing type', async () => {
      const sessionId = generateSessionId();

      await trackProjectGeneration(sessionId, {
        testingType: 'mobile',
        framework: 'appium',
        language: 'python',
        testRunner: 'pytest',
        buildTool: 'pip',
        projectName: 'mobile-test',
      });

      const stats = await getAnalyticsStats();
      const mobileEntry = stats.byTestingType.find((entry: any) => entry.testingType === 'mobile');
      expect(mobileEntry).toBeDefined();
      expect(mobileEntry.count).toBeGreaterThan(0);
    });

    it('should track by framework', async () => {
      const sessionId = generateSessionId();

      await trackProjectGeneration(sessionId, {
        testingType: 'web',
        framework: 'cypress',
        language: 'typescript',
        testRunner: 'cypress',
        buildTool: 'npm',
        projectName: 'cypress-test',
      });

      const stats = await getAnalyticsStats();
      const cypressEntry = stats.byFramework.find((entry: any) => entry.framework === 'cypress');
      expect(cypressEntry).toBeDefined();
      expect(cypressEntry.count).toBeGreaterThan(0);
    });
  });

  describe('getRecentAnalyticsEvents', () => {
    it('should return array of events', () => {
      const events = getRecentAnalyticsEvents();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should respect limit parameter', () => {
      // Track multiple events
      const sessionId = generateSessionId();
      for (let i = 0; i < 10; i++) {
        trackEvent('page_view', sessionId, { page: `/page-${i}` });
      }

      const limited = getRecentAnalyticsEvents(5);
      expect(limited.length).toBeLessThanOrEqual(5);
    });

    it('should return events with correct structure', () => {
      const sessionId = generateSessionId();
      trackEvent('wizard_complete', sessionId, { success: true });

      const events = getRecentAnalyticsEvents(10);
      const event = events[events.length - 1];

      expect(event).toHaveProperty('eventType');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('sessionId');
      expect(event).toHaveProperty('data');
      expect(event).toHaveProperty('metadata');
    });
  });

  describe('default export', () => {
    it('should export all functions', () => {
      expect(analyticsService.trackEvent).toBeDefined();
      expect(analyticsService.trackProjectGeneration).toBeDefined();
      expect(analyticsService.trackWizardStep).toBeDefined();
      expect(analyticsService.getAnalyticsStats).toBeDefined();
      expect(analyticsService.getRecentAnalyticsEvents).toBeDefined();
      expect(analyticsService.generateSessionId).toBeDefined();
      expect(analyticsService.getDeviceType).toBeDefined();
    });
  });
});
