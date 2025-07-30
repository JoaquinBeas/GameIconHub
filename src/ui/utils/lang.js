// lang.js

let translations = {};
let currentLang = 'es_ES'; // o 'en_EN'

export async function loadLanguage(lang = 'es_ES') {
  currentLang = lang;

  const res = await fetch(`./assets/languages/${lang}.json`);
  translations = await res.json();
}

export function t(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], translations) || `[${path}]`;
}
