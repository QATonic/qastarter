
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import path from 'path';
import { ProjectTemplateGenerator } from '../templates';
import { ProjectConfig } from '@shared/schema';

describe('ProjectTemplateGenerator Snapshots', () => {
    let generator: ProjectTemplateGenerator;
    // Set a fixed date for stable snapshots
    const FIXED_DATE = new Date('2024-01-01T12:00:00Z');

    beforeAll(() => {
        // Mock system time
        vi.useFakeTimers();
        vi.setSystemTime(FIXED_DATE);

        // Initialize generator with correct path
        const templatesPath = path.join(process.cwd(), 'server', 'templates', 'packs');
        generator = new ProjectTemplateGenerator(templatesPath);
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('should match snapshot for Java + Selenium + Maven', async () => {
        const config: ProjectConfig = {
            projectName: 'demo-java-selenium',
            testingType: 'web',
            language: 'java',
            framework: 'selenium',
            buildTool: 'maven',
            testRunner: 'testng',
            testingPattern: 'page-object-model',
            utilities: {
                logger: true
            },
            includeSampleTests: true
        };

        const files = await generator.generateProject(config);

        // Sort files by path for stable order
        files.sort((a, b) => a.path.localeCompare(b.path));

        // Create a focused snapshot object (path + content preview)
        // We avoid snapshotting entire huge file contents if they are standard, 
        // but for a strict golden master, full content is better.
        // However, to keep snapshots readable, we might want to just snapshot the array.
        expect(files).toMatchSnapshot();
    });

    it('should match snapshot for Python + Playwright + Pytest', async () => {
        const config: ProjectConfig = {
            projectName: 'demo-python-playwright',
            testingType: 'web',
            language: 'python',
            framework: 'playwright',
            buildTool: 'pip',
            testRunner: 'pytest',
            testingPattern: 'page-object-model',
            utilities: {
                htmlReport: true // intentionally using a non-standard utility key to check handling
            },
            includeSampleTests: true
        };

        const files = await generator.generateProject(config);
        files.sort((a, b) => a.path.localeCompare(b.path));
        expect(files).toMatchSnapshot();
    });

    it('should match snapshot for TypeScript + Cypress', async () => {
        const config: ProjectConfig = {
            projectName: 'demo-ts-cypress',
            testingType: 'web',
            language: 'typescript',
            framework: 'cypress',
            buildTool: 'npm',
            testRunner: 'cypress',
            testingPattern: 'page-object-model',
            includeSampleTests: true
        };

        const files = await generator.generateProject(config);
        files.sort((a, b) => a.path.localeCompare(b.path));
        expect(files).toMatchSnapshot();
    });
});
