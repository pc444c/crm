import { sql, desc } from "drizzle-orm";
import { db } from "../..";
import { records, users, databases } from "../../schema";
import { verifyAuth } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем авторизацию пользователя
    const userData = await verifyAuth(event);

    if (!userData) {
      return {
        status: "error",
        message: "Не авторизован",
        code: 401,
      };
    }

    // Проверяем, что пользователь админ
    if (userData.role !== "admin") {
      return {
        status: "error",
        message: "Нет доступа",
        code: 403,
      };
    }

    // Получаем параметры запроса
    const query = getQuery(event);
    const limit = Number(query.limit) || 50;

    // Получаем последние активности
    const recentActivities = await db
      .select({
        id: records.id,
        type: sql<string>`'record_updated'`,
        description: sql<string>`'Обновлена запись'`,
        details: sql<string>`concat('Тег: ', ${records.tag}, ', ID: ', ${records.id})`,
        user_id: records.user_id,
        user_login: users.login,
        database_id: records.database_id,
        database_name: databases.name,
        tag: records.tag,
        timestamp: records.status_updated_at,
        created_at: records.created_at,
      })
      .from(records)
      .leftJoin(users, sql`${records.user_id} = ${users.id}`)
      .leftJoin(databases, sql`${records.database_id} = ${databases.id}`)
      .where(sql`${records.status_updated_at} is not null`)
      .orderBy(desc(records.status_updated_at))
      .limit(limit);

    // Группируем активности по типам
    const activityStats = {
      total: recentActivities.length,
      today: recentActivities.filter((activity) => {
        const today = new Date();
        const activityDate = new Date(activity.timestamp || "");
        return activityDate.toDateString() === today.toDateString();
      }).length,
      this_week: recentActivities.filter((activity) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const activityDate = new Date(activity.timestamp || "");
        return activityDate > weekAgo;
      }).length,
    };

    // Группируем по пользователям
    const userActivity = recentActivities.reduce((acc, activity) => {
      const userId = activity.user_id;
      if (userId) {
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_login: activity.user_login || "Неизвестный",
            count: 0,
            last_activity: activity.timestamp
              ? activity.timestamp.toISOString()
              : null,
          };
        }
        acc[userId].count++;
        if (
          activity.timestamp &&
          (!acc[userId].last_activity ||
            activity.timestamp.toISOString() > acc[userId].last_activity)
        ) {
          acc[userId].last_activity = activity.timestamp.toISOString();
        }
      }
      return acc;
    }, {} as Record<number, { user_id: number; user_login: string; count: number; last_activity: string | null }>);

    // Группируем по тегам
    const tagActivity = recentActivities.reduce((acc, activity) => {
      const tag = activity.tag || "Без тега";
      if (!acc[tag]) {
        acc[tag] = {
          tag: tag,
          count: 0,
          last_used: activity.timestamp
            ? activity.timestamp.toISOString()
            : null,
        };
      }
      acc[tag].count++;
      if (
        activity.timestamp &&
        (!acc[tag].last_used ||
          activity.timestamp.toISOString() > acc[tag].last_used)
      ) {
        acc[tag].last_used = activity.timestamp.toISOString();
      }
      return acc;
    }, {} as Record<string, { tag: string; count: number; last_used: string | null }>);

    // Форматируем активности для фронтенда
    const formattedActivities = recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      details: activity.details,
      user: {
        id: activity.user_id,
        login: activity.user_login || "Неизвестный",
      },
      database: {
        id: activity.database_id,
        name: activity.database_name || "Неизвестная база",
      },
      metadata: {
        tag: activity.tag,
        record_id: activity.id,
      },
      timestamp: activity.timestamp,
      created_at: activity.created_at,
    }));

    return {
      status: "success",
      data: {
        activities: formattedActivities,
        stats: activityStats,
        user_activity: Object.values(userActivity).sort(
          (a, b) => b.count - a.count
        ),
        tag_activity: Object.values(tagActivity).sort(
          (a, b) => b.count - a.count
        ),
        summary: {
          total_activities: activityStats.total,
          active_users: Object.keys(userActivity).length,
          unique_tags: Object.keys(tagActivity).length,
          last_activity: recentActivities[0]?.timestamp || null,
        },
      },
    };
  } catch (error) {
    console.error("Ошибка получения недавней активности:", error);
    return {
      status: "error",
      message: "Ошибка получения недавней активности",
      data: null,
    };
  }
});
