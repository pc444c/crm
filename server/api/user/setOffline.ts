import { db } from "../..";
import { users } from "../../schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// API для установки статуса пользователя как оффлайн при закрытии браузера
export default defineEventHandler(async (event) => {
  try {
    // Проверяем авторизацию пользователя
    const userData = await verifyAuth(event);

    if (!userData) {
      // Если пользователь не авторизован, просто возвращаем успешный ответ
      return {
        status: "success",
        message: "Пользователь не авторизован",
      };
    }

    // Устанавливаем статус оффлайн
    await db
      .update(users)
      .set({
        last_activity: new Date(),
        is_online: "offline",
      })
      .where(eq(users.id, userData.id));

    return {
      status: "success",
      message: "Статус изменен на оффлайн",
    };
  } catch (error) {
    console.error("Ошибка при установке статуса оффлайн:", error);
    return {
      status: "error",
      message: "Ошибка при установке статуса оффлайн",
    };
  }
});
