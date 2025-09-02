import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSelectorComponent } from './language-selector.component';
import { I18nService, SupportedLanguage } from '../../services/i18n.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let i18nService: jasmine.SpyObj<I18nService>;

  const mockSupportedLanguages: SupportedLanguage[] = ['pt', 'en', 'es'];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('I18nService', [
      'getSupportedLanguages',
      'changeLanguage',
      'getLanguageInfo',
      'currentLanguage',
    ]);

    spy.getSupportedLanguages.and.returnValue(mockSupportedLanguages);
    spy.currentLanguage.and.returnValue('pt');
    spy.changeLanguage.and.returnValue({
      subscribe: (callbacks: any) => {
        callbacks.next();
        return { unsubscribe: () => {} };
      },
    } as any);

    await TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent, HttpClientTestingModule],
      providers: [{ provide: I18nService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    i18nService = TestBed.inject(I18nService) as jasmine.SpyObj<I18nService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with supported languages', () => {
    expect(component.supportedLanguages).toEqual(mockSupportedLanguages);
    expect(i18nService.getSupportedLanguages).toHaveBeenCalled();
  });

  it('should initialize with dropdown closed', () => {
    expect(component.isOpen()).toBe(false);
  });

  describe('toggleDropdown', () => {
    it('should toggle dropdown state from closed to open', () => {
      expect(component.isOpen()).toBe(false);

      component.toggleDropdown();

      expect(component.isOpen()).toBe(true);
    });

    it('should toggle dropdown state from open to closed', () => {
      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);

      component.toggleDropdown();

      expect(component.isOpen()).toBe(false);
    });
  });

  describe('closeDropdown', () => {
    it('should close dropdown when open', () => {
      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);

      component.closeDropdown();

      expect(component.isOpen()).toBe(false);
    });

    it('should keep dropdown closed when already closed', () => {
      expect(component.isOpen()).toBe(false);

      component.closeDropdown();

      expect(component.isOpen()).toBe(false);
    });
  });

  describe('selectLanguage', () => {
    it('should call i18nService.changeLanguage and close dropdown', () => {
      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);

      component.selectLanguage('en');

      expect(i18nService.changeLanguage).toHaveBeenCalledWith('en');
      expect(component.isOpen()).toBe(false);
    });

    it('should handle error and close dropdown', () => {
      i18nService.changeLanguage.and.returnValue({
        subscribe: (callbacks: any) => {
          callbacks.error(new Error('Network error'));
          return { unsubscribe: () => {} };
        },
      } as any);

      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);

      component.selectLanguage('en');

      expect(component.isOpen()).toBe(false);
    });
  });

  describe('getCurrentLanguageInfo', () => {
    it('should return current language info', () => {
      const mockInfo = { code: 'pt' as SupportedLanguage, name: 'Português', flag: '🇧🇷' };
      i18nService.getLanguageInfo.and.returnValue(mockInfo);

      const result = component.getCurrentLanguageInfo();

      expect(i18nService.getLanguageInfo).toHaveBeenCalledWith('pt');
      expect(result).toEqual(mockInfo);
    });
  });

  describe('getLanguageInfo', () => {
    it('should return language info for specific language', () => {
      const mockInfo = { code: 'en' as SupportedLanguage, name: 'English', flag: '🇺🇸' };
      i18nService.getLanguageInfo.and.returnValue(mockInfo);

      const result = component.getLanguageInfo('en');

      expect(i18nService.getLanguageInfo).toHaveBeenCalledWith('en');
      expect(result).toEqual(mockInfo);
    });
  });

  describe('isCurrentLanguage', () => {
    it('should return true for current language', () => {
      const result = component.isCurrentLanguage('pt');

      expect(i18nService.currentLanguage).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for different language', () => {
      const result = component.isCurrentLanguage('en');

      expect(result).toBe(false);
    });
  });

  describe('onClickOutside', () => {
    it('should close dropdown when clicking outside', () => {
      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);

      const mockEvent = {
        target: document.createElement('div'),
      } as any;

      component.onClickOutside(mockEvent);

      expect(component.isOpen()).toBe(false);
    });

    it('should not close dropdown when clicking inside', () => {
      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);

      const mockEvent = {
        target: {
          closest: (selector: string) => {
            if (selector === '.language-selector') {
              return document.createElement('div');
            }
            return null;
          },
        },
      } as any;

      component.onClickOutside(mockEvent);

      expect(component.isOpen()).toBe(true);
    });

    it('should not close dropdown when already closed', () => {
      expect(component.isOpen()).toBe(false);

      const mockEvent = {
        target: document.createElement('div'),
      } as any;

      component.onClickOutside(mockEvent);

      expect(component.isOpen()).toBe(false);
    });
  });
});
