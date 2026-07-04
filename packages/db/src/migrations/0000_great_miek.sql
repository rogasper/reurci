CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cv_version" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"job_title" text,
	"company_name" text,
	"job_description" text,
	"job_description_embedding" vector(384),
	"cv_snapshot" jsonb NOT NULL,
	"selected_strategy" jsonb,
	"ats_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "education" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"institution" text NOT NULL,
	"degree" text,
	"field" text,
	"year_start" integer,
	"year_end" integer
);
--> statement-breakpoint
CREATE TABLE "experience" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date,
	"description" text,
	"achievements" jsonb DEFAULT '[]'::jsonb,
	"embedding" vector(384)
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nickname" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "skill" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"proficiency" integer,
	"embedding" vector(384)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_version" ADD CONSTRAINT "cv_version_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education" ADD CONSTRAINT "education_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience" ADD CONSTRAINT "experience_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "cv_version_profile_id_idx" ON "cv_version" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "education_profile_id_idx" ON "education" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "experience_profile_id_idx" ON "experience" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "skill_profile_id_idx" ON "skill" USING btree ("profile_id");
--> statement-breakpoint
CREATE INDEX "experience_embedding_hnsw_idx" ON "experience" USING hnsw ("embedding" vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX "skill_embedding_hnsw_idx" ON "skill" USING hnsw ("embedding" vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX "cv_version_jd_embedding_hnsw_idx" ON "cv_version" USING hnsw ("job_description_embedding" vector_cosine_ops);