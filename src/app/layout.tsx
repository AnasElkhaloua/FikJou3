import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import { clientEnv } from "@/env/client";
import { defaultLocale } from "@/i18n/config";

import "./globals.css";

export const metadata: Metadata = {
  title: clientEnv.appName,
  description: "Foundation for the Fik Jou3? homemade food marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={defaultLocale} className={GeistSans.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="app-frame">
          <header className="site-header">
            <span className="brand" dir="auto">
              {clientEnv.appName}
            </span>
            <span className="phase-badge">Foundation</span>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
