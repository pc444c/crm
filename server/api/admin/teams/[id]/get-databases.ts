import { db } from "../../../..";
import { teamDatabases, databases, teams } from "../../../../schema";
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
    // Получение ID команды из URL
    const teamId = getRouterParam(event, "id");

    if (!teamId || isNaN(Number(teamId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid team ID",
      });
    }

    // Проверяем существование команды
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, Number(teamId)))
      .limit(1);

    if (team.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Team not found",
      });
    }

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
      .where(eq(teamDatabases.team_id, Number(teamId)));

    const accessDatabaseIds = new Set(
      teamAccessDatabases.map((db) => db.database_id)
    );

    // Формируем итоговый список баз с признаком наличия доступа
    const databasesWithAccess = allDatabases.map((db) => ({
      ...db,
      hasAccess: accessDatabaseIds.has(db.id),
    }));

    return {
      status: "success",
      message: "Список баз данных с информацией о доступе успешно получен",
      databases: databasesWithAccess,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ошибка при получении списка баз данных:", errorMessage);

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch databases",
      data: { error: errorMessage },
    });
  }
});
