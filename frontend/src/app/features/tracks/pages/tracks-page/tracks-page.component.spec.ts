import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { buildTrack } from '@testing/track.fixture';
import { TRACKS_STORE, type TracksStorePort } from '../../ports/tracks-store.port';
import { CONTRACT_ISRCS } from '../../utils/contract-isrcs';
import { TracksPageComponent } from './tracks-page.component';

/** Integração: página + componentes filhos + serviço HTTP real, só o backend é simulado. */
describe('TracksPageComponent (integração)', () => {
  let fixture: ComponentFixture<TracksPageComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TracksPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(TracksPageComponent);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  const respondAll = (respond: (isrc: string, index: number) => void) =>
    CONTRACT_ISRCS.forEach((isrc, i) => respond(isrc.value, i));

  it('exibe as faixas ordenadas por título com duração mm:ss e selo BR', async () => {
    const titles = ['Zebra', 'Água', 'Bloco'];
    respondAll((isrc, i) => {
      const req = http.expectOne(`/api/tracks/${isrc}`);
      if (i < titles.length)
        req.flush(buildTrack({ isrc, title: titles[i] ?? '', availableInBrazil: i !== 0 }));
      else req.flush({}, { status: 404, statusText: 'Not Found' });
    });
    await fixture.whenStable();

    const rendered = [...el.querySelectorAll('.card__title')].map((h) => h.textContent?.trim());
    expect(rendered).toEqual(['Água', 'Bloco', 'Zebra']);
    expect(el.textContent).toContain('03:35');
    expect(el.textContent).toContain('Indisponível no BR');
    // ISRCs sem resultado viram cartões na própria grade, sem caixa de aviso.
    expect(el.querySelectorAll('app-track-not-found').length).toBe(7);
    expect(el.querySelector('.summary')?.textContent).toMatch(/3\s+de 10 encontradas/);
    expect(el.querySelector('app-alert')).toBeNull();
    // Sem preview_url em nenhuma faixa: a limitação vira chip no resumo, não caixa.
    expect(el.querySelector('.toolbar app-info-chip button')?.textContent).toContain('Sem prévias');
  });

  it('alerta o usuário quando a integração está indisponível e permite tentar de novo', async () => {
    respondAll((isrc) =>
      http.expectOne(`/api/tracks/${isrc}`).flush({}, { status: 503, statusText: 'Unavailable' }),
    );
    await fixture.whenStable();

    const alert = el.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Não foi possível falar com o Spotify');

    (alert?.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(http.match(() => true).filter((r) => !r.cancelled).length).toBe(CONTRACT_ISRCS.length);
  });

  it('com falha parcial, mostra as faixas carregadas e avisa quais não foram consultadas', async () => {
    respondAll((isrc, i) => {
      const req = http.expectOne(`/api/tracks/${isrc}`);
      if (i === 0) req.flush({}, { status: 503, statusText: 'Unavailable' });
      else req.flush(buildTrack({ isrc, title: `Faixa ${i}` }));
    });
    await fixture.whenStable();

    expect(el.querySelectorAll('app-track-card').length).toBe(9);
    expect(el.querySelector('[role="alert"]')).toBeNull();
    const warning = el.querySelector('app-alert[role="status"]');
    expect(warning?.textContent).toContain('Algumas faixas não puderam ser consultadas');
    expect(warning?.textContent).toMatch(/1\s+de 10 ISRCs/);
    expect(el.querySelector('app-track-not-found')?.textContent).toContain(
      'Não foi possível consultar',
    );

    (warning?.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(http.match(() => true).length).toBe(CONTRACT_ISRCS.length);
  });

  it('avisa que os dados são de demonstração quando a API está em modo mock', async () => {
    respondAll((isrc) =>
      http
        .expectOne(`/api/tracks/${isrc}`)
        .flush(buildTrack({ isrc, title: isrc }), { headers: { 'X-Data-Source': 'mock' } }),
    );
    await fixture.whenStable();

    // O modo demonstração vira um chip ao lado do título (detalhe sob demanda), não uma caixa.
    const chip = el.querySelector('app-info-chip button');
    expect(chip?.textContent).toContain('Demonstração');
    expect(chip?.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('app-alert')).toBeNull();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('não mostra o aviso de demonstração com dados reais do Spotify', async () => {
    respondAll((isrc) =>
      http.expectOne(`/api/tracks/${isrc}`).flush(buildTrack({ isrc, title: isrc })),
    );
    await fixture.whenStable();

    expect(el.textContent).not.toContain('Demonstração');
  });
});

/** Estado vazio: a página recebe um store falso pela porta, sem HTTP. */
describe('TracksPageComponent (lista vazia)', () => {
  it('mostra um estado vazio quando não há ISRCs para consultar', async () => {
    const emptyStore: TracksStorePort = {
      isrcs: [],
      status: signal('ready'),
      tracks: signal([]),
      notFound: signal([]),
      failed: signal([]),
      direction: signal('asc'),
      source: signal(null),
      total: signal(0),
      availableInBrazil: signal(0),
      hasNoPreviews: signal(false),
      load: () => undefined,
      toggleDirection: () => undefined,
    };
    TestBed.configureTestingModule({
      imports: [TracksPageComponent],
      providers: [provideZonelessChangeDetection()],
    }).overrideComponent(TracksPageComponent, {
      set: { providers: [{ provide: TRACKS_STORE, useValue: emptyStore }] },
    });
    const fixture = TestBed.createComponent(TracksPageComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.empty-state')?.textContent).toContain('Nenhuma faixa para exibir');
    expect(el.querySelector('.grid')).toBeNull();
    expect(el.querySelector('.toolbar')).toBeNull();
  });
});
