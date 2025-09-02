import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export const httpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  console.log('🔗 HTTP Interceptor: Interceptando requisição para:', req.url);

  // Não intercepta requisições para o token - permite que erros de credenciais cheguem ao guard
  if (req.url === environment.SPOTIFY_TOKEN_URL) {
    console.log('🔗 HTTP Interceptor: Requisição para token, não interceptando');
    return next(req);
  }

  // Não intercepta requisições para arquivos i18n
  if (req.url.includes('/assets/i18n/')) {
    console.log('🔗 HTTP Interceptor: Requisição para arquivo i18n, não interceptando');
    return next(req);
  }

  // Adiciona token para requisições da API do Spotify
  if (req.url.includes('api.spotify.com')) {
    const token = sessionStorage.getItem('spotifyToken');
    console.log('🔗 HTTP Interceptor: Requisição para API Spotify, token encontrado:', !!token);

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      console.log('🔗 HTTP Interceptor: Adicionando header Authorization');
      return next(authReq);
    } else {
      console.warn(
        '⚠️ HTTP Interceptor: Requisição para API Spotify sem token. Permitindo que o erro chegue ao componente.'
      );
      // Não tenta obter token automaticamente - deixa o erro chegar ao componente
      return next(req);
    }
  }

  return next(req);
};
