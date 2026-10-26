import { readCookie, serializeCookie } from './language-cookie';

describe('readCookie', () => {
  it('finds a cookie among others', () => {
    expect(readCookie('a=1; orp.language=pt; b=2', 'orp.language')).toBe('pt');
  });

  it.each([[null], [undefined], [''], ['a=1; b=2'], ['xorp.language=pt'], ['orp.language']])(
    'finds nothing in %j',
    (header) => {
      expect(readCookie(header, 'orp.language')).toBeNull();
    },
  );

  it('decodes the value, and ignores one that cannot be decoded', () => {
    expect(readCookie('orp.language=p%74', 'orp.language')).toBe('pt');
    expect(readCookie('orp.language=%E0%A4%A', 'orp.language')).toBeNull();
  });

  it('does not take a cookie of another name that ends the same', () => {
    expect(readCookie('other.orp.language=ru', 'orp.language')).toBeNull();
  });
});

describe('serializeCookie', () => {
  it('is for the whole site, same-site by default and lasting as long as asked', () => {
    expect(serializeCookie('orp.language', 'pt', { maxAgeSeconds: 60, secure: false })).toBe(
      'orp.language=pt; Path=/; Max-Age=60; SameSite=Lax',
    );
  });

  it('is marked Secure over HTTPS', () => {
    expect(serializeCookie('orp.language', 'pt', { maxAgeSeconds: 60, secure: true })).toContain(
      '; Secure',
    );
  });

  it('encodes the value', () => {
    expect(serializeCookie('n', 'a;b', { maxAgeSeconds: 1, secure: false })).toContain('n=a%3Bb;');
  });
});
