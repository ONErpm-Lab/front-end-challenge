import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save token to sessionStorage', () => {
    const token = 'test-token';
    service.saveToken(token);
    
    expect(sessionStorage.getItem('token')).toBe(JSON.stringify(token));
  });

  it('should get token from sessionStorage', () => {
    const token = 'test-token';
    sessionStorage.setItem('token', JSON.stringify(token));
    
    const result = service.getToken(token);
    
    expect(result).toBe(JSON.stringify(token));
  });

  it('should return null when token does not exist', () => {
    const result = service.getToken('non-existent-token');
    
    expect(result).toBeNull();
  });

  it('should overwrite existing token when saving new token', () => {
    const firstToken = 'first-token';
    const secondToken = 'second-token';
    
    service.saveToken(firstToken);
    service.saveToken(secondToken);
    
    expect(sessionStorage.getItem('token')).toBe(JSON.stringify(secondToken));
  });
});