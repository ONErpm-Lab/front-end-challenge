import express from 'express';
import { composeApp } from './compose.js';

/**
 * Entrada da Vercel: ela detecta `src/index.js` e exige que o arquivo importe o express
 * e exporte a aplicação. Localmente a entrada é `server.js` (`npm start`).
 * Na Vercel, `public/` (o build do Angular) é servido pela CDN antes de chegar aqui.
 */
const app = express();
app.disable('x-powered-by');
app.use(composeApp().app);

export default app;
