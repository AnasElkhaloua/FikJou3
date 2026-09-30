import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appLocale = pgEnum("app_locale", ["en", "fr"]);
export const userStatus = pgEnum("user_status", [
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
]);
export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);
export const sellerStatus = pgEnum("seller_status", [
  "ACTIVE",
  "PAUSED",
  "SUSPENDED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    phoneNumber: text("phone_number"),
    phoneVerifiedAt: timestamp("phone_verified_at", {
      mode: "date",
      withTimezone: true,
    }),
    preferredLocale: appLocale("preferred_locale"),
    status: userStatus("status").default("ACTIVE").notNull(),
    role: userRole("role").default("USER").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
    index("users_status_role_idx").on(table.status, table.role),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("sessions_token_unique").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("accounts_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("verifications_identifier_idx").on(table.identifier),
    index("verifications_expires_at_idx").on(table.expiresAt),
  ],
);

export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").default(0).notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const countries = pgTable(
  "countries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    slug: text("slug").notNull(),
    currencyCode: text("currency_code").notNull(),
    active: boolean("active").default(true).notNull(),
  },
  (table) => [
    unique("countries_code_unique").on(table.code),
    unique("countries_slug_unique").on(table.slug),
    check("countries_code_format", sql`${table.code} ~ '^[A-Z]{2}$'`),
    check(
      "countries_currency_format",
      sql`${table.currencyCode} ~ '^[A-Z]{3}$'`,
    ),
  ],
);

export const countryTranslations = pgTable(
  "country_translations",
  {
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    locale: appLocale("locale").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.countryId, table.locale] }),
    check("country_translation_name_nonblank", sql`btrim(${table.name}) <> ''`),
  ],
);

export const cities = pgTable(
  "cities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    countryId: uuid("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
    longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
    active: boolean("active").default(true).notNull(),
  },
  (table) => [
    unique("cities_country_slug_unique").on(table.countryId, table.slug),
    check("cities_latitude_range", sql`${table.latitude} between -90 and 90`),
    check(
      "cities_longitude_range",
      sql`${table.longitude} between -180 and 180`,
    ),
    index("cities_country_active_idx").on(table.countryId, table.active),
  ],
);

export const cityTranslations = pgTable(
  "city_translations",
  {
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    locale: appLocale("locale").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.cityId, table.locale] }),
    check("city_translation_name_nonblank", sql`btrim(${table.name}) <> ''`),
  ],
);

export const areas = pgTable(
  "areas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
    longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
    active: boolean("active").default(true).notNull(),
  },
  (table) => [
    unique("areas_city_slug_unique").on(table.cityId, table.slug),
    unique("areas_city_id_id_unique").on(table.cityId, table.id),
    check("areas_latitude_range", sql`${table.latitude} between -90 and 90`),
    check(
      "areas_longitude_range",
      sql`${table.longitude} between -180 and 180`,
    ),
    index("areas_city_active_idx").on(table.cityId, table.active),
  ],
);

export const areaTranslations = pgTable(
  "area_translations",
  {
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "cascade" }),
    locale: appLocale("locale").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.areaId, table.locale] }),
    check("area_translation_name_nonblank", sql`btrim(${table.name}) <> ''`),
  ],
);

export const sellerProfiles = pgTable(
  "seller_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull(),
    slug: text("slug").notNull(),
    bio: text("bio").default("").notNull(),
    avatarStorageKey: text("avatar_storage_key"),
    avatarUrl: text("avatar_url"),
    cityId: uuid("city_id").notNull(),
    areaId: uuid("area_id"),
    status: sellerStatus("status").default("ACTIVE").notNull(),
    allowPlatformMessages: boolean("allow_platform_messages")
      .default(true)
      .notNull(),
    allowWhatsApp: boolean("allow_whatsapp").default(false).notNull(),
    allowPhone: boolean("allow_phone").default(false).notNull(),
    contactPhone: text("contact_phone"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("seller_profiles_user_unique").on(table.userId),
    unique("seller_profiles_slug_unique").on(table.slug),
    foreignKey({
      columns: [table.cityId],
      foreignColumns: [cities.id],
      name: "seller_profiles_city_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.cityId, table.areaId],
      foreignColumns: [areas.cityId, areas.id],
      name: "seller_profiles_city_area_fk",
    }).onDelete("restrict"),
    check(
      "seller_profiles_display_name_nonblank",
      sql`btrim(${table.displayName}) <> ''`,
    ),
    check("seller_profiles_slug_nonblank", sql`btrim(${table.slug}) <> ''`),
    check(
      "seller_profiles_contact_mode_requires_phone",
      sql`(not ${table.allowWhatsApp} and not ${table.allowPhone}) or ${table.contactPhone} is not null`,
    ),
    index("seller_profiles_status_city_idx").on(table.status, table.cityId),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    iconKey: text("icon_key"),
    sortOrder: integer("sort_order").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("categories_sort_order_unique").on(table.sortOrder),
    check("categories_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
    index("categories_active_order_idx").on(table.active, table.sortOrder),
  ],
);

export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: appLocale("locale").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.categoryId, table.locale] }),
    check(
      "category_translation_name_nonblank",
      sql`btrim(${table.name}) <> ''`,
    ),
  ],
);

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tagTranslations = pgTable(
  "tag_translations",
  {
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    locale: appLocale("locale").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tagId, table.locale] }),
    check("tag_translation_name_nonblank", sql`btrim(${table.name}) <> ''`),
  ],
);

export const authSchema = {
  account: accounts,
  rateLimit: rateLimits,
  session: sessions,
  user: users,
  verification: verifications,
};
