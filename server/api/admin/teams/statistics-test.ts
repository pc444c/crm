import { db } from "../../..";
import { teams } from "../../../schema";

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
      "API: Простой тест статистики команд от пользователя:",
      user.login
    );

    // Получаем простой список команд
    const allTeams = await db.select().from(teams);
    console.log("Всего команд найдено:", allTeams.length);

    return {
      status: "success",
      message: "Тест API прошел успешно",
      statistics: {
        totalTeams: allTeams.length,
        totalDatabases: 10,
        totalMembersInTeams: 5,
        usersWithoutTeam: 2,
      },
      teams: allTeams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        created_at: team.created_at,
        memberCount: 1,
        databaseCount: 2,
      })),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ошибка в тестовом API статистики команд:", errorMessage);
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
