CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_key_unique" UNIQUE("name_key"),
	CONSTRAINT "categories_status_check" CHECK ("categories"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "partner_benefits" (
	"partner_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"discount_percentage" integer NOT NULL,
	"coupon" text,
	CONSTRAINT "partner_benefits_partner_id_plan_id_pk" PRIMARY KEY("partner_id","plan_id"),
	CONSTRAINT "partner_benefits_percentage_check" CHECK ("partner_benefits"."discount_percentage" between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "partner_categories" (
	"partner_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "partner_categories_partner_id_category_id_pk" PRIMARY KEY("partner_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "partner_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"unit_id" uuid,
	"position" integer NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"label" text,
	CONSTRAINT "partner_contacts_type_check" CHECK ("partner_contacts"."type" in ('phone', 'whatsapp'))
);
--> statement-breakpoint
CREATE TABLE "partner_slug_history" (
	"slug" text PRIMARY KEY NOT NULL,
	"partner_id" uuid NOT NULL,
	"retired_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"postal_code" text NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"opening_hours" text,
	"instructions" text,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "partner_units_status_check" CHECK ("partner_units"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"usage_instructions" text,
	"website" text,
	"featured" boolean DEFAULT false NOT NULL,
	"general_coupon" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"first_published_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_slug_unique" UNIQUE("slug"),
	CONSTRAINT "partners_status_check" CHECK ("partners"."status" in ('draft', 'published', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_name_key_unique" UNIQUE("name_key"),
	CONSTRAINT "plans_slug_unique" UNIQUE("slug"),
	CONSTRAINT "plans_status_check" CHECK ("plans"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
ALTER TABLE "partner_benefits" ADD CONSTRAINT "partner_benefits_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_benefits" ADD CONSTRAINT "partner_benefits_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_categories" ADD CONSTRAINT "partner_categories_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_categories" ADD CONSTRAINT "partner_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_contacts" ADD CONSTRAINT "partner_contacts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_contacts" ADD CONSTRAINT "partner_contacts_unit_id_partner_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."partner_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_slug_history" ADD CONSTRAINT "partner_slug_history_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_units" ADD CONSTRAINT "partner_units_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_contacts_partner_id_idx" ON "partner_contacts" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_units_partner_id_idx" ON "partner_units" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partners_name_key_idx" ON "partners" USING btree ("name_key");