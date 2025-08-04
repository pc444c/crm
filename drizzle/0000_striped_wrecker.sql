CREATE TABLE "databases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"online_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"database_id" integer NOT NULL,
	"title" varchar(255),
	"number" varchar(50),
	"fio" varchar(255),
	"city" varchar(100),
	"region" varchar(100),
	"address" varchar(255),
	"age" varchar(10),
	"phone" varchar(20),
	"timezone" varchar(50),
	"custom1" varchar(255),
	"custom2" varchar(255),
	"custom3" varchar(255),
	"description" varchar(500),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"tag" varchar(50) DEFAULT 'no used' NOT NULL,
	"user_id" integer,
	"status_updated_at" timestamp (3),
	"used_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"about" varchar(255),
	"color" varchar(20) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"login" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"last_activity" timestamp (3),
	"is_online" varchar(10) DEFAULT 'offline' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;