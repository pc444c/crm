import { getCookie } from "h3";
import { verifyToken } from "../utils/jwt";

export default defineEventHandler((event) => {
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

  // Токен действителен, возвращаем данные пользователя
  return {
    status: "success",
    token,
    user: {
      id: userData.id,
      username: userData.username,
      role: userData.role,
    },
  };
});
