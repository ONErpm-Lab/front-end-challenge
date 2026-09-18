// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  globalIgnores(['dist/**', 'coverage/**', '.angular/**', '.wrangler/**', 'node_modules/**']),

  // Angular application code (browser runtime).
  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'onerpm', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'onerpm', style: 'kebab-case' },
      ],
      // Layering rule: features -> shared -> core, one direction only.
      // `core` must never reach into a feature, and nothing may deep-import across layers.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/*/**'],
              message:
                'Do not deep-import across features. Go through the feature barrel or move the code to shared/.',
            },
          ],
        },
      ],
    },
  },

  // `core` is the innermost layer: it may not depend on features.
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**'],
              message: 'core/ must not depend on features/. Dependencies point inward only.',
            },
          ],
        },
      ],
    },
  },

  // `shared` is domain-agnostic: no feature and no core-service knowledge.
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**'],
              message: 'shared/ must stay domain-agnostic. Move domain code into a feature.',
            },
          ],
        },
      ],
    },
  },

  // Angular templates.
  {
    files: ['src/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },

  // Cloudflare Pages Functions (Workers runtime: Web standards only, no Node built-ins).
  // Their specs live in tests/ so Pages never routes or bundles them.
  {
    files: ['functions/**/*.ts', 'tests/functions/**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'process', message: 'Workers runtime has no `process`. Read config from `env`.' },
        { name: '__dirname', message: 'Workers runtime has no Node built-ins.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', '@angular/*', '**/src/*'],
              message:
                'Workers code must not import Node built-ins or Angular application code. Share plain types only.',
            },
          ],
        },
      ],
    },
  },

  // Must stay last: turns off every rule that fights Prettier.
  prettier,
]);
