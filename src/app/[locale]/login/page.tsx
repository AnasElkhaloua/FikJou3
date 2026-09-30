import type { Metadata } from "next";

import { AuthPage } from "@/modules/auth/auth-page";

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
