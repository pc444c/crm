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
    console.log("API: Запрос статистики команд от пользователя:", user.login);

    // Получаем общее количество баз данных
    console.log("Получаем общее количество баз данных...");
    const [totalDatabasesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(databases);
    const totalDatabases = Number(totalDatabasesResult.count);
    console.log("Общее количество баз данных:", totalDatabases);

    // Получаем количество пользователей без команды
    console.log("Получаем пользователей без команды...");
    const usersWithoutTeamResult = await db
      .select({
        userId: users.id,
        login: users.login,
      })
      .from(users)
      .leftJoin(userTeams, eq(users.id, userTeams.user_id))
      .where(isNull(userTeams.team_id));
    const usersWithoutTeam = usersWithoutTeamResult.length;
    console.log("Пользователей без команды:", usersWithoutTeam);

    // Получаем команды с количеством участников и баз
    console.log("Получаем команды с статистикой...");

    // Сначала получаем все команды
    const allTeams = await db.select().from(teams);
    console.log("Всего команд:", allTeams.length);

    // Получаем статистику по участникам для каждой команды
    const teamMemberCounts = new Map<number, number>();
    for (const team of allTeams) {
      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(userTeams)
        .where(eq(userTeams.team_id, team.id));
      teamMemberCounts.set(team.id, Number(memberCount[0]?.count || 0));
    }

    // Получаем статистику по базам данных для каждой команды
    const teamDatabaseCounts = new Map<number, number>();
    for (const team of allTeams) {
      const databaseCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(teamDatabases)
        .where(eq(teamDatabases.team_id, team.id));
      teamDatabaseCounts.set(team.id, Number(databaseCount[0]?.count || 0));
    }

    // Формируем результат
    const teamsWithStats = allTeams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      created_at: team.created_at,
      memberCount: teamMemberCounts.get(team.id) || 0,
      databaseCount: teamDatabaseCounts.get(team.id) || 0,
    }));

    console.log("Команды с статистикой получены:", teamsWithStats.length);

    // Подсчитываем общее количество участников в командах
    const totalMembersInTeams = teamsWithStats.reduce(
      (sum, team) => sum + team.memberCount,
      0
    );
    console.log("Общее количество участников в командах:", totalMembersInTeams);

    const result = {
      status: "success",
      message: "Статистика команд успешно получена",
      statistics: {
        totalTeams: teamsWithStats.length,
        totalDatabases,
        totalMembersInTeams,
        usersWithoutTeam,
      },
      teams: teamsWithStats,
    };

    console.log(
      "Возвращаем результат статистики:",
      JSON.stringify(result, null, 2)
    );
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ошибка при получении статистики команд:", errorMessage);
    if (error instanceof Error && error.stack) {
      console.error("Stack:", error.stack);
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch team statistics",
      data: { error: errorMessage },
    });
  }
});
