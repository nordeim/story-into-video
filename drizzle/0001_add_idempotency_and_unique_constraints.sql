ALTER TABLE "usage_events" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "usage_events_idempotency_key_unique_idx" ON "usage_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "videos_project_id_unique_idx" ON "videos" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "voiceovers_project_id_unique_idx" ON "voiceovers" USING btree ("project_id");