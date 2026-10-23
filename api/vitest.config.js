import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Regra de negócio e contrato de dados: lógica pura, exige 90% por arquivo.
      include: ['src/tracks/brazil-availability.js', 'src/tracks/track.mapper.js', 'src/tracks/track.service.js', 'src/spotify/token.service.js', 'src/mock/**/*.js'],
      thresholds: { perFile: true, statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
