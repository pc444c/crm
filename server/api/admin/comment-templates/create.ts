import { db, commentTemplates } from "../../../schema";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Admin Comment Templates Create API ===");
    console.log("Request URL:", getRequestURL(event).pathname);
    console.log("User in context:", event.context.user);

    const body = await readBody(event);
    const { name, content } = body;

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
    if (!name || !name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Template name is required",
      });
    }

    if (!content || !content.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Template content is required",
      });
    }

    if (name.length > 255) {
      throw createError({
        statusCode: 400,
        statusMessage: "Template name too long",
      });
    }

    if (content.length > 1000) {
      throw createError({
        statusCode: 400,
        statusMessage: "Template content too long",
      });
    }

    // Создаем новый шаблон
    const [newTemplate] = await db
      .insert(commentTemplates)
      .values({
        name: name.trim(),
        content: content.trim(),
        created_by: user.id,
        is_active: "true",
      })
      .returning();

    console.log("Template created successfully:", newTemplate);

    return {
      status: "success",
      template: newTemplate,
    };
  } catch (error) {
    console.error("Error creating comment template:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
