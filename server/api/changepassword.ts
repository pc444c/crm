import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";

// Хендлер для изменения пароля пользователя
export default defineEventHandler(async (event) => {
  // Получение тела запроса с ID пользователя и новым паролем
  const body = await readBody(event);
  const { id, newPassword } = body;

  // Проверка наличия ID и нового пароля
  if (!id || !newPassword) {
    return {
      status: "error",
      message: "ID пользователя и новый пароль обязательны",
    };
  }

  try {
    // Обновление пароля пользователя по ID
    const result = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    // Проверка успешности обновления
    if (result.length === 0) {
      return {
        status: "error",
        message: "Пользователь не найден или пароль не может быть изменен",
      };
    }

    // Возвращаем успешный ответ
    return {
      status: "success",
      message: "Пароль пользователя успешно изменен",
      updatedId: result[0].id,
    };
  } catch (error) {
    console.error("Ошибка при изменении пароля:", error);
    return {
      status: "error",
      message: "Ошибка при изменении пароля",
    };
  }
});
