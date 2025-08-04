import { db, globalScripts } from "../../../schema";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Admin Scripts Create API ===");
    console.log("Request URL:", getRequestURL(event).pathname);
    console.log("User in context:", event.context.user);
    console.log("Cookies:", parseCookies(event));

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

    // Проверяем, что это админ (дополнительная проверка, хотя middleware уже проверил)
    if (user.role !== "admin") {
      console.log("User is not admin:", user.role);
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied. Admin role required.",
      });
    } // Валидация
    if (!name || !content) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name and content are required",
      });
    }

    if (name.length > 255) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name too long",
      });
    }

    if (content.length > 10000) {
      throw createError({
        statusCode: 400,
        statusMessage: "Content too long",
      });
    }

    // Создаем глобальный скрипт
    const [newScript] = await db
      .insert(globalScripts)
      .values({
        name,
        content,
        created_by: user.id,
      })
      .returning();

    return {
      status: "success",
      script: newScript,
    };
  } catch (error: any) {
    console.error("Error creating global script:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
