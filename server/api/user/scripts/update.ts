import { db } from "../../../index";
import { userScripts } from "../../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq, and } from "drizzle-orm";
import { verifyAuth } from "../../../utils/jwt";

// API для обновления скрипта
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
    const { id, name, content } = body;

    if (!id || !name || !content) {
      return {
        status: "error",
        message: "ID, название и содержимое обязательны",
      };
    }

    // Обновляем скрипт (только если он принадлежит пользователю)
    const [updatedScript] = await db
      .update(userScripts)
      .set({
        name,
        content,
        updated_at: new Date(),
      })
      .where(and(eq(userScripts.id, id), eq(userScripts.user_id, userData.id)))
      .returning();

    if (!updatedScript) {
      return {
        status: "error",
        message: "Скрипт не найден или доступ запрещен",
      };
    }

    return {
      status: "success",
      message: "Скрипт успешно обновлен",
      script: updatedScript,
    };
  } catch (error) {
    console.error("Ошибка при обновлении скрипта:", error);
    return {
      status: "error",
      message: "Ошибка при обновлении скрипта",
    };
  }
});
