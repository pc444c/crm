import { verifyToken } from "../utils/jwt";
import { getCookie, createError, getHeader } from "h3";
import { db } from "~~/server";
import { users } from "~~/server/schema";
import { eq } from "drizzle-orm";

// Кэш для пользователей, чтобы уменьшить количество запросов к БД
const userCache = new Map();
const USER_CACHE_TTL = 60000; // 1 минута в миллисекундах

// Маршруты, требующие роли администратора
const adminRoutes = [
  "/api/admin/",
  "/api/deleteuser",
  "/api/deletedb",
  "/api/loadnewdb",
  "/api/adduser",
];

// Маршруты, требующие аутентификации (любая роль)
const authRoutes = [
  "/api/user/",
  "/api/records/",
  "/api/tags/",
  "/api/comment-templates/",
  "/api/changepassword",
  "/api/basesinfo",
  "/api/dbtest",
];

// Открытые маршруты (не требуют аутентификации)
const publicRoutes = ["/api/login", "/api/verify-auth", "/api/logout"];

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  // Добавим логирование для админских маршрутов
  if (path.startsWith("/api/admin/")) {
    console.log("=== Auth Middleware ===");
    console.log("Path:", path);
    console.log("Cookies:", parseCookies(event));
  }

  // Пропускаем открытые маршруты
  if (publicRoutes.some((route) => path.startsWith(route))) {
    return;
  }

  // Получаем токен из куки
  const token = getCookie(event, "auth_token");

  // Если маршрут требует аутентификации
  if (
    authRoutes.some((route) => path.startsWith(route)) ||
    adminRoutes.some((route) => path.startsWith(route))
  ) {
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Authentication required",
      });
    }

    // Проверяем токен
    const user = verifyToken(token);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Invalid or expired token",
      });
    }

    // Проверяем наличие пользователя в кэше
    const cacheKey = `user_${user.id}`;
    let dbUser;
    const cachedUser = userCache.get(cacheKey);

    if (cachedUser && Date.now() - cachedUser.timestamp < USER_CACHE_TTL) {
      // Используем кэшированные данные
      dbUser = cachedUser.data;
    } else {
      // Если нет в кэше или кэш устарел, запрашиваем из БД
      dbUser = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      // Сохраняем в кэш с временной меткой
      if (dbUser && dbUser.length > 0) {
        userCache.set(cacheKey, {
          data: dbUser,
          timestamp: Date.now(),
        });
      }
    }

    if (!dbUser || dbUser.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: "User not found",
        message: "Пользователь не существует в системе",
        data: { errorCode: "USER_NOT_EXISTS" },
      });
    }

    // Проверяем заголовок X-Role для дополнительной проверки
    const roleHeader = getHeader(event, "X-Role");

    // Если маршрут требует прав администратора
    if (adminRoutes.some((route) => path.startsWith(route))) {
      if (user.role !== "admin") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          message: "Admin privileges required",
        });
      }

      // Если в заголовке явно указана роль admin, проверяем соответствие
      if (roleHeader === "admin" && user.role !== "admin") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          message: "Admin privileges required for this request",
        });
      }
    }

    // Если в заголовке явно указана роль user, проверяем соответствие
    if (roleHeader === "user" && !["user", "admin"].includes(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "User privileges required for this request",
      });
    }

    // Добавляем пользователя в контекст события для использования в обработчиках
    event.context.user = user;
  }
});
