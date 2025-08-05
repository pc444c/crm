import { db } from "../../..";
import { teamDatabases, teams, databases } from "../../../schema";
import { eq, and } from "drizzle-orm";

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
    // Получение данных из тела запроса
    const { teamId, databaseId } = await readBody(event);

    if (
      !teamId ||
      !databaseId ||
      isNaN(Number(teamId)) ||
      isNaN(Number(databaseId))
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Valid team ID and database ID are required",
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

    // Проверяем, существует ли база данных
    const databaseExists = await db
      .select()
      .from(databases)
      .where(eq(databases.id, Number(databaseId)))
      .limit(1);

    if (databaseExists.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Database not found",
      });
    }

    // Проверяем, не имеет ли уже команда доступ к этой базе данных
    const accessExists = await db
      .select()
      .from(teamDatabases)
      .where(
        and(
          eq(teamDatabases.team_id, Number(teamId)),
          eq(teamDatabases.database_id, Number(databaseId))
        )
      )
      .limit(1);

    if (accessExists.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Team already has access to this database",
      });
    }

    // Добавляем связь команды с базой данных
    await db.insert(teamDatabases).values({
      team_id: Number(teamId),
      database_id: Number(databaseId),
    });

    return {
      status: "success",
      message: "Доступ к базе данных успешно предоставлен команде",
      team: teamExists[0],
      database: databaseExists[0],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "Ошибка при предоставлении доступа к базе данных:",
      errorMessage
    );

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to grant database access to team",
      data: { error: errorMessage },
    });
  }
});
