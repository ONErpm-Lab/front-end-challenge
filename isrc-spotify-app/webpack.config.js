const webpack = require('webpack');
const dotenv = require('dotenv');

// Carrega variáveis do arquivo .env
const env = dotenv.config().parsed;

// Converte as variáveis em formato de define para o webpack
const envKeys = Object.keys(env || {}).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
  plugins: [
    new webpack.DefinePlugin(envKeys)
  ]
};
