import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SettingsClient } from "@/components/settings-client";
import { getDictionary, getLocale } from "@/lib/i18n/server";
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

  redirect("/settings");
}

export default async function SettingsPage() {
  const dict = await getDictionary();
  const locale = await getLocale();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        backLabel={dict.common.back}
        eyebrow={dict.settings.eyebrow}
        title={dict.home.settings}
        description={dict.settings.description}
        icon="settings"
      />

      <SettingsClient
        labels={dict.settings}
        currentLocale={locale as Locale}
        setLocaleAction={setLocale}
      />
    </div>
  );
}
