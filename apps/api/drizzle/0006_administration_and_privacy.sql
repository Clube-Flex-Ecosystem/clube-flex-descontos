ALTER TABLE "users" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_change_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "anonymized_at" timestamp with time zone;--> statement-breakpoint
CREATE FUNCTION "audit_events_reject_change"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Eventos de auditoria são imutáveis' USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "audit_events_immutable" BEFORE UPDATE OR DELETE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION "audit_events_reject_change"();
