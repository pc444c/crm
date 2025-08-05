import { db } from "../../../../";
import { teams, teamDatabases, databases } from "../../../../schema";
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

  const teamId = Number(event.context.params?.id);
  if (!teamId || isNaN(teamId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid team ID",
    });
  }

  try {
    // Получение данных из запроса
    const { database_id } = await readBody(event);

    if (!database_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Database ID is required",
      });
    }

    // Проверяем существование команды
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (existingTeam.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Team not found",
      });
    }

    // Проверяем существование базы данных
    const existingDatabase = await db
      .select()
      .from(databases)
      .where(eq(databases.id, database_id))
      .limit(1);

    if (existingDatabase.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Database not found",
      });
    }

    // Проверяем, не добавлена ли база данных уже этой команде
    const existingAccess = await db
      .select()
      .from(teamDatabases)
      .where(
        and(
          eq(teamDatabases.database_id, database_id),
          eq(teamDatabases.team_id, teamId)
        )
      )
      .limit(1);

    if (existingAccess.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Team already has access to this database",
      });
    }

    // Добавляем доступ к базе данных для команды
    const [newAccess] = await db
      .insert(teamDatabases)
      .values({
        database_id,
        team_id: teamId,
      })
      .returning();

    return {
      status: "success",
      message: "База данных успешно добавлена команде",
      access: newAccess,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Ошибка при добавлении базы данных команде ${teamId}:`,
      errorMessage
    );

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add database to team",
      data: { error: errorMessage },
    });
  }
});
