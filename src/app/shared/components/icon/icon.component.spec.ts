import { TestBed } from '@angular/core/testing';
import { ICON_PATHS } from './icon.constants';
import { IconComponent } from './icon.component';

async function render(inputs: { name: 'check' | 'globe'; size?: number; strokeWidth?: number }) {
  const fixture = TestBed.createComponent(IconComponent);
  fixture.componentRef.setInput('name', inputs.name);
  if (inputs.size !== undefined) {
    fixture.componentRef.setInput('size', inputs.size);
  }
  if (inputs.strokeWidth !== undefined) {
    fixture.componentRef.setInput('strokeWidth', inputs.strokeWidth);
  }
  await fixture.whenStable();
  return (fixture.nativeElement as HTMLElement).querySelector('svg') as SVGElement;
}

describe('IconComponent', () => {
  it('draws the paths of the named icon, at 16px with a 2px stroke by default', async () => {
    const svg = await render({ name: 'globe' });

    expect([...svg.querySelectorAll('path')].map((path) => path.getAttribute('d'))).toEqual(
      ICON_PATHS.globe,
    );
    expect(svg.getAttribute('width')).toBe('16');
    expect(svg.getAttribute('stroke-width')).toBe('2');
  });

  it('takes another size and stroke', async () => {
    const svg = await render({ name: 'check', size: 24, strokeWidth: 3 });

    expect(svg.getAttribute('height')).toBe('24');
    expect(svg.getAttribute('stroke-width')).toBe('3');
  });

  it('is decorative: hidden from assistive technology and out of the tab order', async () => {
    const svg = await render({ name: 'check' });

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
  });
});
