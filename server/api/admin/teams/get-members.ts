import { db } from "../../..";
import { userTeams, users, teams } from "../../../schema";
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
    // Получаем ID команды из параметров запроса
    const { teamId } = getQuery(event);

    if (!teamId || isNaN(Number(teamId))) {
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

    // Получаем список пользователей в команде
    const teamMembersQuery = await db
      .select({
        id: users.id,
        login: users.login,
        role: users.role,
        created_at: users.created_at,
        team_id: userTeams.team_id,
      })
      .from(userTeams)
      .innerJoin(users, eq(userTeams.user_id, users.id))
      .where(eq(userTeams.team_id, Number(teamId)));

    return {
      status: "success",
      message: "Список пользователей в команде получен успешно",
      members: teamMembersQuery,
      team: teamExists[0],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "Ошибка при получении списка пользователей команды:",
      errorMessage
    );

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to get team members",
      data: { error: errorMessage },
    });
  }
});
