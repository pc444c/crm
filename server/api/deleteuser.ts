import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";

// Хендлер для удаления пользователя
export default defineEventHandler(async (event) => {
  // Получение тела запроса с ID пользователя
  const body = await readBody(event);
  const { id } = body;

  // Проверка наличия ID
  if (!id) {
    return {
      status: "error",
      message: "ID пользователя не указан",
    };
  }

  try {
    // Удаление пользователя по ID
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    // Проверка успешности удаления
    if (result.length === 0) {
      return {
        status: "error",
        message: "Пользователь не найден или не может быть удален",
      };
    }

    // Возвращаем успешный ответ
    return {
      status: "success",
      message: "Пользователь успешно удален",
      deletedId: result[0].id,
    };
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
    return {
      status: "error",
      message: "Ошибка при удалении пользователя",
    };
  }
});
