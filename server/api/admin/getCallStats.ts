import { db } from "../..";
import { records } from "../../schema";
import { sql } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// Этот API будет возвращать статистику по звонкам
export default defineEventHandler(async (event) => {
  try {
    // Проверяем авторизацию пользователя
    const userData = await verifyAuth(event);

    if (!userData) {
      return {
        status: "error",
        message: "Не авторизован",
        code: 401,
      };
    }

    // Проверяем, что пользователь админ
    if (userData.role !== "admin") {
      return {
        status: "error",
        message: "Нет доступа",
        code: 403,
      };
    }

    // Получаем статистику звонков по тегам
    const callStats = await db
      .select({
        status: records.tag,
        count: sql<number>`count(*)`,
      })
      .from(records)
      .groupBy(records.tag)
      .orderBy(records.tag);

    return {
      status: "success",
      data: callStats,
    };
  } catch (error) {
    console.error("Ошибка при получении статистики звонков:", error);
    return {
      status: "error",
      message: "Ошибка при получении статистики звонков",
    };
  }
});
