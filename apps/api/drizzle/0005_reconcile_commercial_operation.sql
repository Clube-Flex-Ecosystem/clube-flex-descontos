ALTER TABLE "lead_sources" ADD COLUMN IF NOT EXISTS "requires_referral" boolean DEFAULT false NOT NULL;
ALTER TABLE "lead_sources" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_detail" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "referred_by" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "loss_reason" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "lead_contact_requests" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp with time zone;
ALTER TABLE "lead_contact_requests" ADD COLUMN IF NOT EXISTS "resolved_by" uuid REFERENCES "users"("id");
ALTER TABLE "lead_history" ADD COLUMN IF NOT EXISTS "actor_user_id" uuid REFERENCES "users"("id");

CREATE TABLE IF NOT EXISTS "lead_observations" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "lead_id" uuid NOT NULL REFERENCES "leads"("id"),
 "author_user_id" uuid NOT NULL REFERENCES "users"("id"),
 "text" text NOT NULL,
 "created_at" timestamp with time zone NOT NULL,
 "updated_at" timestamp with time zone NOT NULL
);
CREATE INDEX IF NOT EXISTS "lead_observations_lead_id_idx" ON "lead_observations" ("lead_id");
