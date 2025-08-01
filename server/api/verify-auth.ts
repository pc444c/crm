import { getCookie } from "h3";
import { verifyToken } from "../utils/jwt";
import { db } from "~~/server";
import { users } from "~~/server/schema";
import { eq } from "drizzle-orm";

// Кэш для пользователей, чтобы уменьшить количество запросов к БД
const userVerifyCache = new Map();
const USER_VERIFY_CACHE_TTL = 30000; // 30 секунд

export default defineEventHandler(async (event) => {
  // Добавляем заголовки для кэширования ответа
  setHeader(event, 'Cache-Control', 'public, max-age=30');
  
  // Получаем токен из куки
  const token = getCookie(event, "auth_token");

  if (!token) {
    return {
      status: "error",
      message: "Не аутентифицирован",
    };
  }

  // Проверяем токен - это быстрая операция, не требует кэширования
  const userData = verifyToken(token);

  if (!userData) {
    return {
      status: "error",
      message: "Недействительный токен",
    };
  }

  // Преобразуем ID в число, если это строка
  const userId =
    typeof userData.id === "string" ? parseInt(userData.id) : userData.id;
    
  // Проверяем кэш для ускорения ответа
  const cacheKey = `verify_user_${userId}`;
  const cachedResult = userVerifyCache.get(cacheKey);
  
  if (cachedResult && (Date.now() - cachedResult.timestamp) < USER_VERIFY_CACHE_TTL) {
    // Возвращаем кэшированный результат
    return cachedResult.result;
  }

  // Проверяем, существует ли пользователь в базе данных
  try {
    // Проверяем существование пользователя в базе
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (!userExists || userExists.length === 0) {
      console.error(`Пользователь с ID ${userId} не найден в базе данных`);
      const result = {
        status: "error",
        message: "Пользователь не существует в системе",
        code: "USER_NOT_EXISTS",
      };
      
      // Кэшируем отрицательный результат
      userVerifyCache.set(cacheKey, { 
        result, 
        timestamp: Date.now() 
      });
      
      return result;
    }

    // Токен действителен и пользователь существует
    const result = {
      status: "success",
      token,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role,
      },
    };
    
    // Кэшируем положительный результат
    userVerifyCache.set(cacheKey, { 
      result, 
      timestamp: Date.now() 
    });
    
    return result;
  } catch (error) {
    console.error("Ошибка при проверке пользователя в базе данных:", error);
    return {
      status: "error",
      message: "Ошибка проверки данных пользователя",
    };
  }
});
