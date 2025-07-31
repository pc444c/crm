import { db } from "~~/server";
import { users, records, tags } from "~~/server/schema";
import { eq, sql, and, gte, lte, asc, desc } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  try {
    // Получаем параметры из тела запроса
    const body = await readBody(event);
    const {
      userId,
      limit = 50,
      offset = 0,
      filterStatus,
      sortBy = "status_updated_at",
      sortOrder = "desc",
      dateFrom,
      dateTo,
    } = body;

    if (!userId) {
      return {
        success: false,
        error: "ID пользователя не указан",
      };
    }

    // Проверка валидности ID пользователя
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return {
        success: false,
        error: "Некорректный ID пользователя",
      };
    }

    // Получаем все доступные теги
    const tagsList = await db.select().from(tags).execute();

    // Строим условия для запроса
    const conditions = [eq(records.user_id, userIdNum)];

    // Добавляем фильтр по статусу, если указан
    if (filterStatus) {
      conditions.push(eq(records.tag, filterStatus));
    }

    // Добавляем фильтрацию по дате, если указано
    if (dateFrom) {
      conditions.push(gte(records.status_updated_at, new Date(dateFrom)));
    }

    if (dateTo) {
      // Добавляем 1 день к конечной дате, чтобы включить весь день
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(records.status_updated_at, endDate));
    }

    // Строим базовый запрос с условиями
    // В Drizzle ORM нужно сразу определить сортировку
    let query;

    // Применяем сортировку в зависимости от выбранного поля
    if (sortBy === "dateAssign") {
      query = db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(
          sortOrder === "desc" ? desc(records.used_at) : asc(records.used_at)
        );
    } else if (sortBy === "fio") {
      query = db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(sortOrder === "desc" ? desc(records.fio) : asc(records.fio));
    } else if (sortBy === "phone") {
      query = db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(
          sortOrder === "desc" ? desc(records.phone) : asc(records.phone)
        );
    } else {
      // По умолчанию сортировка по дате статуса
      query = db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(
          sortOrder === "desc"
            ? desc(records.status_updated_at)
            : asc(records.status_updated_at)
        );
    }

    // Выполняем запрос с пагинацией
    const recordsList = await query
      .limit(parseInt(limit.toString()))
      .offset(parseInt(offset.toString()))
      .execute();

    // Получаем общее количество записей для пагинации
    const countQuery = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(records)
      .where(eq(records.user_id, userIdNum));

    const total = countQuery[0]?.count || 0;

    // Обогащаем записи информацией о тегах
    const enrichedRecords = recordsList.map((record) => {
      const tagInfo = tagsList.find((tag) => tag.name === record.tag);
      return {
        ...record,
        tagInfo: tagInfo
          ? {
              id: tagInfo.id,
              name: tagInfo.name,
              color: tagInfo.color,
              about: tagInfo.about,
            }
          : null,
      };
    });

    return {
      success: true,
      records: enrichedRecords,
      total,
      tags: tagsList,
    };
  } catch (error) {
    console.error("Ошибка при получении списка звонков:", error);
    return {
      success: false,
      error: "Ошибка при получении списка звонков",
    };
  }
});
