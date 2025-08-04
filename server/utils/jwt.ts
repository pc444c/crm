import jwt from "jsonwebtoken";
import { getCookie } from "h3";

// Типы для пользовательских данных в токене
export interface TokenPayload {
  id: number;
  username: string;
  role: string;
  [key: string]: any; // Разрешаем дополнительные поля
}

// Секретный ключ для подписи JWT токенов
// В реальном приложении следует хранить его в переменных окружения
const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

// Срок действия токена (по умолчанию - 24 часа)
const TOKEN_EXPIRATION = "24h";

// Кэш для верификации токенов
const tokenVerifyCache = new Map<
  string,
  { payload: TokenPayload; timestamp: number }
>();
const TOKEN_CACHE_TTL = 60000; // 1 минута

/**
 * Создает JWT токен для пользователя
 * @param payload Данные пользователя для включения в токен
 * @returns JWT токен
 */
export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRATION });
}

/**
 * Проверяет JWT токен и возвращает его содержимое с кэшированием результата
 * @param token JWT токен
 * @returns Данные пользователя или null, если токен недействителен
 */
export function verifyToken(token: string): TokenPayload | null {
  // Проверяем кэш
  const cachedResult = tokenVerifyCache.get(token);
  if (cachedResult && Date.now() - cachedResult.timestamp < TOKEN_CACHE_TTL) {
    return cachedResult.payload;
  }

  try {
    // Проверяем токен и кэшируем результат
    const payload = jwt.verify(token, SECRET_KEY) as TokenPayload;
    tokenVerifyCache.set(token, {
      payload,
      timestamp: Date.now(),
    });
    return payload;
  } catch (_error) {
    return null;
  }
}

/**
 * Декодирует JWT токен без проверки подписи
 * @param token JWT токен
 * @returns Декодированные данные пользователя или null при ошибке
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch (_error) {
    return null;
  }
}

/**
 * Проверяет авторизацию пользователя по cookies
 * @param event H3Event объект
 * @returns Данные авторизованного пользователя или null
 */
export function verifyAuth(event: any): TokenPayload | null {
  // Получаем токен из cookie
  const token = getCookie(event, "auth_token");
  if (!token) return null;

  // Проверяем токен
  return verifyToken(token);
}
