import { db } from "../../../..";
import { teamDatabases, teams } from "../../../../schema";
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

    // Получение данных из тела запроса
    const { databaseId } = await readBody(event);

    if (!databaseId || isNaN(Number(databaseId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid database ID",
      });
    }

    // Удаляем доступ к базе данных для команды
    await db
      .delete(teamDatabases)
      .where(
        and(
          eq(teamDatabases.team_id, Number(teamId)),
          eq(teamDatabases.database_id, Number(databaseId))
        )
      );

    return {
      status: "success",
      message: "Доступ к базе данных успешно отозван",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ошибка при отзыве доступа к базе данных:", errorMessage);

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to remove database access",
      data: { error: errorMessage },
    });
  }
});
