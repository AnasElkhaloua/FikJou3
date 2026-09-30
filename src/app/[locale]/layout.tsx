import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { clientEnv } from "@/env/client";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { routing } from "@/i18n/routing";
import { SignOutButton } from "@/modules/auth/sign-out-button";

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
  return { description: t("description"), title: t("title") };
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
            <header className="site-header">
              <span className="brand" dir="auto">
                {clientEnv.appName}
              </span>
              <div className="header-actions">
                <Suspense fallback={null}>
                  <LanguageSwitcher />
                </Suspense>
                <SignOutButton />
                <span className="phase-badge">{t("phase")}</span>
              </div>
            </header>
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
