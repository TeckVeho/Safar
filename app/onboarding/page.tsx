import Link from "next/link";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { ActionIcon } from "@/components/icons";
import { getDictionary } from "@/lib/i18n/server";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/types";

async function setLocale(formData: FormData) {
  "use server";

  const locale = formData.get("locale");
  if (locale !== "ja" && locale !== "ru") {
    return;
  }

  const { cookies } = await import("next/headers");
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect("/");
}

export default async function OnboardingPage() {
  const dict = await getDictionary();

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center gap-6 px-2">
      <BackButton href="/" label={dict.common.back} />

      <header className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-900 to-teal-950 text-saffron shadow-md">
          <ActionIcon name="language" className="h-9 w-9" />
        </div>
        <p className="font-latin mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-saffron-deep">
          Safar
        </p>
        <h1 className="mt-3 text-2xl">{dict.onboarding.title}</h1>
        <p className="mt-2 text-sm text-sage">{dict.onboarding.subtitle}</p>
      </header>

      <form action={setLocale} className="grid gap-3">
        {(["ru", "ja"] as Locale[]).map((locale) => (
          <button
            key={locale}
            type="submit"
            name="locale"
            value={locale}
            className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-card px-5 py-4 text-left font-bold transition hover:border-saffron hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-2 text-teal-800">
              <ActionIcon name="language" className="h-5 w-5" />
            </span>
            {dict.onboarding.languages[locale]}
          </button>
        ))}
      </form>

      <Link href="/" className="text-center text-sm font-medium text-sage">
        {dict.common.skip}
      </Link>
    </div>
  );
}
