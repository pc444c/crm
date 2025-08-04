import { db, commentTemplates } from "../../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Admin Comment Templates Delete API ===");
    console.log("Request URL:", getRequestURL(event).pathname);
    console.log("User in context:", event.context.user);

    const query = getQuery(event);
    const templateId = parseInt(query.id as string);

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
    if (!templateId || isNaN(templateId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Valid template ID is required",
      });
    }

    // Проверяем, существует ли шаблон
    const existingTemplate = await db
      .select()
      .from(commentTemplates)
      .where(eq(commentTemplates.id, templateId))
      .limit(1);

    if (existingTemplate.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Template not found",
      });
    }

    // Удаляем шаблон
    await db
      .delete(commentTemplates)
      .where(eq(commentTemplates.id, templateId));

    console.log("Template deleted successfully:", templateId);

    return {
      status: "success",
      message: "Template deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting comment template:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
