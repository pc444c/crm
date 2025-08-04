import { db, globalScripts } from "../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (_event) => {
  try {
    // Получаем все активные глобальные скрипты (доступны всем пользователям)
    const scripts = await db
      .select({
        id: globalScripts.id,
        name: globalScripts.name,
        content: globalScripts.content,
        created_at: globalScripts.created_at,
      })
      .from(globalScripts)
      .where(eq(globalScripts.is_active, "true"))
      .orderBy(globalScripts.created_at);

    return {
      status: "success",
      scripts,
    };
  } catch (error) {
    console.error("Error fetching global scripts for users:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
