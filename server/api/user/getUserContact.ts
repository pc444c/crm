import { db } from "~~/server";
import { users, records } from "~~/server/schema";
import { defineEventHandler, readBody, createError } from "h3";
import { eq, and, asc } from "drizzle-orm";

// получить все recods пользователя

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const userIdRaw = body.userId;

  const userId = Number(userIdRaw);

  if (!userId || isNaN(userId)) {
    throw createError({ statusCode: 400, message: "Некорректный или отсутствует userId" });
  }

  // теперь userId безопасный number
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId)) // ожидает число
    .execute();

  // Проверяем, существует ли пользователь
  const user = userResult[0];

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Пользователь не найден",
    });
  }

  // Получаем первую запись пользователя со статусом 'no used'
  const recordResult = await db
    .select()
    .from(records)
    // ищем по id пользователя 
    .where(and(eq(records.user_id, userId)))
    .orderBy(asc(records.created_at))
    .execute();

//   проверяем, есть ли записи
  if (recordResult.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Нет доступных записей",
    });
  }
// возвращаем все записи пользователя польностью

    
});