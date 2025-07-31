import { setCookie } from "h3";

export default defineEventHandler((event) => {
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
