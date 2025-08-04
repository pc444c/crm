import { defineEventHandler, readBody } from "h3";
import { db } from "../../index";
import { tags } from "../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Проверка обязательных полей
    if (!body.id || !body.name || !body.color) {
      return {
        status: "error",
        message: "ID, название и цвет тега обязательны",
      };
    }

    // Обновление тега
    const [updatedTag] = await db
      .update(tags)
      .set({
        name: body.name,
        about: body.about || null,
        color: body.color,
      })
      .where(eq(tags.id, body.id))
      .returning();

    if (!updatedTag) {
      return {
        status: "error",
        message: "Тег не найден",
      };
    }

    return {
      status: "success",
      message: "Тег успешно обновлен",
      tag: updatedTag,
    };
  } catch (error) {
    console.error("Ошибка при обновлении тега:", error);
    return {
      status: "error",
      message: "Ошибка при обновлении тега",
    };
  }
});
