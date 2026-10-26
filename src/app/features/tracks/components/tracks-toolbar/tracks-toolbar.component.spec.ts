import { errorResult, foundResult, notFoundResult } from '../../testing/builders';
import { renderWithTracks, settle, text } from '../../testing/render-with-tracks';
import { SortDirection, StatusFilter } from '../../domain/domain.enums';
import { TracksToolbarComponent } from './tracks-toolbar.component';

const RESULTS = [
  foundResult('Louca'),
  foundResult('Repente', { isrc: 'BRC310600002', availableInBR: false }),
  notFoundResult('QZNJX2081700'),
  errorResult('BXKZM1900338'),
];

async function render() {
  const page = await renderWithTracks(TracksToolbarComponent, RESULTS);
  const input = page.root.querySelector('input[type="search"]') as HTMLInputElement;
  const chips = () => [...page.root.querySelectorAll<HTMLButtonElement>('.chip')];
  return { ...page, input, chips };
}

describe('TracksToolbarComponent', () => {
  it('has a labeled search field that filters the store as the visitor types', async () => {
    const { root, input, store } = await render();

    expect(root.querySelector(`label[for="${input.id}"]`)?.textContent).toContain(
      'Filter by track, artist or ISRC',
    );
    input.value = 'lou';
    input.dispatchEvent(new Event('input'));

    expect(store.query()).toBe('lou');
  });

  it('clears the text with a button that appears only when there is text, and refocuses the field', async () => {
    const { fixture, root, input, store } = await render();
    expect(root.querySelector('.search__clear')).toBeNull();

    store.setQuery('lou');
    await settle(fixture);
    (root.querySelector('.search__clear') as HTMLButtonElement).click();

    expect(store.query()).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('has a status chip per situation, with its count, in a named group', async () => {
    const { root, chips } = await render();

    expect(root.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Filter by status',
    );
    expect(chips().map((chip) => text(chip))).toEqual([
      'All 4',
      'Available in BR 1',
      'Unavailable in BR 1',
      'Not found 1',
    ]);
  });

  it('marks the chosen chip as pressed and filters the store', async () => {
    const { fixture, chips, store } = await render();

    chips()[2].click();
    await settle(fixture);

    expect(store.statusFilter()).toBe(StatusFilter.UNAVAILABLE_BR);
    expect(chips().map((chip) => chip.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
    ]);
  });

  it('reverses the order by title, and says the current one', async () => {
    const { fixture, root, store } = await render();
    const sort = root.querySelector('.sort') as HTMLButtonElement;
    expect(text(sort)).toContain('Sorted by title, A to Z');

    sort.click();
    await settle(fixture);

    expect(store.direction()).toBe(SortDirection.DESC);
    expect(text(sort)).toContain('Title Z–A');
  });
});
