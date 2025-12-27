import inquirer from 'inquirer';
import type { MetadataResponse, GenerateOptions } from './api.js';

export async function promptForOptions(metadata: MetadataResponse): Promise<GenerateOptions> {
  const { testingType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'testingType',
      message: 'What type of testing do you want to set up?',
      choices: metadata.testingTypes.map(t => ({
        name: t.charAt(0).toUpperCase() + t.slice(1) + ' Testing',
        value: t
      }))
    }
  ]);

  const availableFrameworks = Object.entries(metadata.frameworks)
    .filter(([_, info]) => info.testingTypes.includes(testingType))
    .map(([name, _]) => name);

  const { framework } = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Select a testing framework:',
      choices: availableFrameworks.map(f => ({
        name: f.charAt(0).toUpperCase() + f.slice(1),
        value: f
      }))
    }
  ]);

  const frameworkInfo = metadata.frameworks[framework];
  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Select a programming language:',
      choices: frameworkInfo.languages.map(l => ({
        name: l.charAt(0).toUpperCase() + l.slice(1),
        value: l
      }))
    }
  ]);

  const testRunnerChoices = metadata.testRunners[language] || [];
  const buildToolChoices = metadata.buildTools[language] || [];

  const { testRunner, buildTool } = await inquirer.prompt([
    {
      type: 'list',
      name: 'testRunner',
      message: 'Select a test runner:',
      choices: testRunnerChoices,
      when: testRunnerChoices.length > 1
    },
    {
      type: 'list',
      name: 'buildTool',
      message: 'Select a build tool:',
      choices: buildToolChoices,
      when: buildToolChoices.length > 1
    }
  ]);

  const { testingPattern } = await inquirer.prompt([
    {
      type: 'list',
      name: 'testingPattern',
      message: 'Select a testing pattern:',
      choices: metadata.testingPatterns.map(p => ({
        name: p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: p
      }))
    }
  ]);

  const { cicdTool } = await inquirer.prompt([
    {
      type: 'list',
      name: 'cicdTool',
      message: 'Select a CI/CD platform (optional):',
      choices: [
        { name: 'None', value: '' },
        ...metadata.cicdTools.map(c => ({
          name: c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          value: c
        }))
      ]
    }
  ]);

  const { reportingTool } = await inquirer.prompt([
    {
      type: 'list',
      name: 'reportingTool',
      message: 'Select a reporting tool (optional):',
      choices: [
        { name: 'None', value: '' },
        ...metadata.reportingTools.map(r => ({
          name: r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          value: r
        }))
      ]
    }
  ]);

  const { utilities } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'utilities',
      message: 'Select utilities to include:',
      choices: metadata.utilities.map(u => ({
        name: u.split(/(?=[A-Z])/).join(' '),
        value: u,
        checked: true
      }))
    }
  ]);

  const { includeSampleTests } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'includeSampleTests',
      message: 'Include sample tests?',
      default: true
    }
  ]);

  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Enter project name:',
      default: 'my-qa-project',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
        return true;
      }
    }
  ]);

  return {
    projectName,
    testingType,
    framework,
    language,
    testRunner: testRunner || testRunnerChoices[0],
    buildTool: buildTool || buildToolChoices[0],
    testingPattern,
    cicdTool: cicdTool || undefined,
    reportingTool: reportingTool || undefined,
    utilities,
    includeSampleTests
  };
}
