import { setCookie } from "h3";
import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../utils/jwt";

export default defineEventHandler(async (event) => {
  // Проверяем, кто выходит из системы
  const userData = await verifyAuth(event);

  // Если пользователь был авторизован, устанавливаем статус оффлайн
  if (userData) {
    await db
      .update(users)
      .set({
        is_online: "offline",
      })
      .where(eq(users.id, userData.id));
  }

  // Удаляем токен из куки
  setCookie(event, "auth_token", "", {
    httpOnly: true,
    maxAge: 0, // Истекает немедленно
    path: "/",
    sameSite: "strict",
  });

  return {
    status: "success",
    message: "Выход выполнен успешно",
  };
});
