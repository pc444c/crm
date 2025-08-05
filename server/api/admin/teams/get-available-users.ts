import { db } from "../../..";
import { users, userTeams, teams } from "../../../schema";
import { eq, notExists, and, ne, ilike, or } from "drizzle-orm";

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
    // Получение ID команды из query параметров
    const query = getQuery(event);
    const teamId = query.teamId;
    const search = (query.search as string) || "";

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

    // Получаем всех пользователей, не входящих в команду, исключая админов
    let whereConditions = and(
      ne(users.role, "admin"), // Исключаем админов
      notExists(
        db
          .select()
          .from(userTeams)
          .where(
            and(
              eq(userTeams.team_id, Number(teamId)),
              eq(userTeams.user_id, users.id)
            )
          )
      )
    );

    // Добавляем поиск если есть search параметр
    if (search && search.trim()) {
      whereConditions = and(
        whereConditions,
        or(ilike(users.login, `%${search.trim()}%`))
      );
    }

    const availableUsers = await db
      .select({
        id: users.id,
        login: users.login,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users)
      .where(whereConditions)
      .orderBy(users.login);

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
