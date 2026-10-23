import { composeApp } from './compose.js';
import { config } from './config.js';

/** Entrada local (`npm start`): sobe o servidor HTTP. */
const { app, source, staticDir } = composeApp();

app.listen(config.port, () => {
  console.log(`API ouvindo em http://localhost:${config.port}`);
  if (staticDir) console.log(`Servindo o frontend de ${staticDir}`);
  if (source.name === 'mock') {
    console.warn(
      `⚠ Modo MOCK: dados de demonstração (cenário: ${config.mock.scenario}). ` +
        'Para o Spotify real, defina SPOTIFY_MODE=live e as credenciais.',
    );
  }
});
