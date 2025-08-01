import { db } from "../../index";
import { records, tags } from "../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// API для назначения тега записи
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
    const { recordId, tagId } = body;

    // Проверяем обязательные поля
    if (!recordId || !tagId) {
      return {
        status: "error",
        message: "ID записи и ID тега обязательны",
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

    // Получаем текущую запись, чтобы узнать user_id
    const currentRecord = await db
      .select()
      .from(records)
      .where(eq(records.id, recordId))
      .limit(1);

    if (currentRecord.length === 0) {
      return {
        status: "error",
        message: "Запись не найдена",
      };
    }

    // Запоминаем текущего пользователя, который работал с записью
    // const currentUserId = currentRecord[0].user_id;

    // Обновляем запись с новым тегом и сохраняем ID пользователя, который его обработал
    const [updatedRecord] = await db
      .update(records)
      .set({
        tag: tagName,
        status_updated_at: new Date(),
        user_id: userData.id, // Сохраняем ID пользователя, который назначил тег
      })
      .where(eq(records.id, recordId))
      .returning();

    return {
      status: "success",
      message: "Тег успешно назначен",
      record: updatedRecord,
    };
  } catch (error) {
    console.error("Ошибка при назначении тега:", error);
    return {
      status: "error",
      message: "Ошибка при назначении тега",
    };
  }
});
