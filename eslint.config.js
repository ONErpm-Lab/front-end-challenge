// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/**
 * Layer rules: a folder only depends on the folders below it, never upwards.
 *
 *   features / layout / shared / core  →  services  →  api  →  models
 *
 * `api/` is the only place that talks to anything outside the app (HTTP, third-party scripts); the rest of the
 * app gets data through `services/`. Inside a feature: pages → components → store → domain.
 */
const RESTRICTED_HTTP = {
  name: '@angular/common/http',
  importNames: ['HttpClient', 'HttpBackend', 'HttpXhrBackend', 'FetchBackend'],
  message: 'Only src/app/api talks to the outside world: go through a service.',
};

/**
 * @param {string[]} layers folders this layer must not import from
 * @param {boolean} [restrictHttp] whether HttpClient is banned here
 * @returns {['error', ...unknown[]]}
 */
const forbid = (layers, restrictHttp = true) => [
  'error',
  {
    paths: restrictHttp ? [RESTRICTED_HTTP] : [],
    patterns: layers.length
      ? [
          {
            group: layers.map((layer) => `**/${layer}/**`),
            message: `This layer must not depend on ${layers.join(', ')}.`,
          },
        ]
      : [],
  },
];

/**
 * @param {string[]} files
 * @param {string[]} layers
 * @param {boolean} [restrictHttp]
 */
const layerRule = (files, layers, restrictHttp = true) => ({
  files,
  ignores: ['**/*.spec.ts', '**/testing/**'],
  rules: { 'no-restricted-imports': forbid(layers, restrictHttp) },
});

const UI = ['features', 'layout', 'shared', 'core'];
const TRACKS_FEATURE = 'src/app/features/tracks';

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
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
        {
          type: 'attribute',
          prefix: 'orp',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'orp',
          style: 'kebab-case',
        },
      ],
      // Classic Angular naming: HeaderComponent in header.component.ts, I18nService in i18n.service.ts.
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/directive-class-suffix': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/testing/**'],
    rules: {
      // Visibility is always explicit; constructors are the only exception (`public` is noise there).
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
      ],
      // Private properties (including constructor parameter properties) start with an underscore.
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['classProperty', 'parameterProperty'],
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
        // Enum members are UPPER_SNAKE_CASE (`LookupStatus.NOT_FOUND`), like the constants.
        { selector: 'enumMember', format: ['UPPER_CASE'] },
      ],
    },
  },
  layerRule(['src/app/models/**/*.ts'], ['api', 'services', ...UI]),
  layerRule(['src/app/api/**/*.ts'], ['services', ...UI], false),
  layerRule(['src/app/services/**/*.ts'], UI),
  layerRule(['src/app/{core,shared,layout}/**/*.ts'], ['api', 'features']),
  // Features use services, never api/ directly. Inside: pages → components → store → domain.
  layerRule([`${TRACKS_FEATURE}/domain/**/*.ts`], ['api', 'store', 'components', 'pages']),
  layerRule([`${TRACKS_FEATURE}/store/**/*.ts`], ['api', 'components', 'pages']),
  layerRule([`${TRACKS_FEATURE}/components/**/*.ts`], ['api', 'pages']),
  layerRule([`${TRACKS_FEATURE}/pages/**/*.ts`], ['api']),
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
