import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
// Установка настроек для поддержки UTF-8

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Добавляем поддержку UTF-8
  query_timeout: 10000,
  client_encoding: "UTF8",
  application_name: "nuxt_crm",
});

export const db = drizzle(pool);
