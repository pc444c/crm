import { defineEventHandler } from "h3";
import { db } from "../index";
import { tags } from "../schema";

export default defineEventHandler(async () => {
  try {
    console.log("Тест соединения с БД начат");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    // Простой запрос для проверки соединения
    const result = await db.select({ count: tags.id }).from(tags);

    console.log("Тест соединения с БД выполнен успешно");
    console.log("Результат:", result);

    return {
      status: "success",
      message: "Соединение с БД работает",
      dbInfo: {
        tagCount: result[0]?.count || 0,
        databaseUrl: process.env.DATABASE_URL?.replace(/:[^:]*@/, ":***@"), // скрываем пароль
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Ошибка при тесте соединения с БД:", error);
    return {
      status: "error",
      message: "Ошибка соединения с БД",
      error: String(error),
    };
  }
});
