import { db } from "../..";
import { users } from "../../schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// Этот API будет вызываться для обновления статуса онлайн
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

    // Обновляем статус и время последней активности
    await db
      .update(users)
      .set({
        last_activity: new Date(),
        is_online: "online",
      })
      .where(eq(users.id, userData.id));

    return {
      status: "success",
      message: "Статус обновлен",
    };
  } catch (error) {
    console.error("Ошибка при обновлении статуса:", error);
    return {
      status: "error",
      message: "Ошибка при обновлении статуса",
    };
  }
});
