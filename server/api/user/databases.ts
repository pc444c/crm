import { db } from "../..";
import { databases, teamDatabases, userTeams } from "../../schema";
import { eq, inArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется авторизация",
    });
  }

  try {
    // Для админов показываем все базы данных
    if (user.role === "admin") {
      const allDatabases = await db.select().from(databases);

      return {
        status: "success",
        message: "Базы данных успешно загружены",
        databases: allDatabases,
      };
    }

    // Для обычных пользователей (операторов) показываем только базы,
    // к которым у них есть доступ через команды

    // Шаг 1: Получаем команды пользователя
    const userTeamsResult = await db
      .select({ team_id: userTeams.team_id })
      .from(userTeams)
      .where(eq(userTeams.user_id, user.id));

    if (userTeamsResult.length === 0) {
      // Если пользователь не состоит ни в одной команде - у него нет доступа к базам
      return {
        status: "success",
        message: "Пользователь не состоит ни в одной команде",
        databases: [],
      };
    }

    const teamIds = userTeamsResult.map((result) => result.team_id);

    // Шаг 2: Получаем ID баз данных, к которым есть доступ через команды
    const accessibleDatabasesResult = await db
      .select({ database_id: teamDatabases.database_id })
      .from(teamDatabases)
      .where(inArray(teamDatabases.team_id, teamIds));

    if (accessibleDatabasesResult.length === 0) {
      // Если у команд пользователя нет доступа ни к одной базе
      return {
        status: "success",
        message: "У команд пользователя нет доступа к базам данных",
        databases: [],
      };
    }

    const databaseIds = accessibleDatabasesResult.map(
      (result) => result.database_id
    );

    // Шаг 3: Загружаем информацию о доступных базах данных
    const accessibleDatabases = await db
      .select()
      .from(databases)
      .where(inArray(databases.id, databaseIds));

    return {
      status: "success",
      message: "Доступные базы данных успешно загружены",
      databases: accessibleDatabases,
    };
  } catch (error) {
    console.error("Ошибка при получении доступных баз данных:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Ошибка при получении доступных баз данных",
    });
  }
});
