import { db } from "../../../../";
import { teams, userTeams, users } from "../../../../schema";
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
    const { user_id } = await readBody(event);

    if (!user_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "User ID is required",
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

    // Проверяем существование пользователя
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user_id))
      .limit(1);

    if (existingUser.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      });
    }

    // Проверяем, не добавлен ли пользователь уже в эту команду
    const existingMembership = await db
      .select()
      .from(userTeams)
      .where(and(eq(userTeams.user_id, user_id), eq(userTeams.team_id, teamId)))
      .limit(1);

    if (existingMembership.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "User is already a member of this team",
      });
    }

    // Проверяем, не состоит ли пользователь уже в другой команде
    const otherTeamMembership = await db
      .select()
      .from(userTeams)
      .where(eq(userTeams.user_id, user_id))
      .limit(1);

    if (otherTeamMembership.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "User is already a member of another team",
      });
    }

    // Добавляем пользователя в команду
    const [newMembership] = await db
      .insert(userTeams)
      .values({
        user_id,
        team_id: teamId,
      })
      .returning();

    return {
      status: "success",
      message: "Пользователь успешно добавлен в команду",
      membership: newMembership,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Ошибка при добавлении пользователя в команду ${teamId}:`,
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
