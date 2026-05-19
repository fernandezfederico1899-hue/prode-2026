ALTER TABLE "matches" ALTER COLUMN "home_team_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "away_team_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_slot" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_slot" text;