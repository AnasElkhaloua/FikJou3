CREATE TYPE "public"."app_locale" AS ENUM('en', 'fr');--> statement-breakpoint
CREATE TYPE "public"."seller_status" AS ENUM('ACTIVE', 'PAUSED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_provider_account_unique" UNIQUE("provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "area_translations" (
	"area_id" uuid NOT NULL,
	"locale" "app_locale" NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "area_translations_area_id_locale_pk" PRIMARY KEY("area_id","locale"),
	CONSTRAINT "area_translation_name_nonblank" CHECK (btrim("area_translations"."name") <> '')
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "areas_city_slug_unique" UNIQUE("city_id","slug"),
	CONSTRAINT "areas_city_id_id_unique" UNIQUE("city_id","id"),
	CONSTRAINT "areas_latitude_range" CHECK ("areas"."latitude" between -90 and 90),
	CONSTRAINT "areas_longitude_range" CHECK ("areas"."longitude" between -180 and 180)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"icon_key" text,
	"sort_order" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "categories_sort_order_unique" UNIQUE("sort_order"),
	CONSTRAINT "categories_sort_order_nonnegative" CHECK ("categories"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"category_id" uuid NOT NULL,
	"locale" "app_locale" NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_translations_category_id_locale_pk" PRIMARY KEY("category_id","locale"),
	CONSTRAINT "category_translation_name_nonblank" CHECK (btrim("category_translations"."name") <> '')
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "cities_country_slug_unique" UNIQUE("country_id","slug"),
	CONSTRAINT "cities_latitude_range" CHECK ("cities"."latitude" between -90 and 90),
	CONSTRAINT "cities_longitude_range" CHECK ("cities"."longitude" between -180 and 180)
);
--> statement-breakpoint
CREATE TABLE "city_translations" (
	"city_id" uuid NOT NULL,
	"locale" "app_locale" NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "city_translations_city_id_locale_pk" PRIMARY KEY("city_id","locale"),
	CONSTRAINT "city_translation_name_nonblank" CHECK (btrim("city_translations"."name") <> '')
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"slug" text NOT NULL,
	"currency_code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code"),
	CONSTRAINT "countries_slug_unique" UNIQUE("slug"),
	CONSTRAINT "countries_code_format" CHECK ("countries"."code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "countries_currency_format" CHECK ("countries"."currency_code" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "country_translations" (
	"country_id" uuid NOT NULL,
	"locale" "app_locale" NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "country_translations_country_id_locale_pk" PRIMARY KEY("country_id","locale"),
	CONSTRAINT "country_translation_name_nonblank" CHECK (btrim("country_translations"."name") <> '')
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "seller_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_storage_key" text,
	"avatar_url" text,
	"city_id" uuid NOT NULL,
	"area_id" uuid,
	"status" "seller_status" DEFAULT 'ACTIVE' NOT NULL,
	"allow_platform_messages" boolean DEFAULT true NOT NULL,
	"allow_whatsapp" boolean DEFAULT false NOT NULL,
	"allow_phone" boolean DEFAULT false NOT NULL,
	"contact_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seller_profiles_user_unique" UNIQUE("user_id"),
	CONSTRAINT "seller_profiles_slug_unique" UNIQUE("slug"),
	CONSTRAINT "seller_profiles_display_name_nonblank" CHECK (btrim("seller_profiles"."display_name") <> ''),
	CONSTRAINT "seller_profiles_slug_nonblank" CHECK (btrim("seller_profiles"."slug") <> ''),
	CONSTRAINT "seller_profiles_contact_mode_requires_phone" CHECK ((not "seller_profiles"."allow_whatsapp" and not "seller_profiles"."allow_phone") or "seller_profiles"."contact_phone" is not null)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tag_translations" (
	"tag_id" uuid NOT NULL,
	"locale" "app_locale" NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tag_translations_tag_id_locale_pk" PRIMARY KEY("tag_id","locale"),
	CONSTRAINT "tag_translation_name_nonblank" CHECK (btrim("tag_translations"."name") <> '')
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone_number" text,
	"phone_verified_at" timestamp with time zone,
	"preferred_locale" "app_locale",
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_translations" ADD CONSTRAINT "area_translations_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_translations" ADD CONSTRAINT "city_translations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_translations" ADD CONSTRAINT "country_translations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_city_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_city_area_fk" FOREIGN KEY ("city_id","area_id") REFERENCES "public"."areas"("city_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_translations" ADD CONSTRAINT "tag_translations_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "areas_city_active_idx" ON "areas" USING btree ("city_id","active");--> statement-breakpoint
CREATE INDEX "categories_active_order_idx" ON "categories" USING btree ("active","sort_order");--> statement-breakpoint
CREATE INDEX "cities_country_active_idx" ON "cities" USING btree ("country_id","active");--> statement-breakpoint
CREATE INDEX "seller_profiles_status_city_idx" ON "seller_profiles" USING btree ("status","city_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_status_role_idx" ON "users" USING btree ("status","role");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verifications_expires_at_idx" ON "verifications" USING btree ("expires_at");