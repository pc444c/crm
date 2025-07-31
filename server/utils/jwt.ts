import jwt from "jsonwebtoken";

// Типы для пользовательских данных в токене
export interface TokenPayload {
  id: number;
  username: string;
  role: string;
  [key: string]: any; // Разрешаем дополнительные поля
}

// Секретный ключ для подписи JWT токенов
// В реальном приложении следует хранить его в переменных окружения
const SECRET_KEY = "your-secret-key-should-be-stored-in-env-file";

// Срок действия токена (по умолчанию - 24 часа)
const TOKEN_EXPIRATION = "24h";

/**
 * Создает JWT токен для пользователя
 * @param payload Данные пользователя для включения в токен
 * @returns JWT токен
 */
export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRATION });
}

/**
 * Проверяет JWT токен и возвращает его содержимое
 * @param token JWT токен
 * @returns Данные пользователя или null, если токен недействителен
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as TokenPayload;
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
