import { db } from "../../../index";
import { userScripts } from "../../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq, and } from "drizzle-orm";
import { verifyAuth } from "../../../utils/jwt";

// API для удаления скрипта
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

    const body = await readBody(event);
    const { id } = body;

    if (!id) {
      return {
        status: "error",
        message: "ID скрипта обязателен",
      };
    }

    // Удаляем скрипт (только если он принадлежит пользователю)
    const [deletedScript] = await db
      .delete(userScripts)
      .where(and(eq(userScripts.id, id), eq(userScripts.user_id, userData.id)))
      .returning();

    if (!deletedScript) {
      return {
        status: "error",
        message: "Скрипт не найден или доступ запрещен",
      };
    }

    return {
      status: "success",
      message: "Скрипт успешно удален",
    };
  } catch (error) {
    console.error("Ошибка при удалении скрипта:", error);
    return {
      status: "error",
      message: "Ошибка при удалении скрипта",
    };
  }
});
