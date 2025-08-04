import { db } from "../..";
import { users } from "../../schema";
import { verifyAuth } from "../../utils/jwt";

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

    // Получаем список пользователей для фильтрации
    const usersList = await db
      .select({
        id: users.id,
        username: users.login,
      })
      .from(users)
      .orderBy(users.login);

    return {
      status: "success",
      data: usersList,
    };
  } catch (error) {
    console.error("Ошибка получения списка пользователей:", error);
    return {
      status: "error",
      message: "Ошибка получения списка пользователей",
      data: [],
    };
  }
});
