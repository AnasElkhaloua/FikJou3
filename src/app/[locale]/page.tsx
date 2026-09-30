import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function FoundationPage() {
  const t = await getTranslations("Home");

  return (
    <main id="main-content" className="foundation-main">
      <section className="foundation-panel" aria-labelledby="foundation-title">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 id="foundation-title">{t("title")}</h1>
        <p className="foundation-copy">{t("description")}</p>
        <div className="home-actions">
          <Link className="primary-link" href="/register">
            {t("register")}
          </Link>
          <Link className="secondary-link" href="/login">
            {t("login")}
          </Link>
        </div>
        <p className="arabic-sample" dir="rtl" lang="ar">
          واش فيك الجوع؟
        </p>
      </section>
    </main>
  );
}
