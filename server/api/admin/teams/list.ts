import { db } from "../../..";
import {
  teams,
  userTeams,
  teamDatabases,
  users,
  databases,
} from "../../../schema";
import { eq, sql, isNull } from "drizzle-orm";

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
    console.log(
      "API: Запрос на получение списка команд от пользователя:",
      user.login,
      user.role
    );

    // Получаем общее количество баз данных
    const [totalDatabasesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(databases);
    const totalDatabases = Number(totalDatabasesResult.count);

    // Получаем количество пользователей без команды
    const usersWithoutTeamResult = await db
      .select({
        userId: users.id,
        login: users.login,
      })
      .from(users)
      .leftJoin(userTeams, eq(users.id, userTeams.user_id))
      .where(isNull(userTeams.team_id));
    const usersWithoutTeam = usersWithoutTeamResult.length;

    // Получаем список всех команд
    const allTeams = await db.select().from(teams);
    console.log("API: Найдено команд:", allTeams.length);

    // Получаем статистику по участникам и базам для каждой команды
    const teamsWithStats = [];
    let totalMembersInTeams = 0;

    for (const team of allTeams) {
      // Количество участников в команде
      const memberCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userTeams)
        .where(eq(userTeams.team_id, team.id));
      const memberCount = Number(memberCountResult[0]?.count || 0);

      // Количество баз данных в команде
      const databaseCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(teamDatabases)
        .where(eq(teamDatabases.team_id, team.id));
      const databaseCount = Number(databaseCountResult[0]?.count || 0);

      totalMembersInTeams += memberCount;

      teamsWithStats.push({
        ...team,
        memberCount,
        databaseCount,
      });
    }

    return {
      status: "success",
      message: "Список команд успешно получен",
      statistics: {
        totalTeams: allTeams.length,
        totalDatabases,
        totalMembersInTeams,
        usersWithoutTeam,
      },
      teams: teamsWithStats,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ошибка при получении списка команд:", errorMessage);
    if (error instanceof Error && error.stack) {
      console.error("Stack:", error.stack);
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch teams",
      data: { error: errorMessage },
    });
  }
});
