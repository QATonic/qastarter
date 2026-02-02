
import { describe, it, expect, vi, beforeEach } from 'vitest';
import analyticsService, { trackProjectGeneration, getAnalyticsStats } from '../services/analyticsService';
import { storage } from '../storage';

// Mock the storage module
vi.mock('../storage', () => ({
    storage: {
        saveProjectGeneration: vi.fn().mockResolvedValue('123'),
        getProjectGenerationStats: vi.fn().mockResolvedValue({
            totalGenerated: 5,
            byTestingType: [],
            byFramework: [],
            byLanguage: [],
            recentGenerations: []
        })
    }
}));

describe('Analytics Service Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should persist project generation to storage', async () => {
        const config = {
            testingType: 'web',
            framework: 'react',
            language: 'typescript',
            testRunner: 'vitest',
            buildTool: 'vite',
            projectName: 'test-project',
            utilities: { logger: true }
        };

        await trackProjectGeneration('test-session-id', config);

        expect(storage.saveProjectGeneration).toHaveBeenCalledWith(expect.objectContaining({
            projectName: 'test-project',
            framework: 'react',
            language: 'typescript'
        }));
    });

    it('should retrieve stats from storage', async () => {
        const stats = await getAnalyticsStats();

        expect(storage.getProjectGenerationStats).toHaveBeenCalled();
        expect(stats.totalGenerated).toBe(5);
    });
});
