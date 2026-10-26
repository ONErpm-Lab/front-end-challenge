import { Environment } from './environment.interfaces';

/** Production build for the end-to-end tests: fake credentials, Spotify itself is played by the tests. */
export const environment: Environment = {
  production: true,
  spotify: {
    clientId: 'e2e-client-id',
    clientSecret: 'e2e-client-secret',
  },
};
