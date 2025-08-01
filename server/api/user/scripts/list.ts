import { db } from "../../../index";
import { userScripts } from "../../../schema";
import { defineEventHandler } from "h3";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../../../utils/jwt";

// API для получения списка скриптов пользователя
export default defineEventHandler(async (event) => {
  try {
    // Получаем информацию об авторизованном пользователе
    const userData = await verifyAuth(event);

    if (!userData) {
      return {
        status: "error",
        message: "Не авторизован",
        code: 401,
      };
    }

    // Получаем все скрипты пользователя
    const scripts = await db
      .select()
      .from(userScripts)
      .where(eq(userScripts.user_id, userData.id))
      .orderBy(userScripts.updated_at);

    return {
      status: "success",
      scripts,
    };
  } catch (error) {
    console.error("Ошибка при получении скриптов:", error);
    return {
      status: "error",
      message: "Ошибка при получении скриптов",
    };
  }
});
