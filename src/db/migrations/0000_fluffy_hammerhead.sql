CREATE TYPE "public"."match_stage" AS ENUM('group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'third_place', 'final');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished', 'postponed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('reminder_1h', 'round_summary', 'tournament_end', 'approval_status');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_email" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"payload_before" jsonb,
	"payload_after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"openfootball_match_id" text,
	"api_sports_fixture_id" integer,
	"home_team_id" uuid NOT NULL,
	"away_team_id" uuid NOT NULL,
	"kickoff_at" timestamp with time zone NOT NULL,
	"venue" text,
	"stage" "match_stage" NOT NULL,
	"group_letter" char(1),
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" smallint,
	"away_score" smallint,
	"finished_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_openfootball_match_id_unique" UNIQUE("openfootball_match_id"),
	CONSTRAINT "matches_api_sports_fixture_id_unique" UNIQUE("api_sports_fixture_id"),
	CONSTRAINT "matches_score_check" CHECK (("matches"."home_score" IS NULL AND "matches"."away_score" IS NULL) OR ("matches"."home_score" BETWEEN 0 AND 99 AND "matches"."away_score" BETWEEN 0 AND 99)),
	CONSTRAINT "matches_different_teams_check" CHECK ("matches"."home_team_id" <> "matches"."away_team_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp with time zone,
	"marked_by_email" text,
	"notes" text,
	CONSTRAINT "payments_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_sports_player_id" integer NOT NULL,
	"name" text NOT NULL,
	"team_id" uuid NOT NULL,
	"position" text,
	CONSTRAINT "players_api_sports_player_id_unique" UNIQUE("api_sports_player_id")
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"home_score" smallint NOT NULL,
	"away_score" smallint NOT NULL,
	"points" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "predictions_user_match_unique" UNIQUE("user_id","match_id"),
	CONSTRAINT "predictions_score_check" CHECK ("predictions"."home_score" BETWEEN 0 AND 15 AND "predictions"."away_score" BETWEEN 0 AND 15)
);
--> statement-breakpoint
CREATE TABLE "sent_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"reference_id" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sent_notifications_unique" UNIQUE("user_id","kind","reference_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "special_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"champion_team_id" uuid,
	"runner_up_team_id" uuid,
	"third_place_team_id" uuid,
	"top_scorer_player_id" uuid,
	"best_player_id" uuid,
	"most_goals_team_id" uuid,
	"bonus_points" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "special_predictions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fifa_code" text NOT NULL,
	"name" text NOT NULL,
	"flag_code" text NOT NULL,
	"openfootball_name" text NOT NULL,
	"api_sports_id" integer,
	"group_letter" char(1),
	CONSTRAINT "teams_fifa_code_unique" UNIQUE("fifa_code"),
	CONSTRAINT "teams_api_sports_id_unique" UNIQUE("api_sports_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_config" (
	"id" smallint PRIMARY KEY NOT NULL,
	"pozo_amount_ars" integer DEFAULT 0 NOT NULL,
	"tournament_starts_at" timestamp with time zone NOT NULL,
	"pool_locked" boolean DEFAULT false NOT NULL,
	"bonus_results" jsonb,
	"bonus_resolved_at" timestamp with time zone,
	"api_sports_daily_count" integer DEFAULT 0 NOT NULL,
	"api_sports_count_date" date DEFAULT now() NOT NULL,
	"api_paused_until" timestamp with time zone,
	CONSTRAINT "tournament_config_singleton" CHECK ("tournament_config"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"name" text NOT NULL,
	"image" text,
	"favorite_team_id" uuid,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"email_opt_out" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_notifications" ADD CONSTRAINT "sent_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_champion_team_id_teams_id_fk" FOREIGN KEY ("champion_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_runner_up_team_id_teams_id_fk" FOREIGN KEY ("runner_up_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_third_place_team_id_teams_id_fk" FOREIGN KEY ("third_place_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_top_scorer_player_id_players_id_fk" FOREIGN KEY ("top_scorer_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_best_player_id_players_id_fk" FOREIGN KEY ("best_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_most_goals_team_id_teams_id_fk" FOREIGN KEY ("most_goals_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_admin_email_idx" ON "admin_audit_log" USING btree ("admin_email");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "admin_audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "matches_kickoff_idx" ON "matches" USING btree ("kickoff_at");--> statement-breakpoint
CREATE INDEX "matches_status_kickoff_idx" ON "matches" USING btree ("status","kickoff_at");--> statement-breakpoint
CREATE INDEX "matches_stage_idx" ON "matches" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "payments_paid_idx" ON "payments" USING btree ("paid");--> statement-breakpoint
CREATE INDEX "players_name_idx" ON "players" USING btree ("name");--> statement-breakpoint
CREATE INDEX "players_team_idx" ON "players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "predictions_match_idx" ON "predictions" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "predictions_user_idx" ON "predictions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_fifa_code_idx" ON "teams" USING btree ("fifa_code");--> statement-breakpoint
CREATE INDEX "teams_api_sports_id_idx" ON "teams" USING btree ("api_sports_id");--> statement-breakpoint
CREATE INDEX "teams_group_letter_idx" ON "teams" USING btree ("group_letter");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");