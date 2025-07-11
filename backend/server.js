require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Middleware para permitir requisições de diferentes origens (importante para Angular)
app.use(cors());

// Endpoint para obter o token do Spotify usando Client Credentials
app.get('/spotify-token', async (req, res) => {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Client ID ou Client Secret não configurados no servidor.' });
    }

    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        const data = await response.json();

        if (response.ok) {
            res.json(data);
        } else {
            console.error('Erro do Spotify ao obter token:', data);
            res.status(response.status).json({ error: 'Falha ao obter token do Spotify', details: data });
        }
    } catch (error) {
        console.error('Erro no servidor ao solicitar token do Spotify:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar token.' });
    }
});

app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));