import { TestBed } from '@angular/core/testing';

import { AccessToken } from 'spotify-types';
import { accessTokenMock } from '../../tests/mocks/access-token.mock';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null when no token is set', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should set and return token', () => {
    service.setToken(accessTokenMock);
    expect(service.getToken()).toEqual(accessTokenMock);
  });

  it('should remove token after expiration', (done) => {
    const token: AccessToken = { ...accessTokenMock, expires_in: 0.2 };

    service.setToken(token);

    setTimeout(() => {
      expect(service.getToken()).toBeNull();
      done();
    }, 200);
  });

  it('should update token', () => {
    const token1: AccessToken = {
      ...accessTokenMock,
      access_token: 'token1',
    };

    const token2: AccessToken = {
      ...accessTokenMock,
      access_token: 'token2',
    };

    service.setToken(token1);
    service.setToken(token2);

    expect(service.getToken()).toEqual(token2);
  });
});
