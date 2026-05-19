ALTER TABLE "matches" ADD COLUMN "home_source_match_num" smallint;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_source_match_num" smallint;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_source_outcome" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_source_outcome" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "match_num" smallint;