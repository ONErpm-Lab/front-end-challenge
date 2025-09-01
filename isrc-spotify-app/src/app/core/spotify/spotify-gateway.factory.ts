import { Injectable, inject } from '@angular/core';
import { ISpotifyGateway } from './spotify-gateway.interface';
import { MockSpotifyGatewayService } from './mock-spotify-gateway.service';
import { HttpSpotifyGatewayService } from './http-spotify-gateway.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyGatewayFactory {
  private readonly mockGateway = inject(MockSpotifyGatewayService);
  private readonly httpGateway = inject(HttpSpotifyGatewayService);

  /**
   * Retorna o gateway apropriado baseado na configuração do environment
   */
  getGateway(): ISpotifyGateway {
    if (environment.SPOTIFY_MODE === 'token' && environment.SPOTIFY_TOKEN) {
      return this.httpGateway;
    }

    // Por padrão, usa o mock
    return this.mockGateway;
  }

  /**
   * Retorna o gateway mock (para testes)
   */
  getMockGateway(): ISpotifyGateway {
    return this.mockGateway;
  }

  /**
   * Retorna o gateway HTTP (para produção)
   */
  getHttpGateway(): ISpotifyGateway {
    return this.httpGateway;
  }
}
