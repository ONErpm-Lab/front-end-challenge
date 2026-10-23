import { withViewTransition } from './view-transition';

describe('withViewTransition', () => {
  const doc = document as unknown as { startViewTransition?: unknown };
  const original = doc.startViewTransition;

  const mockReducedMotion = (reduce: boolean) =>
    vi.stubGlobal('matchMedia', () => ({ matches: reduce }));

  afterEach(() => {
    doc.startViewTransition = original;
    vi.unstubAllGlobals();
  });

  it('usa a View Transition quando o navegador suporta', () => {
    mockReducedMotion(false);
    const start = vi.fn((cb: () => void) => cb());
    doc.startViewTransition = start;
    const update = vi.fn();

    withViewTransition(update);

    expect(start).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
  });

  it('aplica direto quando o usuário prefere movimento reduzido', () => {
    mockReducedMotion(true);
    const start = vi.fn();
    doc.startViewTransition = start;
    const update = vi.fn();

    withViewTransition(update);

    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledOnce();
  });

  it('aplica direto quando não há suporte', () => {
    mockReducedMotion(false);
    doc.startViewTransition = undefined;
    const update = vi.fn();

    withViewTransition(update);

    expect(update).toHaveBeenCalledOnce();
  });
});
