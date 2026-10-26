import { Environment } from './environment.interfaces';

/**
 * Production build. The Spotify credentials are NOT kept in Git: the deploy pipeline writes them here before
 * `ng build` (see README, "Credenciais do Spotify"). Empty values make the page show "music data unavailable".
 */
export const environment: Environment = {
  production: true,
  spotify: {
    clientId: '',
    clientSecret: '',
  },
};
