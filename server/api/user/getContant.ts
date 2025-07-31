import { db } from "~~/server";
import { users, records, tags } from "~~/server/schema";
import { defineEventHandler, readBody } from "h3";
import { eq, and, asc, or, isNull } from "drizzle-orm";

// Получить запись данных для пользователя
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const userIdRaw = body.userId;
  const skipMarking = body.skipMarking || false; // Параметр для пропуска маркировки

  const userId = Number(userIdRaw);

  // Проверяем корректность ID пользователя
  if (!userId || isNaN(userId)) {
    return {
      success: false,
      error: "Некорректный или отсутствует userId",
    };
  }

  try {
    // Проверяем существование пользователя
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    const user = userResult[0];
    if (!user) {
      return {
        success: false,
        error: "Пользователь не найден",
      };
    }

    // Получаем список всех тегов
    const allTags = await db.select().from(tags).execute();

    // Ищем запись, которая уже назначена пользователю или не использована
    const recordResult = await db
      .select()
      .from(records)
      .where(
        or(
          eq(records.user_id, userId), // Записи уже назначенные пользователю
          and(
            or(isNull(records.tag), eq(records.tag, "no used")),
            isNull(records.user_id)
          ) // Или записи без тега / с тегом "no used" и без назначенного пользователя
        )
      )
      .orderBy(asc(records.created_at))
      .limit(1)
      .execute();

    const record = recordResult[0];

    if (!record) {
      return {
        success: false,
        error: "Нет доступных записей",
      };
    }

    // Если запись не назначена пользователю и не надо пропускать маркировку
    if (!record.user_id && !skipMarking) {
      // Обновляем запись - назначаем пользователя и время использования
      await db
        .update(records)
        .set({
          user_id: userId,
          used_at: new Date(),
          status_updated_at: new Date(),
        })
        .where(eq(records.id, record.id))
        .execute();
    }

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
