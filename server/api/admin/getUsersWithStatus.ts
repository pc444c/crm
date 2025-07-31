import { db } from "../..";
import { users } from "../../schema";
import { desc } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// Этот API будет возвращать список всех пользователей со статусами для админов
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

    // Получаем текущее время
    const now = new Date();
    const inactiveTime = new Date(now);
    inactiveTime.setMinutes(inactiveTime.getMinutes() - 5);

    // Получаем всех пользователей
    const allUsers = await db
      .select({
        id: users.id,
        login: users.login,
        role: users.role,
        last_activity: users.last_activity,
        created_at: users.created_at,
      })
      .from(users)
      .orderBy(desc(users.last_activity));

    // Определяем статус на основе времени последней активности
    const usersWithCorrectStatus = allUsers.map((user) => {
      // Пользователь онлайн, если был активен менее 5 минут назад
      const isOnline =
        user.last_activity && new Date(user.last_activity) >= inactiveTime;

      return {
        ...user,
        is_online: isOnline ? "online" : "offline",
      };
    });

    return {
      status: "success",
      users: usersWithCorrectStatus,
    };
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error);
    return {
      status: "error",
      message: "Ошибка при получении пользователей",
    };
  }
});
