import "server-only";

const dictionaries = {
  it: () => import("./dictionaries/it.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export type Locale = keyof typeof dictionaries;

export const LOCALES = Object.keys(dictionaries) as Locale[];
export const DEFAULT_LOCALE: Locale = "it";

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["it"]>>;

export const getDictionary = (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
