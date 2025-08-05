import { db } from "../../index";
import { records, tags, userTeams, teamDatabases } from "../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq, and, inArray } from "drizzle-orm";

// API для получения записей по тегу или фильтрации
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Требуется авторизация",
      });
    }

    const body = await readBody(event);
    const { tagId, searchQuery, limit = 100, offset = 0 } = body;

    // Получаем имя тега, если указан tagId
    let tagName = null;
    if (tagId) {
      const tagResult = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tagId))
        .execute();

      if (tagResult.length > 0) {
        tagName = tagResult[0].name;
      }
    }

    let results;

    // Проверяем, является ли пользователь администратором
    if (user.role === "admin") {
      // Для админов доступны все записи
      results = await db.select().from(records).execute();
    } else {
      // Для обычных пользователей проверяем доступ через команды

      // Получаем команды пользователя
      const userTeamsResult = await db
        .select({ team_id: userTeams.team_id })
        .from(userTeams)
        .where(eq(userTeams.user_id, user.id));

      if (userTeamsResult.length === 0) {
        // Пользователь не состоит ни в одной команде
        return {
          success: true,
          records: [],
          totalCount: 0,
          message: "У вас нет доступа к базам данных",
        };
      }

      const teamIds = userTeamsResult.map((result) => result.team_id);

      // Получаем базы данных, к которым есть доступ через команды
      const accessibleDatabasesResult = await db
        .select({ database_id: teamDatabases.database_id })
        .from(teamDatabases)
        .where(inArray(teamDatabases.team_id, teamIds));

      if (accessibleDatabasesResult.length === 0) {
        // У команд пользователя нет доступа ни к одной базе данных
        return {
          success: true,
          records: [],
          totalCount: 0,
          message: "У ваших команд нет доступа к базам данных",
        };
      }

      const accessibleDatabaseIds = accessibleDatabasesResult.map(
        (result) => result.database_id
      );

      // Получаем записи только из доступных баз данных
      results = await db
        .select()
        .from(records)
        .where(inArray(records.database_id, accessibleDatabaseIds))
        .execute();
    }

    // Фильтрация по тегу, если необходимо
    if (tagName) {
      results = results.filter((record) => record.tag === tagName);
    }

    // Фильтрация по поисковому запросу, если необходимо
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (record) =>
          (record.fio && record.fio.toLowerCase().includes(query)) ||
          (record.phone && record.phone.toLowerCase().includes(query)) ||
          (record.city && record.city.toLowerCase().includes(query)) ||
          (record.address && record.address.toLowerCase().includes(query)) ||
          (record.description &&
            record.description.toLowerCase().includes(query))
      );
    }

    // Общее количество после фильтрации
    const totalCount = results.length;

    // Применяем пагинацию
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      status: "success",
      data: paginatedResults,
      pagination: {
        total: totalCount,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error("Ошибка при получении записей по тегу:", error);
    return {
      status: "error",
      message: "Ошибка при получении записей по тегу",
    };
  }
});
