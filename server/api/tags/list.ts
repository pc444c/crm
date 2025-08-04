import { db } from "../../index";
import { tags, users } from "../../schema";
import { asc, eq } from "drizzle-orm";

// API для получения списка тегов для пользователей
export default defineEventHandler(async (event) => {
  try {
    // Проверяем, аутентифицирован ли пользователь
    const user = event.context.user;
    if (!user) {
      return {
        status: "error",
        message: "Доступ запрещен",
      };
    }

    // Дополнительно проверяем существование пользователя в базе данных
    const userId = typeof user.id === "string" ? parseInt(user.id) : user.id;
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!dbUser || dbUser.length === 0) {
      return {
        status: "error",
        message: "Пользователь не существует в системе",
        code: "USER_NOT_EXISTS",
      };
    }

    // Получаем список всех тегов
    const result = await db.select().from(tags).orderBy(asc(tags.created_at));

    return result;
  } catch (error) {
    console.error("Ошибка при получении списка тегов:", error);
    return {
      status: "error",
      message: "Ошибка при получении списка тегов",
    };
  }
});
