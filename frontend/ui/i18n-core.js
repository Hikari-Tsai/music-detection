import { messages } from './messages.js';
export const languages = ['en', 'ja', 'zh-Hant'];
export const normalizeLanguage = (language) => (languages.includes(language) ? language : 'en');
export function detectBrowserLanguage(value) {
  try {
    const locale = new Intl.Locale(value);
    if (locale.language === 'ja') return 'ja';
    if (
      locale.language === 'zh' &&
      (locale.script === 'Hant' || (!locale.script && ['TW', 'HK', 'MO'].includes(locale.region)))
    )
      return 'zh-Hant';
  } catch {
    // Missing or invalid browser language falls back to English.
  }
  return 'en';
}
const sourceKeys = new Map(
  Object.entries(messages).map(([key, values]) => [values['zh-Hant'], key])
);

// Message descriptors can cross the Worker boundary without fixing a language.
// Arrays compose independently translated pieces without injecting HTML.
export function translate(source, language = 'en') {
  language = normalizeLanguage(language);
  if (Array.isArray(source)) return source.map((part) => translate(part, language)).join('');
  if (source == null) return '';
  if (typeof source === 'object') {
    const template = messages[source.key]?.[language] ?? messages[source.key]?.en;
    if (template == null) throw new Error(`Unknown translation key: ${source.key}`);
    return template.replace(/\{(\w+)\}/g, (_, key) => String(source.args?.[key] ?? `{${key}}`));
  }
  const key = sourceKeys.get(String(source));
  return key ? messages[key][language] : String(source);
}
