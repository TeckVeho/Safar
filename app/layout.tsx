import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Noto_Sans, Noto_Sans_JP, Sora, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { LOCALE_COOKIE } from "@/lib/i18n/types";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-noto",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-jp",
});

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Safar",
  description:
    "トラックで日本を走る中央アジアのムスリムドライバー向け。荷物チェック、ハラル判定、現場の言葉。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Safar",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a3b36",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = await getDictionary();
  const cookieStore = await cookies();
  const shouldRedirectToOnboarding = !cookieStore.has(LOCALE_COOKIE);

  return (
    <html lang={locale}>
      <body
        className={`${notoSans.variable} ${notoSansJp.variable} ${zenKaku.variable} ${sora.variable} antialiased`}
      >
        <AppShell
          locale={locale}
          splashTagline={dict.splash.tagline}
          walkthroughLabels={dict.walkthrough}
          shouldRedirectToOnboarding={shouldRedirectToOnboarding}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
