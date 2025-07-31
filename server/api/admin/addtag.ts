import { defineEventHandler, readBody } from "h3";
import { db } from "../../index";
import { tags } from "../../schema";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Проверка обязательных полей
    if (!body.name || !body.color) {
      return {
        status: "error",
        message: "Название и цвет тега обязательны",
      };
    }

    // Создание нового тега
    const [newTag] = await db
      .insert(tags)
      .values({
        name: body.name,
        about: body.about || null,
        color: body.color,
      })
      .returning();

    return {
      status: "success",
      message: "Тег успешно добавлен",
      tag: newTag,
    };
  } catch (error) {
    console.error("Ошибка при добавлении тега:", error);
    return {
      status: "error",
      message: "Ошибка при добавлении тега",
    };
  }
});
