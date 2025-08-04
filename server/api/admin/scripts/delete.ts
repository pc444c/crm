import { db, globalScripts } from "../../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Admin Scripts Delete API ===");
    console.log("Request URL:", getRequestURL(event).pathname);
    console.log("User in context:", event.context.user);

    const query = getQuery(event);
    const id = query.id;

    // Получаем пользователя из контекста (установлен middleware)
    const user = event.context.user;

    if (!user) {
      console.log("No user in context");
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    console.log("User found:", user);

    // Проверяем, что это админ
    if (user.role !== "admin") {
      console.log("User is not admin:", user.role);
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied. Admin role required.",
      });
    }

    // Валидация
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Script ID is required",
      });
    }

    // Удаляем скрипт
    const [deletedScript] = await db
      .delete(globalScripts)
      .where(eq(globalScripts.id, Number(id)))
      .returning();

    if (!deletedScript) {
      throw createError({
        statusCode: 404,
        statusMessage: "Script not found",
      });
    }

    return {
      status: "success",
      message: "Script deleted successfully",
      script: deletedScript,
    };
  } catch (error: any) {
    console.error("Error deleting global script:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
