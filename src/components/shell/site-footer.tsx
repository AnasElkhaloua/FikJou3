import { getTranslations } from "next-intl/server";

import { Wordmark } from "./wordmark";

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <Wordmark />
        <p>{t("description")}</p>
        <p className="footer-note">{t("arrangements")}</p>
      </div>
    </footer>
  );
}
