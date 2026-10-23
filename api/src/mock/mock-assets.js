/**
 * Gera os arquivos do modo mock sem depender de nada externo:
 * capas em SVG e prévias de áudio em WAV (uma melodia curta e única por ISRC).
 */

const PALETTES = [
  ['#1db954', '#0b3d2a'], ['#e8115b', '#3d0a1f'], ['#509bf5', '#0d2a4d'], ['#f59b23', '#4a2c05'],
  ['#af2896', '#2e0a28'], ['#27856a', '#0a2a22'], ['#e91429', '#3a0509'], ['#8d67ab', '#251a30'],
  ['#1e3264', '#0a0f20'],
];

/** Hash estável (FNV-1a) para que cada ISRC tenha sempre a mesma capa e melodia. */
export function hash(text) {
  let h = 0x811c9dc5;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 0x01000193) >>> 0;
  return h;
}

const escapeXml = (text) => text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function coverSvg(isrc, title) {
  const h = hash(isrc);
  const [light, dark] = PALETTES[h % PALETTES.length];
  const cx = 60 + (h % 180);
  const cy = 60 + ((h >> 8) % 180);
  const r = 70 + ((h >> 16) % 90);
  const initials = escapeXml(
    title
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase(),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 300 300">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
  <rect width="300" height="300" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity=".12"/>
  <circle cx="${300 - cx}" cy="${300 - cy}" r="${r / 2}" fill="#000" opacity=".18"/>
  <text x="24" y="276" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#fff" opacity=".9">${initials}</text>
</svg>`;
}

const SAMPLE_RATE = 22050;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // pentatônica maior

/** WAV PCM 16-bit mono: arpejo de 8 segundos com envelope suave, derivado do ISRC. */
export function previewWav(isrc, seconds = 8) {
  const h = hash(isrc);
  const root = 196 * 2 ** ((h % 7) / 12);
  const noteLength = 0.25;
  const samples = Math.floor(seconds * SAMPLE_RATE);
  const buffer = Buffer.alloc(44 + samples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);

  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    const step = Math.floor(t / noteLength);
    const degree = SCALE[(step * 3 + (h >> (step % 24))) % SCALE.length];
    const freq = root * 2 ** (degree / 12);
    const local = (t % noteLength) / noteLength;
    const envelope = Math.min(1, local * 20) * (1 - local) ** 1.5;
    const fade = Math.min(1, t / 0.3, (seconds - t) / 0.8);
    const sample = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t)) * envelope * fade * 0.35;
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return buffer;
}
