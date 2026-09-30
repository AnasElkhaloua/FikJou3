"use client";

import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/marketplace/states";

export default function Error({ retry }: { retry: () => void }) {
  const t = useTranslations("States");

  return (
    <main id="main-content" className="state-main page-container">
      <ErrorState
        action={t("errorAction")}
        description={t("errorDescription")}
        onRetry={retry}
        title={t("errorTitle")}
      />
    </main>
  );
}
