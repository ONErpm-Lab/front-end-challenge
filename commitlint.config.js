/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'bootstrap',
        'ci',
        'deps',
        'docs',
        'bff',
        'tracks',
        'i18n',
        'theme',
        'ui',
        'e2e',
        'docker',
        'release',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
  },
};
