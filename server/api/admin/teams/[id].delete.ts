import { db } from "../../../";
import { teams, userTeams, teamDatabases } from "../../../schema";
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

  const teamId = Number(event.context.params?.id);
  if (!teamId || isNaN(teamId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid team ID",
    });
  }

  try {
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

    // Транзакция для удаления команды и связанных данных
    await db.transaction(async (tx) => {
      // Удаляем связи команд с базами данных
      await tx.delete(teamDatabases).where(eq(teamDatabases.team_id, teamId));

      // Удаляем связи команд с пользователями
      await tx.delete(userTeams).where(eq(userTeams.team_id, teamId));

      // Удаляем саму команду
      await tx.delete(teams).where(eq(teams.id, teamId));
    });

    return {
      status: "success",
      message: "Команда успешно удалена",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Ошибка при удалении команды ${teamId}:`, errorMessage);

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete team",
      data: { error: errorMessage },
    });
  }
});
