import { db } from "../../index";
import { records, tags } from "../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq } from "drizzle-orm";

// API для получения записей по тегу или фильтрации
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { tagId, searchQuery, limit = 100, offset = 0 } = body;

    // Получаем имя тега, если указан tagId
    let tagName = null;
    if (tagId) {
      const tagResult = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tagId))
        .execute();

      if (tagResult.length > 0) {
        tagName = tagResult[0].name;
      }
    }

    // Базовый запрос без фильтров
    let results = await db.select().from(records).execute();

    // Фильтрация по тегу, если необходимо
    if (tagName) {
      results = results.filter((record) => record.tag === tagName);
    }

    // Фильтрация по поисковому запросу, если необходимо
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (record) =>
          (record.fio && record.fio.toLowerCase().includes(query)) ||
          (record.phone && record.phone.toLowerCase().includes(query)) ||
          (record.city && record.city.toLowerCase().includes(query)) ||
          (record.address && record.address.toLowerCase().includes(query)) ||
          (record.description &&
            record.description.toLowerCase().includes(query))
      );
    }

    // Общее количество после фильтрации
    const totalCount = results.length;

    // Применяем пагинацию
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      status: "success",
      data: paginatedResults,
      pagination: {
        total: totalCount,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error("Ошибка при получении записей по тегу:", error);
    return {
      status: "error",
      message: "Ошибка при получении записей по тегу",
    };
  }
});
