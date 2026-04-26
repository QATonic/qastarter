import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            '**/*.config.js',
            '**/*.config.ts',
            'server/templates/packs/**',
            'cli/dist/**',
            'scripts/**',
            'tmp/**',
        ],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                RequestInit: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptPlugin,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            prettier: prettierPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...typescriptPlugin.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            ...prettierConfig.rules,
            'no-unused-vars': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }],
            'react/no-unescaped-entities': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-empty-object-type': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/preserve-manual-memoization': 'warn',
            'react-hooks/refs': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'prettier/prettier': 'error',
        },
    },
    // Test files — relax JSX escaping rules (test assertions contain quotes/apostrophes)
    {
        files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
        languageOptions: {
            parser: typescriptParser,
        },
        rules: {
            'react/no-unescaped-entities': 'off',
        },
    },
];
