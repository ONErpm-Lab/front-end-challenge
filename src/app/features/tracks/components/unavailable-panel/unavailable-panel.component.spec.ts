import { TestBed } from '@angular/core/testing';
import { i18nTestProviders, useLanguage } from '../../../../../testing/i18n-testing';
import { UnavailablePanelComponent } from './unavailable-panel.component';

describe('UnavailablePanelComponent', () => {
  it('alerts that the music data is unavailable and asks to try again', async () => {
    TestBed.configureTestingModule({ providers: [...i18nTestProviders] });
    await useLanguage();
    const fixture = TestBed.createComponent(UnavailablePanelComponent);
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const alert = root.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.querySelector('h2')?.textContent?.trim()).toBe('Music data unavailable');
    (root.querySelector('button') as HTMLButtonElement).click();

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
