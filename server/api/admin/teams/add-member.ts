import { db } from "../../..";
import { userTeams, users, teams } from "../../../schema";
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
    const { teamId, userId } = await readBody(event);

    if (!teamId || !userId || isNaN(Number(teamId)) || isNaN(Number(userId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Valid team ID and user ID are required",
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

    // Проверяем, существует ли пользователь
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

    // Проверяем, не состоит ли уже пользователь в этой команде
    const membershipExists = await db
      .select()
      .from(userTeams)
      .where(
        and(
          eq(userTeams.user_id, Number(userId)),
          eq(userTeams.team_id, Number(teamId))
        )
      )
      .limit(1);

    if (membershipExists.length > 0) {
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
      team: teamExists[0],
      user: userExists[0],
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
