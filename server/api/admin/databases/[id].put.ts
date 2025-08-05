import { db } from "../../..";
import { databases } from "../../../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  // Проверка прав доступа - должен быть администратор
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied. Admin role required.",
    });
  }

  try {
    const databaseId = getRouterParam(event, "id");
    const { name } = await readBody(event);

    if (!databaseId || isNaN(Number(databaseId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Valid database ID is required",
      });
    }

    if (!name || !name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Database name is required",
      });
    }

    // Проверяем, существует ли база данных
    const existingDatabase = await db
      .select()
      .from(databases)
      .where(eq(databases.id, Number(databaseId)))
      .limit(1);

    if (existingDatabase.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Database not found",
      });
    }

    // Проверяем, не существует ли уже база данных с таким именем
    const duplicateDatabase = await db
      .select()
      .from(databases)
      .where(eq(databases.name, name.trim()))
      .limit(1);

    if (
      duplicateDatabase.length > 0 &&
      duplicateDatabase[0].id !== Number(databaseId)
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "Database with this name already exists",
      });
    }

    // Обновляем базу данных
    await db
      .update(databases)
      .set({
        name: name.trim(),
      })
      .where(eq(databases.id, Number(databaseId)));

    console.log(`База данных ${databaseId} переименована в: ${name.trim()}`);

    return {
      status: "success",
      message: "Database updated successfully",
    };
  } catch (error) {
    console.error("Ошибка при обновлении базы данных:", error);
    throw error;
  }
});
