#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { fetchMetadata, generateProject, type GenerateOptions } from './lib/api.js';
import { promptForOptions } from './lib/prompts.js';

const program = new Command();

program
  .name('qastarter')
  .description('CLI tool for generating QA automation project structures')
  .version('1.0.0');

program
  .command('new')
  .description('Generate a new QA automation project')
  .option('-n, --name <name>', 'Project name', 'my-qa-project')
  .option('-t, --type <type>', 'Testing type (web, mobile, api, desktop)')
  .option('-f, --framework <framework>', 'Testing framework (selenium, playwright, cypress, etc.)')
  .option('-l, --language <language>', 'Programming language (java, typescript, python, csharp)')
  .option('-r, --runner <runner>', 'Test runner')
  .option('-b, --build <tool>', 'Build tool')
  .option('-p, --pattern <pattern>', 'Testing pattern (page-object-model, bdd, fluent)')
  .option('-c, --cicd <tool>', 'CI/CD tool (github-actions, gitlab-ci, azure-devops, etc.)')
  .option('--reporting <tool>', 'Reporting tool (allure, extent-reports, etc.)')
  .option('-u, --utilities <list>', 'Utilities (comma-separated)')
  .option('--no-samples', 'Exclude sample tests')
  .option('-o, --output <path>', 'Output directory', '.')
  .option('-i, --interactive', 'Use interactive mode')
  .action(async (options) => {
    console.log(chalk.cyan('\n  QAStarter CLI\n'));

    const spinner = ora('Fetching available options...').start();

    try {
      const metadata = await fetchMetadata();
      spinner.succeed('Options loaded');

      let generateOptions: GenerateOptions;

      if (options.interactive || (!options.framework && !options.type)) {
        generateOptions = await promptForOptions(metadata);
      } else {
        generateOptions = {
          projectName: options.name,
          testingType: options.type || 'web',
          framework: options.framework || 'selenium',
          language: options.language || 'java',
          testRunner: options.runner,
          buildTool: options.build,
          testingPattern: options.pattern || 'page-object-model',
          cicdTool: options.cicd,
          reportingTool: options.reporting,
          utilities: options.utilities ? options.utilities.split(',') : undefined,
          includeSampleTests: options.samples !== false,
        };
      }

      const downloadSpinner = ora('Generating project...').start();
      const outputPath = path.resolve(options.output);
      const filePath = await generateProject(generateOptions, outputPath);
      downloadSpinner.succeed(`Project saved to ${chalk.green(filePath)}`);

      console.log(chalk.cyan('\n  Next steps:\n'));
      console.log(
        chalk.white(`    1. Unzip the project: ${chalk.yellow(`unzip ${path.basename(filePath)}`)}`)
      );
      console.log(chalk.white(`    2. Navigate to the project directory`));
      console.log(chalk.white(`    3. Follow the README.md for setup instructions\n`));
    } catch (error) {
      spinner.fail('Failed to generate project');
      console.error(
        chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available frameworks, languages, and options')
  .option('-t, --type <type>', 'Filter by testing type (web, mobile, api, desktop)')
  .action(async (options) => {
    const spinner = ora('Fetching available options...').start();

    try {
      const metadata = await fetchMetadata();
      spinner.stop();

      console.log(chalk.cyan('\n  Available Options\n'));

      console.log(chalk.white.bold('  Testing Types:'));
      metadata.testingTypes.forEach((t) => {
        console.log(chalk.gray(`    - ${t}`));
      });

      console.log(chalk.white.bold('\n  Frameworks:'));
      Object.entries(metadata.frameworks).forEach(([name, info]) => {
        if (!options.type || info.testingTypes.includes(options.type)) {
          console.log(chalk.gray(`    - ${name}`));
          console.log(chalk.dim(`        Languages: ${info.languages.join(', ')}`));
          console.log(chalk.dim(`        Types: ${info.testingTypes.join(', ')}`));
        }
      });

      console.log(chalk.white.bold('\n  Testing Patterns:'));
      metadata.testingPatterns.forEach((p) => {
        console.log(chalk.gray(`    - ${p}`));
      });

      console.log(chalk.white.bold('\n  CI/CD Tools:'));
      metadata.cicdTools.forEach((c) => {
        console.log(chalk.gray(`    - ${c}`));
      });

      console.log(chalk.white.bold('\n  Reporting Tools:'));
      metadata.reportingTools.forEach((r) => {
        console.log(chalk.gray(`    - ${r}`));
      });

      console.log();
    } catch (error) {
      spinner.fail('Failed to fetch options');
      console.error(
        chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
      process.exit(1);
    }
  });

program.parse();
