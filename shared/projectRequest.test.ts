import { describe, expect, it } from 'vitest';
import { projectRequestSchema } from './projectRequest';

describe('project request normalization', () => {
  const minimal = {
    projectName: 'demo',
    testingType: 'web',
    framework: 'cypress',
    language: 'typescript',
  };

  it('chooses framework-aware runner, build tool and pattern defaults', () => {
    expect(projectRequestSchema.parse(minimal)).toMatchObject({
      testRunner: 'cypress',
      buildTool: 'npm',
      testingPattern: 'page-object-model',
    });
    expect(
      projectRequestSchema.parse({
        ...minimal,
        testingType: 'performance',
        framework: 'gatling',
        language: 'java',
      })
    ).toMatchObject({ testRunner: 'maven', buildTool: 'maven', testingPattern: 'load-test' });
  });

  it('normalizes CLI/MCP and query utilities into the web configuration shape', () => {
    const expected = { logger: true, configReader: true, faker: true };
    expect(
      projectRequestSchema.parse({ ...minimal, utilities: ['logger', 'configReader', 'faker'] })
        .utilities
    ).toEqual(expected);
    expect(
      projectRequestSchema.parse({ ...minimal, utilities: 'logging,configReader,faker' }).utilities
    ).toEqual(expected);
    expect(projectRequestSchema.parse({ ...minimal, utilities: expected }).utilities).toEqual(
      expected
    );
  });

  it('does not hide invalid option types or missing required identity fields', () => {
    expect(
      projectRequestSchema.safeParse({ ...minimal, utilities: ['not-a-utility'] }).success
    ).toBe(false);
    expect(projectRequestSchema.safeParse({ ...minimal, testRunner: ['jest'] }).success).toBe(
      false
    );
    expect(projectRequestSchema.safeParse({ ...minimal, projectName: undefined }).success).toBe(
      false
    );
  });
});
