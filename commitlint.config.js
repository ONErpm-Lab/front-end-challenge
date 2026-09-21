/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['core', 'shared', 'tracks', 'api', 'config', 'deps', 'docs', 'test', 'ci'],
    ],
  },
};
