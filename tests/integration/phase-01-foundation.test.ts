import { count, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgresInstance } from "pg-embedded";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAuth } from "../../src/modules/auth/create-auth";
import {
  AuthorizationError,
  requireActive,
} from "../../src/server/authorization/policy";
import {
  categories,
  categoryTranslations,
  sellerProfiles,
  sessions,
  users,
} from "../../src/server/db/schema";
import * as schema from "../../src/server/db/schema";
import { seedReferenceData } from "../../src/server/db/seed";
import { publicUserSelection } from "../../src/server/dto/user-projections";
import type { TransactionalEmail } from "../../src/server/email/types";

describe("Phase 01 PostgreSQL and auth foundation", () => {
  let postgres: PostgresInstance;
  let pool: Pool;
  let database: ReturnType<typeof drizzle<typeof schema>>;
  const delivered: TransactionalEmail[] = [];
  const baseURL = "http://localhost:3000";

  beforeAll(async () => {
    postgres = new PostgresInstance({
      databaseName: "postgres",
      persistent: false,
      port: 0,
      setupTimeout: 150,
      timeout: 60,
    });
    await postgres.start();
    pool = new Pool({
      connectionString: postgres.connectionInfo.connectionString,
    });
    database = drizzle(pool, { schema });
    await migrate(database, { migrationsFolder: "drizzle" });
    await seedReferenceData(database);
    await seedReferenceData(database);
  });

  afterAll(async () => {
    if (pool) await pool.end();
    if (postgres) {
      await postgres.stop();
      await postgres.cleanup();
    }
  });

  it("seeds complete EN/FR controlled data and persists Unicode", async () => {
    const [categoryCount] = await database
      .select({ value: count() })
      .from(categories);
    const [translationCount] = await database
      .select({ value: count() })
      .from(categoryTranslations);
    expect(categoryCount?.value).toBe(9);
    expect(translationCount?.value).toBe(18);

    const [frenchCake] = await database
      .select({ name: categoryTranslations.name })
      .from(categoryTranslations)
      .where(eq(categoryTranslations.name, "Gâteaux"));
    expect(frenchCake?.name).toBe("Gâteaux");

    await expect(
      database.execute(sql`
        insert into category_translations (category_id, locale, name)
        values ('40000000-0000-4000-8000-000000000001', 'ar', 'مغربي')
      `),
    ).rejects.toThrow();
  });

  it("enforces one seller per user, city/area integrity and historical restrict", async () => {
    const userId = "50000000-0000-4000-8000-000000000001";
    await database.insert(users).values({
      email: "seller@example.test",
      id: userId,
      name: "بائعة مغربية",
    });

    await database.insert(sellerProfiles).values({
      cityId: "20000000-0000-4000-8000-000000000001",
      displayName: "مطبخ فاطمة",
      id: "60000000-0000-4000-8000-000000000001",
      slug: "fatimas-kitchen",
      userId,
    });

    await expect(
      database.insert(sellerProfiles).values({
        cityId: "20000000-0000-4000-8000-000000000001",
        displayName: "Duplicate",
        id: "60000000-0000-4000-8000-000000000002",
        slug: "duplicate-kitchen",
        userId,
      }),
    ).rejects.toThrow();

    await expect(
      database.insert(sellerProfiles).values({
        areaId: "30000000-0000-4000-8000-000000000003",
        cityId: "20000000-0000-4000-8000-000000000001",
        displayName: "Wrong area",
        id: "60000000-0000-4000-8000-000000000003",
        slug: "wrong-area",
        userId: "50000000-0000-4000-8000-000000000002",
      }),
    ).rejects.toThrow();

    await expect(
      database.delete(users).where(eq(users.id, userId)),
    ).rejects.toThrow();
  });

  it("performs verified email, session and single-use password reset flows", async () => {
    const auth = createAuth({
      baseURL,
      database,
      emailSender: {
        async send(message) {
          delivered.push(message);
        },
      },
      ipAddressHeader: "x-forwarded-for",
      production: false,
      secret: "integration-test-secret-at-least-thirty-two-bytes",
    });
    const email = "auth-flow@example.test";
    const oldPassword = "old-password-long-enough";
    const newPassword = "new-password-long-enough";

    const request = (path: string, body?: object, cookie?: string) => {
      const init: RequestInit = {
        headers: {
          ...(body ? { "content-type": "application/json" } : {}),
          ...(cookie ? { cookie } : {}),
          origin: baseURL,
          "x-forwarded-for": "127.0.0.1",
        },
        method: body ? "POST" : "GET",
      };
      if (body) init.body = JSON.stringify(body);
      return new Request(
        path.startsWith("http") ? path : `${baseURL}${path}`,
        init,
      );
    };

    const signUp = await auth.handler(
      request("/api/auth/sign-up/email", {
        callbackURL: "/fr/verify-email?verified=1",
        email,
        name: "Élodie أمين",
        password: oldPassword,
        preferredLocale: "fr",
      }),
    );
    expect(signUp.status).toBe(200);
    expect(delivered.at(-1)?.kind).toBe("email-verification");
    expect(delivered.at(-1)?.locale).toBe("fr");

    const preVerificationLogin = await auth.handler(
      request("/api/auth/sign-in/email", { email, password: oldPassword }),
    );
    expect(preVerificationLogin.status).toBe(403);

    const verificationURL = delivered
      .at(-1)
      ?.text.match(/https?:\/\/\S+/u)?.[0];
    expect(verificationURL).toBeDefined();
    const verify = await auth.handler(request(verificationURL!));
    expect([200, 302]).toContain(verify.status);

    const login = await auth.handler(
      request("/api/auth/sign-in/email", { email, password: oldPassword }),
    );
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    expect(cookie).toContain("fikjou3.session_token=");

    const sessionResponse = await auth.handler(
      request("/api/auth/get-session", undefined, cookie),
    );
    expect(sessionResponse.status).toBe(200);
    const sessionBody = (await sessionResponse.json()) as {
      user: {
        emailVerified: boolean;
        id: string;
        role: "USER";
        status: "ACTIVE";
      };
    };
    expect(sessionBody.user.emailVerified).toBe(true);
    expect(
      requireActive({
        emailVerified: sessionBody.user.emailVerified,
        role: sessionBody.user.role,
        status: sessionBody.user.status,
        userId: sessionBody.user.id,
      }).userId,
    ).toBe(sessionBody.user.id);

    await database
      .update(users)
      .set({ status: "SUSPENDED" })
      .where(eq(users.id, sessionBody.user.id));
    expect(() =>
      requireActive({
        emailVerified: true,
        role: "USER",
        status: "SUSPENDED",
        userId: sessionBody.user.id,
      }),
    ).toThrowError(new AuthorizationError("ACCOUNT_UNAVAILABLE"));
    await database
      .update(users)
      .set({ status: "ACTIVE" })
      .where(eq(users.id, sessionBody.user.id));

    const [publicUser] = await database
      .select(publicUserSelection)
      .from(users)
      .where(eq(users.id, sessionBody.user.id));
    expect(Object.keys(publicUser ?? {}).sort()).toEqual([
      "createdAt",
      "id",
      "image",
      "name",
    ]);
    expect(publicUser).not.toHaveProperty("email");
    expect(publicUser).not.toHaveProperty("phoneNumber");
    expect(publicUser).not.toHaveProperty("role");

    const resetRequest = await auth.handler(
      request("/api/auth/request-password-reset", {
        email,
        redirectTo: "/fr/reset-password",
      }),
    );
    expect(resetRequest.status).toBe(200);
    const resetURL = delivered.at(-1)?.text.match(/https?:\/\/\S+/u)?.[0];
    const resetToken = resetURL
      ? new URL(resetURL).pathname.split("/").at(-1)
      : null;
    expect(resetToken).toBeTruthy();

    const reset = await auth.handler(
      request("/api/auth/reset-password", {
        newPassword,
        token: resetToken,
      }),
    );
    expect(reset.status).toBe(200);

    const reuse = await auth.handler(
      request("/api/auth/reset-password", {
        newPassword: "third-password-long-enough",
        token: resetToken,
      }),
    );
    expect(reuse.status).toBeGreaterThanOrEqual(400);

    const [sessionCount] = await database
      .select({ value: count() })
      .from(sessions);
    expect(sessionCount?.value).toBe(0);

    const oldLogin = await auth.handler(
      request("/api/auth/sign-in/email", { email, password: oldPassword }),
    );
    expect(oldLogin.status).toBeGreaterThanOrEqual(400);
    const newLogin = await auth.handler(
      request("/api/auth/sign-in/email", { email, password: newPassword }),
    );
    expect(newLogin.status).toBe(200);
  });

  it("returns an enumeration-safe reset response for an unknown email", async () => {
    const auth = createAuth({
      baseURL,
      database,
      emailSender: { async send() {} },
      ipAddressHeader: "x-forwarded-for",
      production: false,
      secret: "another-integration-secret-thirty-two-bytes",
    });
    const response = await auth.handler(
      new Request(`${baseURL}/api/auth/request-password-reset`, {
        body: JSON.stringify({
          email: "missing@example.test",
          redirectTo: "/en/reset-password",
        }),
        headers: { "content-type": "application/json", origin: baseURL },
        method: "POST",
      }),
    );
    expect(response.status).toBe(200);
  });

  it("rejects cross-origin auth mutations and persists auth rate limits", async () => {
    const auth = createAuth({
      baseURL,
      database,
      emailSender: { async send() {} },
      ipAddressHeader: "x-forwarded-for",
      production: false,
      secret: "rate-limit-integration-secret-thirty-two-bytes",
    });

    const crossOrigin = await auth.handler(
      new Request(`${baseURL}/api/auth/sign-up/email`, {
        body: JSON.stringify({
          email: "cross-origin@example.test",
          name: "Cross Origin",
          password: "long-enough-password",
        }),
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        method: "POST",
      }),
    );
    expect(crossOrigin.status).toBe(403);

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await auth.handler(
        new Request(`${baseURL}/api/auth/sign-in/email`, {
          body: JSON.stringify({
            email: "rate-limit-missing@example.test",
            password: "incorrect-password-long",
          }),
          headers: {
            "content-type": "application/json",
            origin: baseURL,
            "x-forwarded-for": "198.51.100.42",
          },
          method: "POST",
        }),
      );
      statuses.push(response.status);
    }
    expect(statuses.at(-1)).toBe(429);

    const rateLimitRows = await database.execute<{ count: string }>(sql`
      select count(*)::text as count from rate_limits
    `);
    expect(Number(rateLimitRows.rows[0]?.count)).toBeGreaterThan(0);
  });
});
