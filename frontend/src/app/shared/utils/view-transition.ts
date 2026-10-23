/**
 * Executa a mudança de estado dentro de uma View Transition quando o navegador suporta
 * e o usuário não pediu movimento reduzido. Caso contrário, aplica a mudança direto.
 */
export function withViewTransition(update: () => void): void {
  const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (typeof document === 'undefined' || !document.startViewTransition || reduceMotion) {
    update();
    return;
  }
  document.startViewTransition(update);
}
