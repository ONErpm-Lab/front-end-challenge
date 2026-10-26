import { TestBed } from '@angular/core/testing';
import { i18nTestProviders, useLanguage } from '../../../testing/i18n-testing';
import { SOURCE_CODE_URL } from '../layout.constants';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  it('credits the challenge and the data source, and links to the code in a new tab', async () => {
    TestBed.configureTestingModule({ providers: [...i18nTestProviders] });
    await useLanguage();
    const fixture = TestBed.createComponent(FooterComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('ONErpm front-end technical challenge');
    expect(root.textContent).toContain('Spotify Web API');
    const link = root.querySelector('a') as HTMLAnchorElement;
    expect(link.href).toBe(SOURCE_CODE_URL);
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    expect(link.textContent).toContain('opens in a new tab');
  });
});
