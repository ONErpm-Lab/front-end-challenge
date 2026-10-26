import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { i18nTestProviders, useLanguage } from '../testing/i18n-testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), ...i18nTestProviders],
    });
  });

  it('has a skip link to the main content, then the header, the content and the footer', async () => {
    await useLanguage();
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const skip = root.querySelector('a.skip') as HTMLAnchorElement;
    expect(skip.getAttribute('href')).toBe('#content');
    expect(skip.textContent?.trim()).toBe('Skip to content');
    expect(root.querySelector('main#content')).not.toBeNull();
    expect(root.querySelector('header')).not.toBeNull();
    expect(root.querySelector('footer')).not.toBeNull();
  });
});
