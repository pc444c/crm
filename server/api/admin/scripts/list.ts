import { db, globalScripts } from "../../../schema";
import { desc } from "drizzle-orm";

export default defineEventHandler(async (_event) => {
  try {
    // Получаем все глобальные скрипты для админа (включая неактивные)
    const scripts = await db
      .select()
      .from(globalScripts)
      .orderBy(desc(globalScripts.created_at)); // Сначала новые

    return {
      status: "success",
      scripts,
    };
  } catch (error) {
    console.error("Error fetching global scripts:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
