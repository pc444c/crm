import { db } from "../../../..";
import { users, userTeams, teams } from "../../../../schema";
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

    // Получаем всех пользователей, не состоящих в этой команде
    const teamMembers = await db
      .select({ user_id: userTeams.user_id })
      .from(userTeams)
      .where(eq(userTeams.team_id, Number(teamId)));

    const memberIds = teamMembers.map((m) => m.user_id);

    // Получаем всех пользователей, не входящих в команду
    let availableUsers;
    if (memberIds.length > 0) {
      availableUsers = await db
        .select({
          id: users.id,
          login: users.login,
          role: users.role,
          created_at: users.created_at,
        })
        .from(users)
        .where(sql`${users.id} NOT IN (${memberIds.join(", ")})`);
    } else {
      availableUsers = await db
        .select({
          id: users.id,
          login: users.login,
          role: users.role,
          created_at: users.created_at,
        })
        .from(users);
    }

    return {
      status: "success",
      message: "Список доступных пользователей получен",
      users: availableUsers,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "Ошибка при получении доступных пользователей:",
      errorMessage
    );

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch available users",
      data: { error: errorMessage },
    });
  }
});
