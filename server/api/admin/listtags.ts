import { defineEventHandler } from "h3";
import { db } from "../../index";
import { tags } from "../../schema";

export default defineEventHandler(async (_event) => {
  console.log("API: Запрос на получение списка тегов");

  try {
    console.log("API: Выполняем запрос к БД");
    const result = await db.select().from(tags).orderBy(tags.created_at);

    console.log(`API: Получено ${result.length} тегов`);
    if (result.length > 0) {
      console.log(
        "API: Пример первого тега:",
        JSON.stringify(result[0], null, 2)
      );
    }

    return result;
  } catch (error) {
    console.error("API: Ошибка при получении списка тегов:", error);
    return {
      status: "error",
      message: "Ошибка при получении списка тегов",
    };
  }
});
