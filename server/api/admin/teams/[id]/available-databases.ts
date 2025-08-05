import { db } from "../../../../";
import { databases, teamDatabases } from "../../../../schema";
import { eq, notInArray } from "drizzle-orm";

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
    // Получаем ID баз данных, к которым уже есть доступ у команды
    const teamDBs = await db
      .select({ database_id: teamDatabases.database_id })
      .from(teamDatabases)
      .where(eq(teamDatabases.team_id, teamId));

    const teamDatabaseIds = teamDBs.map((db) => db.database_id);

    // Получаем список баз данных, к которым еще нет доступа у этой команды
    let availableDatabases;
    if (teamDatabaseIds.length > 0) {
      availableDatabases = await db
        .select({
          id: databases.id,
          name: databases.name,
        })
        .from(databases)
        .where(notInArray(databases.id, teamDatabaseIds));
    } else {
      // Если у команды нет доступа ни к одной базе, возвращаем все базы
      availableDatabases = await db
        .select({
          id: databases.id,
          name: databases.name,
        })
        .from(databases);
    }

    return {
      status: "success",
      message: "Список доступных баз данных получен",
      databases: availableDatabases,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Ошибка при получении доступных баз данных для команды ${teamId}:`,
      errorMessage
    );

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch available databases",
      data: { error: errorMessage },
    });
  }
});
