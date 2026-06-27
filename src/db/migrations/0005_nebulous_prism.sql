CREATE TABLE "bracket_picks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_num" smallint NOT NULL,
	"winner_team_id" uuid NOT NULL,
	"points" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bracket_picks_user_match_unique" UNIQUE("user_id","match_num")
);
--> statement-breakpoint
ALTER TABLE "bracket_picks" ADD CONSTRAINT "bracket_picks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_picks" ADD CONSTRAINT "bracket_picks_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bracket_picks_user_idx" ON "bracket_picks" USING btree ("user_id");