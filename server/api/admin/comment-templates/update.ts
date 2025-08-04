import { db, commentTemplates } from "../../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Admin Comment Templates Update API ===");
    console.log("Request URL:", getRequestURL(event).pathname);
    console.log("User in context:", event.context.user);

    const body = await readBody(event);
    const { id, name, content, is_active } = body;

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
        statusMessage: "Template ID is required",
      });
    }

    // Подготавливаем данные для обновления
    const updateData: Record<string, string | Date> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        throw createError({
          statusCode: 400,
          statusMessage: "Name cannot be empty",
        });
      }
      if (name.length > 255) {
        throw createError({
          statusCode: 400,
          statusMessage: "Name too long",
        });
      }
      updateData.name = name.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        throw createError({
          statusCode: 400,
          statusMessage: "Content cannot be empty",
        });
      }
      if (content.length > 1000) {
        throw createError({
          statusCode: 400,
          statusMessage: "Content too long",
        });
      }
      updateData.content = content.trim();
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active ? "true" : "false";
    }

    updateData.updated_at = new Date();

    // Обновляем шаблон
    const [updatedTemplate] = await db
      .update(commentTemplates)
      .set(updateData)
      .where(eq(commentTemplates.id, id))
      .returning();

    if (!updatedTemplate) {
      throw createError({
        statusCode: 404,
        statusMessage: "Template not found",
      });
    }

    return {
      status: "success",
      template: updatedTemplate,
    };
  } catch (error) {
    console.error("Error updating comment template:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
