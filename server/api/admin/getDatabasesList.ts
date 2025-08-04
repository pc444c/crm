import { db } from "../..";
import { databases } from "../../schema";
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

    // Получаем список всех баз данных
    const databasesList = await db.select().from(databases);

    return {
      status: "success",
      data: databasesList.map((database) => ({
        id: database.id,
        name: database.name,
        created_at: database.created_at,
      })),
    };
  } catch (error) {
    console.error("Ошибка получения списка баз данных:", error);
    return {
      status: "error",
      message: "Ошибка получения списка баз данных",
      data: null,
    };
  }
});
