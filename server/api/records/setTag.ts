import { db } from "../../index";
import { records, tags } from "../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq } from "drizzle-orm";

// API для назначения тега записи
export default defineEventHandler(async (event) => {
  try {
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

    // БУДУЩЕЕ УЛУЧШЕНИЕ: Если добавим поле processed_by в схему records,
    // мы сможем сохранять ID пользователя, который обработал запись:
    //
    // const currentRecord = await db
    //  .select()
    //  .from(records)
    //  .where(eq(records.id, recordId))
    //  .limit(1);
    // const currentUserId = currentRecord[0].user_id;
    // Добавить в set: processed_by: currentUserId

    // Обновляем запись с новым тегом и освобождаем её от пользователя
    const [updatedRecord] = await db
      .update(records)
      .set({
        tag: tagName,
        status_updated_at: new Date(),
        user_id: null, // Освобождаем запись от пользователя
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
