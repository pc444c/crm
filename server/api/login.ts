import { db } from "..";
import { users } from "../schema";
import { readBody, setCookie } from "h3";
import { eq, and } from "drizzle-orm";
import { createToken } from "../utils/jwt";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { login, password } = body;

  if (!login || !password) {
    return {
      status: "error",
      message: "Логин и пароль обязательны",
    };
  }

  const [user] = await db
    .select({
      id: users.id,
      username: users.login,
      role: users.role,
      password: users.password,
    })
    .from(users)
    .where(and(eq(users.login, login), eq(users.password, password)))
    .limit(1);

  if (!user) {
    return {
      status: "error",
      message: "Неверный логин или пароль",
    };
  }

  // Создаем JWT токен с данными пользователя
  const token = createToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  // Устанавливаем токен в куки (httpOnly для безопасности)
  setCookie(event, "auth_token", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 часа
    path: "/",
    sameSite: "strict",
  });

  return {
    status: "success",
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
});
