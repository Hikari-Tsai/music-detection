import { normalizeLanguage, translate, detectBrowserLanguage, languages } from './i18n-core.js';
const browserLanguage = () => detectBrowserLanguage(navigator.language || navigator.languages?.[0]);
let language = browserLanguage();
let manualLanguage = null;
try {
  const saved = localStorage.getItem('tempo-language');
  if (languages.includes(saved)) language = manualLanguage = saved;
} catch {
  /* Storage is optional. */
}
const bindings = new Map();
export const t = (key, args) => translate({ key, args }, language);

export function setText(element, source, attribute = null) {
  if (typeof element === 'string') element = document.getElementById(element);
  let fields = bindings.get(element);
  if (!fields) bindings.set(element, (fields = new Map()));
  fields.set(attribute, source);
  const text = translate(source, language);
  if (attribute) element.setAttribute(attribute, text);
  else element.textContent = text;
}
function renderLanguage() {
  document.documentElement.lang = language;
  document.getElementById('language-select').value = language;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const attribute of ['aria-label', 'content']) {
    for (const element of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
      element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
    }
  }
  for (const [element, fields] of bindings) {
    for (const [attribute, source] of fields) setText(element, source, attribute);
  }
}
export function setLanguage(value) {
  language = manualLanguage = normalizeLanguage(value);
  try {
    localStorage.setItem('tempo-language', language);
  } catch {
    /* Switching still works. */
  }
  renderLanguage();
}
document
  .getElementById('language-select')
  .addEventListener('change', (event) => setLanguage(event.target.value));
window.addEventListener('languagechange', () => {
  if (manualLanguage) return;
  language = browserLanguage();
  renderLanguage();
});
renderLanguage();
