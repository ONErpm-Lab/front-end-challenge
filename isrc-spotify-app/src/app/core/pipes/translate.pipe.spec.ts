import { TestBed } from '@angular/core/testing';
import { TranslatePipe } from './translate.pipe';
import { I18nService } from '../services/i18n.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let i18nService: jasmine.SpyObj<I18nService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('I18nService', ['instant']);

    TestBed.configureTestingModule({
      providers: [TranslatePipe, { provide: I18nService, useValue: spy }],
    });

    pipe = TestBed.inject(TranslatePipe);
    i18nService = TestBed.inject(I18nService) as jasmine.SpyObj<I18nService>;
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null/undefined key', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should call i18nService.instant with key', () => {
    const key = 'common.welcome';
    i18nService.instant.and.returnValue('Bem-vindo');

    const result = pipe.transform(key);

    expect(i18nService.instant).toHaveBeenCalledWith(key, undefined);
    expect(result).toBe('Bem-vindo');
  });

  it('should call i18nService.instant with key and params', () => {
    const key = 'common.hello';
    const params = { name: 'João' };
    i18nService.instant.and.returnValue('Olá João');

    const result = pipe.transform(key, params);

    expect(i18nService.instant).toHaveBeenCalledWith(key, params);
    expect(result).toBe('Olá João');
  });

  it('should handle translation with parameters', () => {
    const key = 'common.greeting';
    const params = { user: 'Maria', time: 'manhã' };
    i18nService.instant.and.returnValue('Bom dia Maria!');

    const result = pipe.transform(key, params);

    expect(i18nService.instant).toHaveBeenCalledWith(key, params);
    expect(result).toBe('Bom dia Maria!');
  });
});
