import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The tab identity (title and icon) lives in static files that no component renders, so these tests
 * read them directly: the icon must be the very mark shown in the header.
 */
const root = process.cwd();
const read = (...path: string[]) => readFileSync(join(root, ...path), 'utf8');

const indexHtml = read('src', 'index.html');
const favicon = read('public', 'favicon.svg');
const headerMark = read('src', 'app', 'layout', 'app-header', 'app-header.html');

/** The geometry of every `<rect>` of an SVG, as comparable strings. */
const bars = (svg: string): string[] =>
  [...svg.matchAll(/<rect\b([^>]*)\/>/g)].map(([, attributes]) =>
    [...attributes.matchAll(/\b(x|y|width|height|rx)="([^"]+)"/g)]
      .map(([, name, value]) => `${name}=${value}`)
      .sort()
      .join(' '),
  );

describe('tab identity', () => {
  describe('title', () => {
    it('is the product name, not the page heading, before any language is applied', () => {
      expect(indexHtml).toContain('<title>ISRC lookup</title>');
    });
  });

  describe('icon', () => {
    it('draws the same four bars as the logo in the header', () => {
      expect(bars(favicon)).toHaveLength(4);
      expect(bars(favicon)).toEqual(bars(headerMark));
    });

    it('is an SVG with a viewBox, so it stays sharp at any size', () => {
      expect(favicon).toMatch(/<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      expect(favicon).toContain('viewBox="0 0 24 24"');
    });

    it('is declared in index.html together with the ICO and the touch icon fallbacks', () => {
      expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="favicon.svg" />');
      expect(indexHtml).toContain('<link rel="icon" sizes="32x32" href="favicon.ico" />');
      expect(indexHtml).toContain('<link rel="apple-touch-icon" href="apple-touch-icon.png" />');
    });

    it.each(['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'])(
      'ships the file %s that index.html points to',
      (file) => {
        expect(existsSync(join(root, 'public', file))).toBe(true);
      },
    );

    it('has a real ICO (one 32x32 image) and a real 180x180 PNG for the touch icon', () => {
      const ico = readFileSync(join(root, 'public', 'favicon.ico'));
      const png = readFileSync(join(root, 'public', 'apple-touch-icon.png'));

      expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 1]);
      expect([ico[6], ico[7]]).toEqual([32, 32]);
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180]);
    });
  });
});
