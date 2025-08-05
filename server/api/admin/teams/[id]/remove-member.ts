import { db } from "../../../..";
import { userTeams, teams } from "../../../../schema";
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
    const { userId } = await readBody(event);

    if (!userId || isNaN(Number(userId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid user ID",
      });
    }

    // Удаляем пользователя из команды
    await db
      .delete(userTeams)
      .where(
        and(
          eq(userTeams.user_id, Number(userId)),
          eq(userTeams.team_id, Number(teamId))
        )
      );

    return {
      status: "success",
      message: "Пользователь успешно удален из команды",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ошибка при удалении пользователя из команды:", errorMessage);

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to remove user from team",
      data: { error: errorMessage },
    });
  }
});
