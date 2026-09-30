import { Suspense } from "react";

import { AuthForm } from "./auth-form";

export function AuthPage({
  mode,
}: {
  mode: "register" | "login" | "forgot" | "reset";
}) {
  return (
    <main id="main-content" className="auth-main">
      <Suspense fallback={null}>
        <AuthForm mode={mode} />
      </Suspense>
    </main>
  );
}
