import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Получаем строку подключения из переменных окружения
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL не определен в переменных окружения");
  process.exit(1);
}

async function runMigration() {
  console.log("Запуск миграции...");

  try {
    // Создаем клиент подключения к базе данных
    const client = postgres(connectionString);

    // Создаем экземпляр Drizzle
    const db = drizzle(client);

    // Запускаем миграцию
    await migrate(db, { migrationsFolder: "./drizzle" });

    console.log("Миграция успешно завершена");

    // Закрываем клиент
    await client.end();
  } catch (error) {
    console.error("Ошибка при выполнении миграции:", error);
    process.exit(1);
  }
}

runMigration();
