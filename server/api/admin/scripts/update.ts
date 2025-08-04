import { db, globalScripts } from "../../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Admin Scripts Update API ===");
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
        statusMessage: "Script ID is required",
      });
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};

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
      if (content.length > 10000) {
        throw createError({
          statusCode: 400,
          statusMessage: "Content too long",
        });
      }
      updateData.content = content;
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active ? "true" : "false";
    }

    updateData.updated_at = new Date();

    // Обновляем скрипт
    const [updatedScript] = await db
      .update(globalScripts)
      .set(updateData)
      .where(eq(globalScripts.id, id))
      .returning();

    if (!updatedScript) {
      throw createError({
        statusCode: 404,
        statusMessage: "Script not found",
      });
    }

    return {
      status: "success",
      script: updatedScript,
    };
  } catch (error: any) {
    console.error("Error updating global script:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
