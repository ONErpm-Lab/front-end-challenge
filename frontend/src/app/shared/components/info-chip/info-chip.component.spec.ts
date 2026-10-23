import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InfoChipComponent } from './info-chip.component';

@Component({
  imports: [InfoChipComponent],
  template: `<app-info-chip label="Demonstração" heading="Dados de demonstração" tone="warn"
      >Explicação</app-info-chip
    >
    <p id="fora">fora</p>`,
})
class HostComponent {}

describe('InfoChipComponent', () => {
  async function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const button = el.querySelector('button') as HTMLButtonElement;
    const panel = el.querySelector('[role="note"]') as HTMLElement;
    return { fixture, el, button, panel };
  }

  it('mostra o rótulo e esconde o detalhe até clicar', async () => {
    const { fixture, button, panel } = await setup();

    expect(button.textContent).toContain('Demonstração');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(button.getAttribute('aria-controls')).toBe(panel.id);

    button.click();
    await fixture.whenStable();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(panel.textContent).toContain('Explicação');
  });

  it('fecha com Esc e com clique fora', async () => {
    const { fixture, el, button, panel } = await setup();

    button.click();
    await fixture.whenStable();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);

    button.click();
    await fixture.whenStable();
    (el.querySelector('#fora') as HTMLElement).click();
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);
  });

  it('um segundo clique no próprio chip fecha o detalhe', async () => {
    const { fixture, button, panel } = await setup();

    button.click();
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();

    expect(panel.hidden).toBe(true);
  });
});
