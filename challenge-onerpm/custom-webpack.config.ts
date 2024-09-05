import { EnvironmentPlugin } from 'webpack';
import { config } from 'dotenv';

config();

module.exports = {
  plugins: [
    new EnvironmentPlugin([
      'API_DEV_CLIENT_ID',
      'API_DEV_CLIENT_SECRET',
    ])
  ]
}