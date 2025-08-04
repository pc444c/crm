import { db } from "../..";
import { users, records } from "../../schema";
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

    // Освобождаем записи пользователя со статусом "used"
    // (те, что были выданы, но не получили финальный статус)
    await db
      .update(records)
      .set({
        user_id: null, // Убираем привязку к пользователю
        // Статус остается "used", чтобы они выдавались первыми при следующем запросе
      })
      .where(eq(records.user_id, userData.id));

    return {
      status: "success",
      message: "Статус изменен на оффлайн, записи освобождены",
    };
  } catch (error) {
    console.error("Ошибка при установке статуса оффлайн:", error);
    return {
      status: "error",
      message: "Ошибка при установке статуса оффлайн",
    };
  }
});
