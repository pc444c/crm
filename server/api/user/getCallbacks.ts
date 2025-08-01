import { db } from "../../index";
import { records } from "../../schema";
import { defineEventHandler, getQuery } from "h3";
import { and, eq, gte, isNotNull, asc } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// API для получения списка перезвонов пользователя
export default defineEventHandler(async (event) => {
  try {
    // Получаем информацию об авторизованном пользователе
    const userData = await verifyAuth(event);

    if (!userData) {
      return {
        status: "error",
        message: "Не авторизован",
        code: 401,
      };
    }

    const query = getQuery(event);
    const showAll = query.showAll === "true"; // Показать все перезвоны или только предстоящие

    // Строим условия запроса
    const whereConditions = [
      eq(records.user_id, userData.id),
      eq(records.tag, "ПЕРЕЗВОН"),
      isNotNull(records.callback_time),
    ];

    // Если не показываем все, то только будущие перезвоны
    if (!showAll) {
      whereConditions.push(gte(records.callback_time, new Date()));
    }

    // Получаем записи с перезвонами
    const callbackRecords = await db
      .select()
      .from(records)
      .where(and(...whereConditions))
      .orderBy(asc(records.callback_time))
      .execute();

    return {
      status: "success",
      data: callbackRecords,
      total: callbackRecords.length,
    };
  } catch (error) {
    console.error("Ошибка при получении перезвонов:", error);
    return {
      status: "error",
      message: "Ошибка при получении перезвонов",
    };
  }
});
