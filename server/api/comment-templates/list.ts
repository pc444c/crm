import { db, commentTemplates } from "../../schema";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== User Comment Templates API ===");
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

    // Получаем только активные шаблоны комментариев, отсортированные по дате создания
    const templates = await db
      .select({
        id: commentTemplates.id,
        name: commentTemplates.name,
        content: commentTemplates.content,
      })
      .from(commentTemplates)
      .where(eq(commentTemplates.is_active, "true"))
      .orderBy(desc(commentTemplates.created_at));

    console.log(`Found ${templates.length} active comment templates for user`);

    return {
      status: "success",
      templates: templates,
    };
  } catch (error) {
    console.error("Error loading comment templates for user:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
