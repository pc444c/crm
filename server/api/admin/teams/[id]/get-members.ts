import { db } from "../../../..";
import { userTeams, users, teams } from "../../../../schema";
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

    // Получаем список пользователей в команде
    const members = await db
      .select({
        id: users.id,
        login: users.login,
        role: users.role,
        created_at: users.created_at,
      })
      .from(userTeams)
      .innerJoin(users, eq(userTeams.user_id, users.id))
      .where(eq(userTeams.team_id, Number(teamId)));

    return {
      status: "success",
      message: "Список участников команды успешно получен",
      members,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "Ошибка при получении списка участников команды:",
      errorMessage
    );

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch team members",
      data: { error: errorMessage },
    });
  }
});
