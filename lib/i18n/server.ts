import { cookies } from "next/headers";
import { getDictionaryByLocale } from "./dictionaries";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Dictionary, type Locale } from "./types";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "ja" || value === "ru" ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return getDictionaryByLocale(locale);
}
