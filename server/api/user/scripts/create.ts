import { db } from "../../../index";
import { userScripts } from "../../../schema";
import { defineEventHandler, readBody } from "h3";
import { verifyAuth } from "../../../utils/jwt";

// API для создания нового скрипта
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
    const { name, content } = body;

    if (!name || !content) {
      return {
        status: "error",
        message: "Название и содержимое обязательны",
      };
    }

    // Создаем новый скрипт
    const [newScript] = await db
      .insert(userScripts)
      .values({
        user_id: userData.id,
        name,
        content,
      })
      .returning();

    return {
      status: "success",
      message: "Скрипт успешно создан",
      script: newScript,
    };
  } catch (error) {
    console.error("Ошибка при создании скрипта:", error);
    return {
      status: "error",
      message: "Ошибка при создании скрипта",
    };
  }
});
