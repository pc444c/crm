import { db } from "../../../../../";
import { userTeams } from "../../../../../schema";
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
  const userId = Number(event.context.params?.userId);

  if (!teamId || isNaN(teamId) || !userId || isNaN(userId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid team ID or user ID",
    });
  }

  try {
    // Удаляем пользователя из команды
    const result = await db
      .delete(userTeams)
      .where(and(eq(userTeams.team_id, teamId), eq(userTeams.user_id, userId)))
      .returning({ deletedId: userTeams.id });

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "User is not a member of this team",
      });
    }

    return {
      status: "success",
      message: "Пользователь успешно удален из команды",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Ошибка при удалении пользователя ${userId} из команды ${teamId}:`,
      errorMessage
    );

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
