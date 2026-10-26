import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SafeStorageService } from './safe-storage.service';

function create(platform: 'browser' | 'server' = 'browser'): SafeStorageService {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
  return TestBed.inject(SafeStorageService);
}

describe('SafeStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  describe('in the browser', () => {
    it('reads nothing for a key that was never written', () => {
      expect(create().read('missing')).toBeNull();
    });

    it('reads back what it wrote, in localStorage', () => {
      const storage = create();

      storage.write('key', 'value');

      expect(storage.read('key')).toBe('value');
      expect(localStorage.getItem('key')).toBe('value');
    });

    it('overwrites a previous value', () => {
      const storage = create();
      storage.write('key', 'old');

      storage.write('key', 'new');

      expect(storage.read('key')).toBe('new');
    });

    it('keeps keys apart', () => {
      const storage = create();

      storage.write('a', '1');
      storage.write('b', '2');

      expect([storage.read('a'), storage.read('b')]).toEqual(['1', '2']);
    });

    it('survives storage that throws on read (private mode, blocked cookies)', () => {
      const storage = create();
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });

      expect(storage.read('key')).toBeNull();
    });

    it('survives storage that throws on write (quota exceeded)', () => {
      const storage = create();
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });

      expect(() => storage.write('key', 'value')).not.toThrow();
    });
  });

  describe('on the server', () => {
    it('reads nothing, even if a value exists', () => {
      localStorage.setItem('key', 'value');

      expect(create('server').read('key')).toBeNull();
    });

    it('does not write', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem');

      create('server').write('key', 'value');

      expect(setItem).not.toHaveBeenCalled();
    });
  });
});
