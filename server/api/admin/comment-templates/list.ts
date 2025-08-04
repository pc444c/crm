import { db, commentTemplates } from "../../../schema";
import { desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Admin Comment Templates List API ===");
    console.log("Request URL:", getRequestURL(event).pathname);
    console.log("User in context:", event.context.user);

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

    // Получаем все шаблоны комментариев, отсортированные по дате создания (новые сначала)
    const templates = await db
      .select()
      .from(commentTemplates)
      .orderBy(desc(commentTemplates.created_at));

    console.log(`Found ${templates.length} comment templates`);

    return {
      status: "success",
      templates: templates,
    };
  } catch (error) {
    console.error("Error loading comment templates:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
