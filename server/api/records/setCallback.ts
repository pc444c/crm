import { db } from "../../index";
import { records, tags } from "../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// API для назначения перезвона
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

    const body = await readBody(event);
    const { recordId, tagId, callbackTime, comment } = body;

    // Проверяем обязательные поля
    if (!recordId || !tagId || !callbackTime) {
      return {
        status: "error",
        message: "ID записи, ID тега и время перезвона обязательны",
      };
    }

    // Получаем тег для получения имени
    const tagResult = await db
      .select()
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (tagResult.length === 0) {
      return {
        status: "error",
        message: "Тег не найден",
      };
    }

    const tagName = tagResult[0].name;

    // Получаем запись для проверки существования
    const recordResult = await db
      .select()
      .from(records)
      .where(eq(records.id, recordId))
      .limit(1);

    if (recordResult.length === 0) {
      return {
        status: "error",
        message: "Запись не найдена",
      };
    }

    // Обновляем запись с новым тегом, временем перезвона и комментарием
    const updateData: {
      tag: string;
      callback_time: Date;
      status_updated_at: Date;
      user_id: number;
      description?: string;
    } = {
      tag: tagName,
      callback_time: new Date(callbackTime),
      status_updated_at: new Date(),
      user_id: userData.id,
    };

    // Если есть комментарий, добавляем его
    if (comment) {
      updateData.description = comment;
    }

    const [updatedRecord] = await db
      .update(records)
      .set(updateData)
      .where(eq(records.id, recordId))
      .returning();

    return {
      status: "success",
      message: "Перезвон успешно назначен",
      record: updatedRecord,
    };
  } catch (error) {
    console.error("Ошибка при назначении перезвона:", error);
    return {
      status: "error",
      message: "Ошибка при назначении перезвона",
    };
  }
});
