import { db } from "../../..";
import { databases, teamDatabases } from "../../../schema";
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

    if (!databaseId || isNaN(Number(databaseId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Valid database ID is required",
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

    console.log(
      `Удаление базы данных ${databaseId}: ${existingDatabase[0].name}`
    );

    // Сначала удаляем все связи команд с этой базой данных
    await db
      .delete(teamDatabases)
      .where(eq(teamDatabases.database_id, Number(databaseId)));

    // Затем удаляем саму базу данных
    await db.delete(databases).where(eq(databases.id, Number(databaseId)));

    console.log(`База данных ${databaseId} успешно удалена`);

    return {
      status: "success",
      message: "Database deleted successfully",
    };
  } catch (error) {
    console.error("Ошибка при удалении базы данных:", error);
    throw error;
  }
});
