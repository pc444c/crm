import { db } from "../../../../../";
import { teamDatabases } from "../../../../../schema";
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
  const databaseId = Number(event.context.params?.databaseId);

  if (!teamId || isNaN(teamId) || !databaseId || isNaN(databaseId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid team ID or database ID",
    });
  }

  try {
    // Удаляем доступ команды к базе данных
    const result = await db
      .delete(teamDatabases)
      .where(
        and(
          eq(teamDatabases.team_id, teamId),
          eq(teamDatabases.database_id, databaseId)
        )
      )
      .returning({ deletedId: teamDatabases.id });

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Team does not have access to this database",
      });
    }

    return {
      status: "success",
      message: "Доступ к базе данных успешно удален",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Ошибка при удалении доступа команды ${teamId} к базе данных ${databaseId}:`,
      errorMessage
    );

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
