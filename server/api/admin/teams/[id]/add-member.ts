import { db } from "../../../..";
import { userTeams, users, teams } from "../../../../schema";
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

    // Проверяем существование пользователя
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (userExists.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      });
    }

    // Проверяем, не состоит ли пользователь уже в команде
    const existingMembership = await db
      .select()
      .from(userTeams)
      .where(
        and(
          eq(userTeams.user_id, Number(userId)),
          eq(userTeams.team_id, Number(teamId))
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "User is already a member of this team",
      });
    }

    // Добавляем пользователя в команду
    await db.insert(userTeams).values({
      user_id: Number(userId),
      team_id: Number(teamId),
    });

    return {
      status: "success",
      message: "Пользователь успешно добавлен в команду",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "Ошибка при добавлении пользователя в команду:",
      errorMessage
    );

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add user to team",
      data: { error: errorMessage },
    });
  }
});
