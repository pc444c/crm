import { db } from "../..";
import { records, tags } from "../../schema";
import { eq, and, asc, or, isNull } from "drizzle-orm";

// Получить следующую запись данных для пользователя и обновить текущую
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { userId, currentRecordId, newTag } = body;

  // Проверяем параметры
  if (!userId || isNaN(Number(userId))) {
    return {
      success: false,
      error: "Некорректный идентификатор пользователя",
    };
  }

  const userIdNum = Number(userId);

  try {
    // Если есть текущая запись и новый тег, обновляем её
    if (currentRecordId && newTag) {
      // Получаем информацию о теге (для будущего использования, если потребуется)
      // const tagResult = await db
      //   .select()
      //   .from(tags)
      //   .where(eq(tags.name, newTag))
      //   .execute();

      // Обновляем запись с новым тегом и сохраняем ID пользователя
      await db
        .update(records)
        .set({
          tag: newTag,
          user_id: userIdNum, // Сохраняем ID пользователя, который назначил тег
          status_updated_at: new Date(),
        })
        .where(eq(records.id, currentRecordId))
        .execute();
    }

    // Получаем все теги для дополнительной информации
    const allTags = await db.select().from(tags).execute();

    // Ищем следующую доступную запись со статусом "no used"
    const recordResult = await db
      .select()
      .from(records)
      .where(
        and(
          or(isNull(records.tag), eq(records.tag, "no used")),
          isNull(records.user_id)
        )
      )
      .orderBy(asc(records.created_at))
      .limit(1)
      .execute();

    if (recordResult.length === 0) {
      return {
        success: false,
        error: "Нет доступных записей",
      };
    }

    const record = recordResult[0];

    // Назначаем пользователя для новой записи
    await db
      .update(records)
      .set({
        user_id: userIdNum,
        used_at: new Date(),
        tag: "user", // Устанавливаем тег "user", когда запись назначается пользователю
        status_updated_at: new Date(),
      })
      .where(eq(records.id, record.id))
      .execute();

    // Находим соответствующий тег, если он есть
    let tagInfo = null;
    if (record.tag) {
      const tagMatch = allTags.find((t) => t.name === record.tag);
      if (tagMatch) {
        tagInfo = {
          id: tagMatch.id,
          name: tagMatch.name,
          color: tagMatch.color,
        };
      }
    }

    // Возвращаем найденную запись с дополнительной информацией о теге
    return {
      success: true,
      record: {
        ...record,
        tagInfo,
        tagId: tagInfo ? tagInfo.id : null,
      },
    };
  } catch (error) {
    console.error("Ошибка при получении записи:", error);
    return {
      success: false,
      error: "Ошибка при получении записи",
    };
  }
});
