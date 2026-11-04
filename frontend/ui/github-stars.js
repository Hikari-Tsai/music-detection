import { t } from './i18n.js';

let starCount = null;

function renderStars() {
  const badge = document.getElementById('star-count');
  const button = document.getElementById('star-btn');
  if (starCount == null || !badge || !button) return;
  const n = new Intl.NumberFormat(document.documentElement.lang || 'en').format(starCount);
  badge.textContent = n;
  badge.hidden = starCount === 0;
  button.setAttribute('aria-label', t('githubStarCountAria', { n }));
}

// One unauthenticated request per page load. Failure leaves the plain link usable.
export async function loadStars() {
  try {
    const button = document.getElementById('star-btn');
    if (!button) return;
    const repository = new URL(button.href).pathname;
    const response = await fetch(`https://api.github.com/repos${repository}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return;
    const count = (await response.json()).stargazers_count;
    if (!Number.isSafeInteger(count) || count < 0) return;
    starCount = count;
    renderStars();
  } catch {
    // Offline, rate limited, timed out, or malformed response: keep the plain button.
  }
}

window.addEventListener('app-languagechange', renderStars);
