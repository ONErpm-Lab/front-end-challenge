import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { SpotifyAuthService } from './spotify-auth.service';
import { environment } from '../../../environments/environment';

describe('SpotifyAuthService', () => {
  let service: SpotifyAuthService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);

    const initialMockAuthResponse = { access_token: 'initial-dummy-token', expires_in: 3600 };
    httpClientSpy.get.and.returnValue(of(initialMockAuthResponse));

    service = new SpotifyAuthService(httpClientSpy);

    if ((service as any).tokenExpirationTimer) {
      clearTimeout((service as any).tokenExpirationTimer);
    }
  });

  afterEach(() => {
    if ((service as any).tokenExpirationTimer) {
      clearTimeout((service as any).tokenExpirationTimer);
    }
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
    expect(httpClientSpy.get).toHaveBeenCalledWith(environment.backendAuthUrl);
  });
});