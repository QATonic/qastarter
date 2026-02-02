/**
 * Sample Test Patterns Configuration
 *
 * Centralized configuration for identifying sample test files in template packs.
 * These patterns help the engine exclude sample tests when includeSampleTests is false.
 *
 * Patterns are organized by category for maintainability.
 */

// Infrastructure files that are NOT sample tests (always included)
export const infrastructurePatterns = {
    fileNames: [
        'conftest.py.hbs',
        'setup.js.hbs',
        'setup.ts.hbs',
        'basetest.cs.hbs',
        'hooks.java.hbs',
        'hooks.cs.hbs',
        'basescreen.swift.hbs',
        'testdata.swift.hbs',
    ],
    prefixes: ['base'],
    includes: ['testdata.'],
};

// Directories that contain test files
export const testDirectories = [
    '/tests/',
    '/test/',
    '/src/test/',
    '/androidtest/',
    '/uitests/',
    '/features/',
    '/step_defs/',
    '/step-definitions/',
    '/stepdefinitions/',
    '/steps/',
    '/bdd/',
    '/cypress/e2e/',
    '/cypress/integration/',
];

// File patterns that identify sample test files by extension/naming
export const sampleTestPatterns = {
    java: [
        'tests.java.hbs',
        'test.java.hbs',
        'steps.java.hbs',
        'testrunner.java.hbs',
        'suite.java.hbs',
    ],
    python: ['test_', '_test.py.hbs'],
    javascript: [
        '.test.js.hbs',
        '.spec.js.hbs',
        '.steps.js.hbs',
        '_steps.js.hbs',
        '.cy.js.hbs',
    ],
    typescript: [
        '.test.ts.hbs',
        '.spec.ts.hbs',
        '.steps.ts.hbs',
        '_steps.ts.hbs',
        '.cy.ts.hbs',
    ],
    csharp: ['tests.cs.hbs', 'test.cs.hbs'],
    swift: ['test.swift.hbs', 'uitest.swift.hbs', 'tests.swift.hbs'],
    bdd: ['.feature.hbs', '.story.hbs'],
};

/**
 * Check if a file is an infrastructure file (not a sample test)
 */
export function isInfrastructureFile(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();

    // Check exact file name matches
    if (infrastructurePatterns.fileNames.includes(lowerFileName)) {
        return true;
    }

    // Check prefixes
    if (infrastructurePatterns.prefixes.some((prefix) => lowerFileName.startsWith(prefix))) {
        return true;
    }

    // Check includes
    if (infrastructurePatterns.includes.some((pattern) => lowerFileName.includes(pattern))) {
        return true;
    }

    return false;
}

/**
 * Check if a file path is within a test directory
 */
export function isInTestDirectory(filePath: string): boolean {
    const lowerPath = filePath.toLowerCase();
    return testDirectories.some((dir) => lowerPath.includes(dir));
}

/**
 * Check if a file matches sample test patterns
 */
export function matchesSampleTestPattern(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();

    // Check all language patterns
    const allPatterns = [
        ...sampleTestPatterns.java,
        ...sampleTestPatterns.python,
        ...sampleTestPatterns.javascript,
        ...sampleTestPatterns.typescript,
        ...sampleTestPatterns.csharp,
        ...sampleTestPatterns.swift,
        ...sampleTestPatterns.bdd,
    ];

    return allPatterns.some((pattern) => {
        // Handle prefix patterns (e.g., 'test_')
        if (pattern.endsWith('_')) {
            return lowerFileName.startsWith(pattern);
        }
        // Handle suffix patterns
        return lowerFileName.endsWith(pattern);
    });
}

/**
 * Main function to check if a file is a sample test file
 * Used by templatePackEngine.isSampleTestFile()
 */
export function isSampleTestFile(filePath: string): boolean {
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';

    // Infrastructure files are NOT sample tests
    if (isInfrastructureFile(fileName)) {
        return false;
    }

    // Must be in a test directory
    if (!isInTestDirectory(filePath)) {
        return false;
    }

    // Must match a sample test pattern
    return matchesSampleTestPattern(fileName);
}
