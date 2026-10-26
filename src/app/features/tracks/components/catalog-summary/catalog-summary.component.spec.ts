import { TestBed } from '@angular/core/testing';
import { i18nTestProviders, useLanguage } from '../../../../../testing/i18n-testing';
import { CatalogSummary } from '../../domain/domain.interfaces';
import { text } from '../../testing/render-with-tracks';
import { CatalogSummaryComponent } from './catalog-summary.component';

const SUMMARY: CatalogSummary = {
  total: 10,
  found: 9,
  availableInBR: 8,
  unavailableInBR: 1,
  notFound: 1,
  failed: 0,
  totalDurationMs: 1_944_106,
  releasesByYear: [
    { year: 2013, count: 1 },
    { year: 2014, count: 2 },
  ],
};

async function render(summary: CatalogSummary, loading = false) {
  TestBed.configureTestingModule({ providers: [...i18nTestProviders] });
  await useLanguage();
  const fixture = TestBed.createComponent(CatalogSummaryComponent);
  fixture.componentRef.setInput('summary', summary);
  fixture.componentRef.setInput('loading', loading);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('CatalogSummaryComponent', () => {
  it('shows the counts, the share found and the total duration', async () => {
    const root = await render(SUMMARY);

    expect([...root.querySelectorAll('.kpi__value')].map((value) => text(value))).toEqual([
      '10',
      '9',
      '8',
      '32:24',
    ]);
    expect(text(root)).toContain('90% of the ISRCs');
    expect(text(root)).toContain('sum of 9 tracks');
  });

  it('lists the releases per year, read out as "year: count"', async () => {
    const root = await render(SUMMARY);

    const bars = [...root.querySelectorAll('ol.bars li')];
    expect(bars.map((bar) => text(bar.querySelector('.visually-hidden')))).toEqual([
      '2013: 1',
      '2014: 2',
    ]);
    expect((bars[1].querySelector('.bar__fill') as HTMLElement).style.height).toBe('3.5rem');
  });

  it('shows 0% when nothing was looked up', async () => {
    const root = await render({ ...SUMMARY, total: 0, found: 0, releasesByYear: [] });

    expect(text(root)).toContain('0% of the ISRCs');
  });

  it('shows placeholders, marked busy, while loading', async () => {
    const root = await render(SUMMARY, true);

    expect(root.querySelector('section')?.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.kpi__value')).toBeNull();
    expect(root.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });
});
