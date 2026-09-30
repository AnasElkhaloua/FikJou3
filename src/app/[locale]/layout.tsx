import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { MobileNavigation } from "@/components/shell/mobile-navigation";
import { SiteHeader } from "@/components/shell/site-header";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import { routing } from "@/i18n/routing";

import "../globals.css";

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    description: t("description"),
    metadataBase: new URL(serverEnv.APP_URL),
    openGraph: {
      description: t("description"),
      locale: locale === "fr" ? "fr_MA" : "en_MA",
      siteName: clientEnv.appName,
      title: t("title"),
      type: "website",
    },
    title: {
      default: t("title"),
      template: `%s | ${clientEnv.appName}`,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const t = await getTranslations("Shell");

  return (
    <html lang={locale} className={GeistSans.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <a className="skip-link" href="#main-content">
            {t("skipToContent")}
          </a>
          <div className="app-frame">
            <SiteHeader />
            {children}
            <MobileNavigation />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
