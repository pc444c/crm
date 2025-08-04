import { db } from "../..";
import { tags } from "../../schema";

export default defineEventHandler(async (event) => {
  try {
    // Получаем все теги из базы данных
    const tagsList = await db.select().from(tags);

    // Проверяем наличие данных
    if (!tagsList || tagsList.length === 0) {
      console.log('Список тегов пуст');
      return {
        status: "warning",
        message: "Список тегов пуст",
        data: []
      };
    }

    console.log('Получены теги:', tagsList);

    // Возвращаем список тегов
    return {
      status: "success",
      message: "Список тегов успешно получен",
      data: tagsList
    };
  } catch (error) {
    console.error("Ошибка при получении списка тегов:", error);
    return {
      status: "error",
      message: "Ошибка при получении списка тегов",
      error: String(error)
    };
  }
});
