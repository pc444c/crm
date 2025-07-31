import { defineEventHandler, readBody } from "h3";
import { db } from "../../index";
import { tags } from "../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Проверка наличия ID
    if (!body.id) {
      return {
        status: "error",
        message: "ID тега обязателен",
      };
    }

    // Удаление тега
    const result = await db
      .delete(tags)
      .where(eq(tags.id, body.id))
      .returning({ id: tags.id });

    if (result.length === 0) {
      return {
        status: "error",
        message: "Тег не найден или не может быть удален",
      };
    }

    return {
      status: "success",
      message: "Тег успешно удален",
      deletedId: result[0].id,
    };
  } catch (error) {
    console.error("Ошибка при удалении тега:", error);
    return {
      status: "error",
      message: "Ошибка при удалении тега",
    };
  }
});
