import { sql } from "drizzle-orm";
import { db } from "../..";
import { records } from "../../schema";
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
    const period = (query.period as string) || "7d"; // 7d, 30d, 3m, 1y

    let dateCondition: string;

    switch (period) {
      case "7d":
        dateCondition = "7 days";
        break;
      case "30d":
        dateCondition = "30 days";
        break;
      case "3m":
        dateCondition = "3 months";
        break;
      case "1y":
        dateCondition = "1 year";
        break;
      default:
        dateCondition = "7 days";
    }

    // Активность по дням/периодам
    const activityTimeline = await db
      .select({
        period: sql<string>`date_trunc('day', ${records.status_updated_at})`,
        total_calls: sql<number>`count(*)`,
        processed_calls: sql<number>`count(case when ${records.tag} != 'no used' then 1 end)`,
        active_users: sql<number>`count(distinct ${records.user_id})`,
      })
      .from(records)
      .where(
        sql`${records.status_updated_at} > now() - interval '${sql.raw(
          dateCondition
        )}'`
      )
      .groupBy(sql`date_trunc('day', ${records.status_updated_at})`)
      .orderBy(sql`date_trunc('day', ${records.status_updated_at})`);

    // Активность по часам (последние 24 часа)
    const hourlyActivity = await db
      .select({
        hour: sql<number>`extract(hour from ${records.status_updated_at})`,
        calls: sql<number>`count(*)`,
      })
      .from(records)
      .where(sql`${records.status_updated_at} > now() - interval '24 hours'`)
      .groupBy(sql`extract(hour from ${records.status_updated_at})`)
      .orderBy(sql`extract(hour from ${records.status_updated_at})`);

    // Активность по дням недели
    const weeklyActivity = await db
      .select({
        day_of_week: sql<number>`extract(dow from ${records.status_updated_at})`,
        day_name: sql<string>`to_char(${records.status_updated_at}, 'Day')`,
        calls: sql<number>`count(*)`,
        avg_completion_rate: sql<number>`avg(case when ${records.tag} != 'no used' then 1.0 else 0.0 end) * 100`,
      })
      .from(records)
      .where(sql`${records.status_updated_at} > now() - interval '30 days'`)
      .groupBy(
        sql`extract(dow from ${records.status_updated_at}), to_char(${records.status_updated_at}, 'Day')`
      )
      .orderBy(sql`extract(dow from ${records.status_updated_at})`);

    // Пиковые часы активности
    const peakHours = await db
      .select({
        hour: sql<number>`extract(hour from ${records.status_updated_at})`,
        calls: sql<number>`count(*)`,
      })
      .from(records)
      .where(sql`${records.status_updated_at} > now() - interval '7 days'`)
      .groupBy(sql`extract(hour from ${records.status_updated_at})`)
      .orderBy(sql<number>`count(*) desc`)
      .limit(5);

    // Статистика производительности по времени
    const performanceByTime = await db
      .select({
        period: sql<string>`date_trunc('day', ${records.status_updated_at})`,
        avg_processing_time: sql<number>`avg(extract(epoch from (${records.status_updated_at} - ${records.created_at})) / 60)`, // в минутах
        success_rate: sql<number>`avg(case when ${records.tag} != 'no used' then 1.0 else 0.0 end) * 100`,
      })
      .from(records)
      .where(
        sql`${records.status_updated_at} > now() - interval '${sql.raw(
          dateCondition
        )}'`
      )
      .groupBy(sql`date_trunc('day', ${records.status_updated_at})`)
      .orderBy(sql`date_trunc('day', ${records.status_updated_at})`);

    // Сравнение с предыдущим периодом
    const currentPeriodStats = await db
      .select({
        total_calls: sql<number>`count(*)`,
        processed_calls: sql<number>`count(case when ${records.tag} != 'no used' then 1 end)`,
        active_users: sql<number>`count(distinct ${records.user_id})`,
      })
      .from(records)
      .where(
        sql`${records.status_updated_at} > now() - interval '${sql.raw(
          dateCondition
        )}'`
      );

    const previousPeriodStats = await db
      .select({
        total_calls: sql<number>`count(*)`,
        processed_calls: sql<number>`count(case when ${records.tag} != 'no used' then 1 end)`,
        active_users: sql<number>`count(distinct ${records.user_id})`,
      })
      .from(records)
      .where(
        sql`${records.status_updated_at} between now() - interval '${sql.raw(
          dateCondition
        )}' * 2 and now() - interval '${sql.raw(dateCondition)}'`
      );

    const current = currentPeriodStats[0] || {
      total_calls: 0,
      processed_calls: 0,
      active_users: 0,
    };
    const previous = previousPeriodStats[0] || {
      total_calls: 0,
      processed_calls: 0,
      active_users: 0,
    };

    const comparison = {
      calls_change:
        previous.total_calls > 0
          ? ((current.total_calls - previous.total_calls) /
              previous.total_calls) *
            100
          : 0,
      completion_change:
        previous.processed_calls > 0
          ? ((current.processed_calls - previous.processed_calls) /
              previous.processed_calls) *
            100
          : 0,
      users_change:
        previous.active_users > 0
          ? ((current.active_users - previous.active_users) /
              previous.active_users) *
            100
          : 0,
    };

    return {
      status: "success",
      data: {
        timeline: activityTimeline.map((item) => ({
          period: item.period,
          total_calls: item.total_calls,
          processed_calls: item.processed_calls,
          active_users: item.active_users,
          completion_rate:
            item.total_calls > 0
              ? (item.processed_calls / item.total_calls) * 100
              : 0,
        })),
        hourly: hourlyActivity.map((item) => ({
          hour: item.hour,
          calls: item.calls,
        })),
        weekly: weeklyActivity.map((item) => ({
          day: item.day_of_week,
          day_name: item.day_name?.trim(),
          calls: item.calls,
          completion_rate: item.avg_completion_rate || 0,
        })),
        peakHours: peakHours.map((item) => ({
          hour: item.hour,
          calls: item.calls,
        })),
        performance: performanceByTime.map((item) => ({
          period: item.period,
          avg_processing_time: item.avg_processing_time || 0,
          success_rate: item.success_rate || 0,
        })),
        comparison: {
          current: current,
          previous: previous,
          changes: comparison,
        },
        summary: {
          period: period,
          total_calls: current.total_calls,
          average_per_day:
            activityTimeline.length > 0
              ? Math.round(current.total_calls / activityTimeline.length)
              : 0,
          busiest_hour: peakHours[0]?.hour || 0,
          busiest_day:
            weeklyActivity
              .sort((a, b) => b.calls - a.calls)[0]
              ?.day_name?.trim() || "Н/Д",
        },
      },
    };
  } catch (error) {
    console.error("Ошибка получения временной аналитики:", error);
    return {
      status: "error",
      message: "Ошибка получения временной аналитики",
      data: null,
    };
  }
});
