import { Suspense } from "react";

import { LanguageSwitcher } from "@/i18n/language-switcher";

import { AccountActions } from "./account-actions";
import { DesktopNavigation } from "./desktop-navigation";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Wordmark />
        <DesktopNavigation />
        <div className="header-actions">
          <Suspense fallback={<span className="language-placeholder" />}>
            <LanguageSwitcher />
          </Suspense>
          <AccountActions />
        </div>
      </div>
    </header>
  );
}
