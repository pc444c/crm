import { db } from "..";
import { userTeams, teamDatabases } from "../schema";
import { eq, and } from "drizzle-orm";

// Функция для проверки, имеет ли пользователь доступ к базе данных через команду
export async function checkTeamDatabaseAccess(
  userId: number,
  databaseId: number
): Promise<boolean> {
  if (!userId || !databaseId) return false;

  try {
    // Шаг 1: Определяем команды пользователя
    const userTeamsResult = await db
      .select({ team_id: userTeams.team_id })
      .from(userTeams)
      .where(eq(userTeams.user_id, userId));

    if (userTeamsResult.length === 0) {
      // Пользователь не состоит ни в одной команде
      return false;
    }

    const teamIds = userTeamsResult.map((result) => result.team_id);

    // Шаг 2: Проверяем, имеет ли хоть одна из команд пользователя доступ к базе данных
    for (const teamId of teamIds) {
      const access = await db
        .select()
        .from(teamDatabases)
        .where(
          and(
            eq(teamDatabases.team_id, teamId),
            eq(teamDatabases.database_id, databaseId)
          )
        )
        .limit(1);

      if (access.length > 0) {
        // Найден доступ к базе данных через команду
        return true;
      }
    }

    // Ни одна из команд пользователя не имеет доступа к базе данных
    return false;
  } catch (error) {
    console.error(
      `Ошибка при проверке доступа к базе данных через команду:`,
      error
    );
    return false;
  }
}

// Middleware для проверки доступа
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  const user = event.context.user;

  // Пропускаем для админов и маршрутов, не требующих проверки
  if (
    !user ||
    user.role === "admin" ||
    path.startsWith("/api/admin/") ||
    path.startsWith("/api/login") ||
    path.startsWith("/api/verify-auth") ||
    path.startsWith("/api/logout")
  ) {
    return;
  }

  // Проверяем маршруты, связанные с доступом к конкретной базе данных
  // Например /api/records/someId или другие маршруты, содержащие ID базы
  const databaseIdMatch = path.match(/\/api\/records\/(\d+)/);
  if (databaseIdMatch) {
    const databaseId = Number(databaseIdMatch[1]);
    const hasAccess = await checkTeamDatabaseAccess(user.id, databaseId);

    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "У вас нет доступа к этой базе данных через команду",
      });
    }
  }
});
