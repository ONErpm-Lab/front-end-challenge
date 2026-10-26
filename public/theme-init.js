// Runs before the first paint (a file, not inline, so the CSP needs no hash): applies the saved theme, or
// the system one, so the page never flashes the wrong colors. Keep the key and values in sync with `Theme`.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('orp.theme');
  } catch (e) {}
  if (theme !== 'dark' && theme !== 'light') {
    theme =
      window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
