-- Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_teams (связь пользователей и команд)
CREATE TABLE IF NOT EXISTS "user_teams" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "team_id" INTEGER NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("user_id", "team_id")
);

-- Create team_databases (связь команд и баз данных)
CREATE TABLE IF NOT EXISTS "team_databases" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "database_id" INTEGER NOT NULL REFERENCES "databases"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("team_id", "database_id")
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX "idx_user_teams_user_id" ON "user_teams"("user_id");
CREATE INDEX "idx_user_teams_team_id" ON "user_teams"("team_id");
CREATE INDEX "idx_team_databases_team_id" ON "team_databases"("team_id");
CREATE INDEX "idx_team_databases_database_id" ON "team_databases"("database_id");
