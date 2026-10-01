import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { authSchema, users } from "@/server/db/schema";
import type * as databaseSchema from "@/server/db/schema";
import type { EmailSender } from "@/server/email/types";

type CreateAuthOptions = Readonly<{
  baseURL: string;
  database: NodePgDatabase<typeof databaseSchema>;
  emailSender: EmailSender;
  ipAddressHeader: "x-forwarded-for" | "x-real-ip";
  production: boolean;
  secret: string;
}>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function transactionalEmailContent(
  kind: "email-verification" | "password-reset",
  locale: "en" | "fr",
  url: string,
) {
  const escapedUrl = escapeHtml(url);
  const french = locale === "fr";
  const verification = kind === "email-verification";
  const subject = verification
    ? french
      ? "Vérifiez votre adresse e-mail Fik Jou3 ?"
      : "Verify your Fik Jou3? email address"
    : french
      ? "Réinitialisez votre mot de passe Fik Jou3 ?"
      : "Reset your Fik Jou3? password";
  const action = verification
    ? french
      ? "Vérifier mon adresse e-mail"
      : "Verify my email address"
    : french
      ? "Réinitialiser mon mot de passe"
      : "Reset my password";
  const instruction = french
    ? "Ce lien sécurisé est à usage unique et expire dans une heure."
    : "This secure link is single-use and expires in one hour.";
  const ignore = french
    ? "Si vous n’avez pas demandé cette action, vous pouvez ignorer cet e-mail."
    : "If you did not request this action, you can ignore this email.";

  return {
    html: `<div><p>Fik Jou3?</p><p>${instruction}</p><p><a href="${escapedUrl}">${action}</a></p><p>${ignore}</p></div>`,
    subject,
    text: `${instruction}\n\n${action}: ${url}\n\n${ignore}`,
  };
}

export function createAuth(options: CreateAuthOptions) {
  async function localeForUser(user: { id: string }): Promise<"en" | "fr"> {
    const [record] = await options.database
      .select({ preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    return record?.preferredLocale === "fr" ? "fr" : "en";
  }

  return betterAuth({
    advanced: {
      cookiePrefix: "fikjou3",
      database: { generateId: "uuid", validateSchema: true },
      disableCSRFCheck: false,
      disableOriginCheck: false,
      ipAddress: {
        ipAddressHeaders: [options.ipAddressHeader],
        ipv6Subnet: 64,
      },
      useSecureCookies: options.production,
    },
    appName: "Fik Jou3?",
    baseURL: options.baseURL,
    database: drizzleAdapter(options.database, {
      provider: "pg",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      maxPasswordLength: 128,
      minPasswordLength: 12,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 3600,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ url, user }) => {
        const locale = await localeForUser(user);
        const content = transactionalEmailContent(
          "password-reset",
          locale,
          url,
        );
        await options.emailSender.send({
          ...content,
          kind: "password-reset",
          locale,
          recipient: user.email,
        });
      },
    },
    emailVerification: {
      autoSignInAfterVerification: false,
      expiresIn: 3600,
      sendOnSignIn: false,
      sendOnSignUp: true,
      sendVerificationEmail: async ({ url, user }) => {
        const locale = await localeForUser(user);
        const content = transactionalEmailContent(
          "email-verification",
          locale,
          url,
        );
        await options.emailSender.send({
          ...content,
          kind: "email-verification",
          locale,
          recipient: user.email,
        });
      },
    },
    rateLimit: {
      customRules: {
        "/request-password-reset": { max: 5, window: 900 },
        "/reset-password": { max: 5, window: 900 },
        "/send-verification-email": { max: 3, window: 900 },
        "/sign-in/email": { max: 10, window: 900 },
        "/sign-up/email": { max: 5, window: 900 },
      },
      enabled: true,
      max: 60,
      modelName: "rateLimit",
      storage: "database",
      window: 60,
    },
    secret: options.secret,
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: [options.baseURL],
    user: {
      additionalFields: {
        phoneNumber: {
          input: false,
          required: false,
          returned: false,
          type: "string",
        },
        phoneVerifiedAt: {
          input: false,
          required: false,
          returned: false,
          type: "date",
        },
        preferredLocale: {
          defaultValue: "en",
          input: true,
          required: false,
          type: ["en", "fr"],
        },
        role: {
          defaultValue: "USER",
          input: false,
          required: true,
          type: ["USER", "ADMIN"],
        },
        status: {
          defaultValue: "ACTIVE",
          input: false,
          required: true,
          type: ["ACTIVE", "SUSPENDED", "DEACTIVATED"],
        },
      },
    },
  });
}
