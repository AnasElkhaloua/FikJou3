"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import type { AppLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

import { safeAuthReturnPath } from "./redirects";

type Mode = "register" | "login" | "forgot" | "reset";

const emailSchema = z.email();
const passwordSchema = z.string().min(12).max(128);

const endpointByMode: Record<Mode, string> = {
  forgot: "/api/auth/request-password-reset",
  login: "/api/auth/sign-in/email",
  register: "/api/auth/sign-up/email",
  reset: "/api/auth/reset-password",
};

export function AuthForm({ mode }: { mode: Mode }) {
  const locale = useLocale() as AppLocale;
  const query = useSearchParams();
  const t = useTranslations("Auth");
  const validation = useTranslations("Validation");
  const [status, setStatus] = useState<
    "idle" | "working" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>();

  const title = t(`${mode}Title`);
  const submitLabel = t(`${mode}Submit`);

  async function submit(formData: FormData) {
    setStatus("working");
    setMessage(undefined);

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    if (mode !== "reset" && !emailSchema.safeParse(email).success) {
      setStatus("error");
      setMessage(validation("emailInvalid"));
      return;
    }
    if (mode !== "forgot" && !passwordSchema.safeParse(password).success) {
      setStatus("error");
      setMessage(validation("passwordLength"));
      return;
    }
    if (mode === "register" && name.length === 0) {
      setStatus("error");
      setMessage(validation("nameRequired"));
      return;
    }

    const returnTo = safeAuthReturnPath(query.get("returnTo"), locale);
    const token = query.get("token");
    if (mode === "reset" && !token) {
      setStatus("error");
      setMessage(validation("tokenMissing"));
      return;
    }

    const body =
      mode === "register"
        ? {
            callbackURL: `/${locale}/verify-email?verified=1`,
            email,
            name,
            password,
            preferredLocale: locale,
          }
        : mode === "login"
          ? { callbackURL: returnTo, email, password }
          : mode === "forgot"
            ? {
                email,
                redirectTo: `/${locale}/reset-password`,
              }
            : { newPassword: password, token };

    try {
      const response = await fetch(endpointByMode[mode], {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (mode === "forgot") {
        setStatus("success");
        setMessage(t("genericSuccess"));
        return;
      }

      if (!response.ok) {
        setStatus("error");
        setMessage(t("genericError"));
        return;
      }

      if (mode === "login") {
        window.location.assign(returnTo);
        return;
      }

      setStatus("success");
      setMessage(t("genericSuccess"));
    } catch {
      setStatus("error");
      setMessage(t("genericError"));
    }
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">{title}</h1>
      {mode === "forgot" ? <p>{t("forgotDescription")}</p> : null}
      <form action={submit} noValidate>
        {mode === "register" ? (
          <label>
            <span>{t("name")}</span>
            <input autoComplete="name" name="name" required />
          </label>
        ) : null}
        {mode !== "reset" ? (
          <label>
            <span>{t("email")}</span>
            <input
              autoComplete="email"
              inputMode="email"
              name="email"
              required
              type="email"
            />
          </label>
        ) : null}
        {mode !== "forgot" ? (
          <label>
            <span>{mode === "reset" ? t("newPassword") : t("password")}</span>
            <input
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={12}
              maxLength={128}
              name="password"
              required
              type="password"
            />
            <small>{t("passwordHint")}</small>
          </label>
        ) : null}
        <button disabled={status === "working"} type="submit">
          {status === "working" ? t("working") : submitLabel}
        </button>
      </form>
      {message ? (
        <p
          className={`form-message ${status}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
      <div className="auth-links">
        {mode === "login" ? (
          <Link href="/forgot-password">{t("forgotLink")}</Link>
        ) : null}
        {mode !== "login" ? <Link href="/login">{t("loginLink")}</Link> : null}
        {mode !== "register" ? (
          <Link href="/register">{t("registerLink")}</Link>
        ) : null}
      </div>
    </section>
  );
}
