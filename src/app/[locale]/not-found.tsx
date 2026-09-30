import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/marketplace/states";

export default async function NotFound() {
  const t = await getTranslations("States");

  return (
    <main id="main-content" className="state-main page-container">
      <EmptyState
        action={t("notFoundAction")}
        description={t("notFoundDescription")}
        href="/"
        title={t("notFoundTitle")}
      />
    </main>
  );
}
