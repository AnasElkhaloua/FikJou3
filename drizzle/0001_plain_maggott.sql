CREATE TYPE "public"."listing_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'REMOVED');--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"delivery_url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_images_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "listing_images_listing_order_unique" UNIQUE("listing_id","sort_order"),
	CONSTRAINT "listing_images_width_positive" CHECK ("listing_images"."width" > 0),
	CONSTRAINT "listing_images_height_positive" CHECK ("listing_images"."height" > 0),
	CONSTRAINT "listing_images_size_positive" CHECK ("listing_images"."byte_size" > 0),
	CONSTRAINT "listing_images_order_range" CHECK ("listing_images"."sort_order" between 0 and 5),
	CONSTRAINT "listing_images_mime_webp" CHECK ("listing_images"."mime_type" = 'image/webp')
);
--> statement-breakpoint
CREATE TABLE "listing_tags" (
	"listing_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "listing_tags_listing_id_tag_id_pk" PRIMARY KEY("listing_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_profile_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"area_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_amount" numeric(12, 2),
	"currency_code" text DEFAULT 'MAD' NOT NULL,
	"pickup_available" boolean DEFAULT false NOT NULL,
	"delivery_available" boolean DEFAULT false NOT NULL,
	"status" "listing_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"private_latitude" numeric(9, 6),
	"private_longitude" numeric(9, 6),
	"public_latitude" numeric(9, 6),
	"public_longitude" numeric(9, 6),
	"public_location_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug"),
	CONSTRAINT "listings_title_nonblank" CHECK (btrim("listings"."title") <> ''),
	CONSTRAINT "listings_title_length" CHECK (char_length("listings"."title") <= 120),
	CONSTRAINT "listings_description_length" CHECK (char_length("listings"."description") <= 2000),
	CONSTRAINT "listings_price_positive" CHECK ("listings"."price_amount" is null or "listings"."price_amount" > 0),
	CONSTRAINT "listings_currency_format" CHECK ("listings"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "listings_currency_mad" CHECK ("listings"."currency_code" = 'MAD'),
	CONSTRAINT "listings_active_fulfillment" CHECK ("listings"."status" <> 'ACTIVE' or "listings"."pickup_available" or "listings"."delivery_available"),
	CONSTRAINT "listings_private_coordinates_pair" CHECK (("listings"."private_latitude" is null) = ("listings"."private_longitude" is null)),
	CONSTRAINT "listings_public_coordinates_pair" CHECK (("listings"."public_latitude" is null) = ("listings"."public_longitude" is null)),
	CONSTRAINT "listings_private_latitude_range" CHECK ("listings"."private_latitude" is null or "listings"."private_latitude" between -90 and 90),
	CONSTRAINT "listings_private_longitude_range" CHECK ("listings"."private_longitude" is null or "listings"."private_longitude" between -180 and 180),
	CONSTRAINT "listings_public_latitude_range" CHECK ("listings"."public_latitude" is null or "listings"."public_latitude" between -90 and 90),
	CONSTRAINT "listings_public_longitude_range" CHECK ("listings"."public_longitude" is null or "listings"."public_longitude" between -180 and 180),
	CONSTRAINT "listings_active_publish_fields" CHECK ("listings"."status" <> 'ACTIVE' or ("listings"."price_amount" is not null and "listings"."area_id" is not null and "listings"."published_at" is not null and "listings"."public_latitude" is not null and "listings"."public_longitude" is not null and "listings"."public_location_version" is not null))
);
--> statement-breakpoint
CREATE TABLE "storage_cleanup_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "storage_cleanup_jobs_attempts_nonnegative" CHECK ("storage_cleanup_jobs"."attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_tags" ADD CONSTRAINT "listing_tags_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_tags" ADD CONSTRAINT "listing_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_profile_id_seller_profiles_id_fk" FOREIGN KEY ("seller_profile_id") REFERENCES "public"."seller_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_city_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_city_area_fk" FOREIGN KEY ("city_id","area_id") REFERENCES "public"."areas"("city_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listing_images_listing_idx" ON "listing_images" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "listing_tags_tag_idx" ON "listing_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "listings_seller_status_idx" ON "listings" USING btree ("seller_profile_id","status");--> statement-breakpoint
CREATE INDEX "listings_category_status_idx" ON "listings" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "listings_city_area_status_idx" ON "listings" USING btree ("city_id","area_id","status");--> statement-breakpoint
CREATE INDEX "listings_published_at_idx" ON "listings" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "listings_price_idx" ON "listings" USING btree ("price_amount");--> statement-breakpoint
CREATE INDEX "storage_cleanup_jobs_pending_idx" ON "storage_cleanup_jobs" USING btree ("completed_at","created_at");