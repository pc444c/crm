import { db } from "../../..";
import { teamDatabases, teams, databases } from "../../../schema";
import { eq, sql } from "drizzle-orm";

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
    // Получаем ID команды из параметров запроса
    const { teamId } = getQuery(event);

    console.log("API get-databases: teamId =", teamId);

    if (!teamId || isNaN(Number(teamId))) {
      console.error("API get-databases: Invalid team ID:", teamId);
      throw createError({
        statusCode: 400,
        statusMessage: "Valid team ID is required",
      });
    }

    // Проверяем, существует ли команда
    const teamExists = await db
      .select()
      .from(teams)
      .where(eq(teams.id, Number(teamId)))
      .limit(1);

    if (teamExists.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Team not found",
      });
    }

    // Получаем все базы данных с флагом доступа для команды
    const allDatabases = await db
      .select({
        id: databases.id,
        name: databases.name,
        created_at: databases.created_at,
        online_at: databases.online_at,
        hasAccess:
          sql<boolean>`CASE WHEN ${teamDatabases.team_id} IS NOT NULL THEN true ELSE false END`.as(
            "hasAccess"
          ),
      })
      .from(databases)
      .leftJoin(
        teamDatabases,
        sql`${teamDatabases.database_id} = ${databases.id} AND ${
          teamDatabases.team_id
        } = ${Number(teamId)}`
      );

    console.log(
      "API get-databases: Found",
      allDatabases.length,
      "databases for team",
      teamId
    );

    return {
      status: "success",
      message: "Список баз данных получен успешно",
      databases: allDatabases,
      team: teamExists[0],
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
      statusMessage: "Failed to get databases",
      data: { error: errorMessage },
    });
  }
});
