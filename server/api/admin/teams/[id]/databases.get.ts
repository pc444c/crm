import { db } from "../../../../";
import { teamDatabases, databases } from "../../../../schema";
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

  const teamId = Number(event.context.params?.id);
  if (!teamId || isNaN(teamId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid team ID",
    });
  }

  try {
    console.log("API: Запрос списка баз данных для команды:", teamId);

    // Получаем все базы данных
    const allDatabases = await db
      .select({
        id: databases.id,
        name: databases.name,
        created_at: databases.created_at,
      })
      .from(databases);

    // Получаем все базы данных, к которым есть доступ у команды
    const teamAccessDatabases = await db
      .select({ database_id: teamDatabases.database_id })
      .from(teamDatabases)
      .where(eq(teamDatabases.team_id, teamId));

    const accessDatabaseIds = new Set(
      teamAccessDatabases.map((db) => db.database_id)
    );

    // Формируем итоговый список баз с признаком наличия доступа
    const databasesWithAccess = allDatabases.map((db) => ({
      ...db,
      hasAccess: accessDatabaseIds.has(db.id),
    }));

    console.log(
      "API: Найдено баз данных:",
      allDatabases.length,
      "из них с доступом:",
      teamAccessDatabases.length
    );

    return {
      status: "success",
      message: "Список баз данных с информацией о доступе успешно получен",
      databases: databasesWithAccess,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Ошибка при получении баз данных команды ${teamId}:`,
      errorMessage
    );

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch team databases",
      data: { error: errorMessage },
    });
  }
});
