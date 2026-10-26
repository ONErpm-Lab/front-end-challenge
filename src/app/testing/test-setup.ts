import { beforeEach } from 'vitest';
import { forgetLanguage } from './saved-language';

// A cookie outlives a test (unlike the TestBed): every test starts as a visitor with no saved language.
beforeEach(() => {
  if (typeof document !== 'undefined') {
    forgetLanguage();
  }
});
