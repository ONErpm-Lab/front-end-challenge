import { beforeEach } from 'vitest';
import { forgetLanguage } from './saved-language';

// Storage outlives a test (unlike the TestBed): every test starts as a visitor with nothing saved.
beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    forgetLanguage();
    localStorage.clear();
  }
});
