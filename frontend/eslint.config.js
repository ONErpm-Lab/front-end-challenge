// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/**
 * Fronteiras da arquitetura verificadas no lint: um import proibido quebra `npm run lint`.
 *
 *   pages / components ──▶ store ──▶ services ──▶ models / utils
 *   shared          ✕ não conhece features
 *   models / utils  ✕ não conhecem Angular nem RxJS (lógica pura)
 */

const rule = (regex, message) => ({ regex, message });

const RULES = {
  onlyStore: rule(
    String.raw`(^|/)[\w-]+-api\.service$|^@angular/common/http$`,
    'Componentes acessam dados só pelo store da feature (features/<feature>/store).',
  ),
  // DIP: quem consome o store injeta a porta (ports/tracks-store.port), nunca a implementação.
  noStoreImpl: rule(
    String.raw`/store/`,
    'Injete a porta do store (ports/); a implementação só é ligada em <feature>.providers.ts.',
  ),
  // DIP: o store depende da porta de dados (ports/), nunca do serviço HTTP concreto.
  noApiImpl: rule(
    String.raw`(^|/)[\w-]+-api\.service$|^@angular/common/http$`,
    'O store depende da porta de dados (ports/), não do serviço HTTP.',
  ),
  noPresentation: rule(
    String.raw`/(components|pages)/`,
    'Esta camada não pode depender de componentes.',
  ),
  noState: rule(String.raw`/store/`, 'Serviços só fazem requisições; não conhecem o store.'),
  pure: rule(String.raw`^(@angular/|rxjs)`, 'models/utils devem ser lógica pura, sem framework.'),
  noFeatures: rule(String.raw`^@features/|/features/`, 'shared não pode depender de features.'),
  useAlias: rule(
    String.raw`^(\.\./){3,}`,
    'Use os aliases @shared/@features/@testing para sair da feature.',
  ),
};

// No flat config, a mesma regra em dois blocos não se soma: o último vence.
// Por isso cada camada declara a lista completa de padrões que se aplicam a ela.
// Testes ficam fora: precisam montar o cenário (ex.: provideHttpClient) para provar o comportamento.
const boundary = (files, ...patterns) => ({
  files,
  ignores: ['**/*.spec.ts'],
  rules: { 'no-restricted-imports': ['error', { patterns }] },
});

const feature = (layer) => `src/app/features/*/${layer}/**/*.ts`;

module.exports = defineConfig([
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.angular/**', '**/coverage/**'] },
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
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },

  // Fronteiras
  boundary(['src/app/features/**/*.ts'], RULES.useAlias),
  boundary(
    [feature('pages'), feature('components')],
    RULES.onlyStore,
    RULES.noStoreImpl,
    RULES.useAlias,
  ),
  boundary([feature('store')], RULES.noPresentation, RULES.noApiImpl, RULES.useAlias),
  // Portas: só contratos (tipos + InjectionToken); não conhecem nenhuma implementação.
  boundary(
    [feature('ports')],
    RULES.noPresentation,
    RULES.noState,
    RULES.noApiImpl,
    RULES.useAlias,
  ),
  boundary([feature('services')], RULES.noState, RULES.noPresentation, RULES.useAlias),
  boundary([feature('models'), feature('utils')], RULES.pure, RULES.noPresentation, RULES.useAlias),
  boundary(['src/app/shared/**/*.ts'], RULES.noFeatures),
  boundary(
    ['src/app/shared/utils/**/*.ts', 'src/app/shared/models/**/*.ts'],
    RULES.noFeatures,
    RULES.pure,
  ),
]);
