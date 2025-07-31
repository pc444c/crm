import { getCookie } from "h3";
import { verifyToken } from "../utils/jwt";
import { db } from "~~/server";
import { users } from "~~/server/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  // Получаем токен из куки
  const token = getCookie(event, "auth_token");

  if (!token) {
    return {
      status: "error",
      message: "Не аутентифицирован",
    };
  }

  // Проверяем токен
  const userData = verifyToken(token);

  if (!userData) {
    return {
      status: "error",
      message: "Недействительный токен",
    };
  }

  // Проверяем, существует ли пользователь в базе данных
  try {
    // Преобразуем ID в число, если это строка
    const userId =
      typeof userData.id === "string" ? parseInt(userData.id) : userData.id;

    // Проверяем существование пользователя в базе
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (!userExists || userExists.length === 0) {
      console.error(`Пользователь с ID ${userId} не найден в базе данных`);
      return {
        status: "error",
        message: "Пользователь не существует в системе",
        code: "USER_NOT_EXISTS",
      };
    }

    // Токен действителен и пользователь существует, возвращаем данные пользователя
    return {
      status: "success",
      token,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role,
      },
    };
  } catch (error) {
    console.error("Ошибка при проверке пользователя в базе данных:", error);
    return {
      status: "error",
      message: "Ошибка проверки данных пользователя",
    };
  }
});
