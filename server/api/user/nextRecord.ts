import { db } from "../..";
import { records, tags } from "../../schema";
import { eq, and, asc, isNull } from "drizzle-orm";

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
      // Устанавливаем финальный тег для записи
      await db
        .update(records)
        .set({
          tag: newTag,
          status_updated_at: new Date(),
        })
        .where(eq(records.id, currentRecordId))
        .execute();
    }

    // Получаем все теги для дополнительной информации
    const allTags = await db.select().from(tags).execute();

    // Сначала ищем записи со статусом "used" для этого пользователя (приоритет)
    let recordResult = await db
      .select()
      .from(records)
      .where(and(eq(records.tag, "used"), eq(records.user_id, userIdNum)))
      .orderBy(asc(records.used_at))
      .limit(1)
      .execute();

    // Если нет записей "used" для этого пользователя, ищем новые записи "no used"
    if (recordResult.length === 0) {
      recordResult = await db
        .select()
        .from(records)
        .where(and(eq(records.tag, "no used"), isNull(records.user_id)))
        .orderBy(asc(records.created_at))
        .limit(1)
        .execute();

      // Если нашли новую запись, назначаем её пользователю
      if (recordResult.length > 0) {
        const record = recordResult[0];
        await db
          .update(records)
          .set({
            user_id: userIdNum,
            tag: "used",
            used_at: new Date(),
            status_updated_at: new Date(),
          })
          .where(eq(records.id, record.id))
          .execute();

        // Обновляем локальный объект
        record.tag = "used";
        record.user_id = userIdNum;
      }
    }

    if (recordResult.length === 0) {
      return {
        success: false,
        error: "Нет доступных записей",
      };
    }

    const record = recordResult[0];

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
