/**
 * Shared Version Loader
 * 
 * Loads centralized tool versions from shared/versions.json
 * Provides version merging with manifest-specific overrides
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface SharedVersions {
    java?: Record<string, string>;
    node?: Record<string, string>;
    python?: Record<string, string>;
    dotnet?: Record<string, string>;
    swift?: Record<string, string>;
    kotlin?: Record<string, string>;
    webTesting?: Record<string, string>;
    apiTesting?: Record<string, string>;
    mobileTesting?: Record<string, string>;
    desktopTesting?: Record<string, string>;
    testRunners?: Record<string, string>;
    reporting?: Record<string, string>;
    utilities?: Record<string, string>;
}

// Cache for shared versions
let sharedVersionsCache: Record<string, string> | null = null;

/**
 * Load and flatten shared versions from versions.json
 */
export async function loadSharedVersions(): Promise<Record<string, string>> {
    if (sharedVersionsCache) {
        return sharedVersionsCache;
    }

    const versionsPath = path.join(__dirname, 'versions.json');

    try {
        const content = await fs.readFile(versionsPath, 'utf-8');
        const versions: SharedVersions = JSON.parse(content);

        // Flatten nested structure into a single record
        const flattened: Record<string, string> = {};

        for (const [category, categoryVersions] of Object.entries(versions)) {
            // Skip JSON schema and comment fields
            if (category.startsWith('$')) continue;

            if (typeof categoryVersions === 'object' && categoryVersions !== null) {
                for (const [tool, version] of Object.entries(categoryVersions)) {
                    if (typeof version === 'string') {
                        flattened[tool] = version;
                    }
                }
            }
        }

        sharedVersionsCache = flattened;
        return flattened;
    } catch (error) {
        console.warn('Failed to load shared versions, using empty defaults:', error);
        return {};
    }
}

/**
 * Merge manifest versions with shared versions
 * Manifest versions take precedence over shared versions
 */
export function mergeVersions(
    manifestVersions: Record<string, string>,
    sharedVersions: Record<string, string>
): Record<string, string> {
    return {
        ...sharedVersions,
        ...manifestVersions  // Manifest overrides shared
    };
}

/**
 * Clear the versions cache (useful for testing)
 */
export function clearVersionsCache(): void {
    sharedVersionsCache = null;
}

/**
 * Get version for a specific tool
 */
export async function getToolVersion(tool: string): Promise<string | undefined> {
    const versions = await loadSharedVersions();
    return versions[tool];
}
