import { db } from "../..";
import { records } from "../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    return {
      status: "error",
      message: "Доступ запрещен",
    };
  }

  const body = await readBody(event);
  const { recordId, comment } = body;

  if (!recordId) {
    return {
      status: "error",
      message: "Не указан ID записи",
    };
  }

  try {
    // Проверяем, существует ли запись и назначена ли она пользователю
    const recordResult = await db
      .select()
      .from(records)
      .where(eq(records.id, recordId))
      .execute();

    if (recordResult.length === 0) {
      return {
        status: "error",
        message: "Запись не найдена",
      };
    }

    const record = recordResult[0];

    // Обновляем комментарий
    await db
      .update(records)
      .set({
        description: comment,
        status_updated_at: new Date(),
      })
      .where(eq(records.id, recordId))
      .execute();

    return {
      status: "success",
      message: "Комментарий успешно обновлен",
    };
  } catch (error) {
    console.error("Ошибка при обновлении комментария:", error);
    return {
      status: "error",
      message: "Произошла ошибка при обновлении комментария",
    };
  }
});
