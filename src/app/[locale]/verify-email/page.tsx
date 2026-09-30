import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const t = await getTranslations("Auth");
  const result =
    query.verified === "1" ? "success" : query.error ? "error" : "pending";

  return (
    <main id="main-content" className="auth-main">
      <section className="auth-card" aria-labelledby="verify-title">
        <h1 id="verify-title">{t("verifyTitle")}</h1>
        <p className={result === "error" ? "form-message error" : undefined}>
          {result === "success"
            ? t("verificationSuccess")
            : result === "error"
              ? t("verificationError")
              : t("verifyDescription")}
        </p>
      </section>
    </main>
  );
}
