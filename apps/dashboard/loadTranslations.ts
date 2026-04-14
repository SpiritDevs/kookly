const localTranslationsEnabled =
  globalThis.process?.env.GT_LOCAL_TRANSLATIONS_ENABLED === "true";

export default async function loadTranslations(locale: string) {
  if (!localTranslationsEnabled) {
    return {};
  }

  const translations = await import(`./public/_gt/${locale}.json`);
  return translations.default;
}
