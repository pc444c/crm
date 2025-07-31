import { db } from "../..";
import { users } from "../../schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// Этот API будет возвращать список пользователей онлайн для админов
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

    // Получаем текущее время и определяем порог активности (5 минут)
    const now = new Date();
    const inactiveTime = new Date(now);
    inactiveTime.setMinutes(inactiveTime.getMinutes() - 5);

    // Получаем всех пользователей
    const allUsers = await db
      .select({
        id: users.id,
        login: users.login,
        last_activity: users.last_activity,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, "user")) // Только обычные пользователи, не админы
      .orderBy(users.last_activity);

    // Фильтруем только тех, кто был активен менее 5 минут назад
    const actualOnlineUsers = allUsers.filter(
      (user) =>
        user.last_activity && new Date(user.last_activity) >= inactiveTime
    );

    return {
      status: "success",
      users: actualOnlineUsers,
    };
  } catch (error) {
    console.error("Ошибка при получении онлайн пользователей:", error);
    return {
      status: "error",
      message: "Ошибка при получении онлайн пользователей",
    };
  }
});
