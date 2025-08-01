import { db } from "../../index";
import { records, tags } from "../../schema";
import { defineEventHandler, getQuery } from "h3";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// API для получения конкретной записи по ID
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
    const recordId = parseInt(query.id as string);

    if (!recordId) {
      return {
        status: "error",
        message: "ID записи обязателен",
      };
    }

    // Получаем запись по ID
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

    const record = recordResult[0];

    // Получаем все теги для дополнительной информации
    const allTags = await db.select().from(tags).execute();

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
      status: "success",
      record: {
        ...record,
        tagInfo,
        tagId: tagInfo ? tagInfo.id : null,
      },
    };
  } catch (error) {
    console.error("Ошибка при получении записи:", error);
    return {
      status: "error",
      message: "Ошибка при получении записи",
    };
  }
});
