import { db } from "../../index";
import { tags } from "../../schema";
import { verifyAuth } from "../../utils/jwt";
import { sql } from "drizzle-orm";

// Этот API возвращает статистику звонков пользователя с фильтрацией по дате установки тега
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

    // Получаем параметры фильтрации
    const query = getQuery(event);
    const startDate = query.startDate
      ? new Date(query.startDate.toString())
      : null;
    const endDate = query.endDate ? new Date(query.endDate.toString()) : null;

    // Получаем все доступные теги из базы данных с их цветами для оформления
    const allTags = await db.select().from(tags);

    // Базовые условия запроса - звонки, обработанные текущим пользователем
    let whereClause = `records.user_id = ${userData.id}`;

    // Добавляем фильтрацию по дате постановки тега, если указаны даты
    if (startDate && endDate) {
      whereClause += ` AND records.status_updated_at >= '${startDate.toISOString()}' AND records.status_updated_at <= '${endDate.toISOString()}'`;
    } else if (startDate) {
      whereClause += ` AND records.status_updated_at >= '${startDate.toISOString()}'`;
    } else if (endDate) {
      whereClause += ` AND records.status_updated_at <= '${endDate.toISOString()}'`;
    }

    // SQL-запрос для получения статистики звонков по тегам
    const tagsStatsQuery = `
      SELECT 
        tag as status, 
        COUNT(*) as count 
      FROM records 
      WHERE ${whereClause} AND status_updated_at IS NOT NULL
      GROUP BY tag 
      ORDER BY tag
    `;

    // SQL-запрос для получения статистики по дням
    const timeSeriesQuery = `
      SELECT 
        DATE(status_updated_at)::text as date, 
        COUNT(*) as count 
      FROM records 
      WHERE ${whereClause} AND status_updated_at IS NOT NULL
      GROUP BY DATE(status_updated_at) 
      ORDER BY DATE(status_updated_at)
    `;

    // SQL-запрос для получения списка звонков
    const userCallsQuery = `
      SELECT 
        id, 
        fio, 
        phone, 
        tag, 
        city, 
        address, 
        status_updated_at, 
        created_at
      FROM records 
      WHERE ${whereClause}
      ORDER BY status_updated_at DESC
      LIMIT 100
    `;

    // Выполняем запросы
    const callStats = await db.execute(sql.raw(tagsStatsQuery));
    const timeSeriesData = await db.execute(sql.raw(timeSeriesQuery));
    const userCalls = await db.execute(sql.raw(userCallsQuery));

    return {
      status: "success",
      data: {
        callStats: callStats.rows,
        timeSeriesData: timeSeriesData.rows,
        userCalls: userCalls.rows,
        tags: allTags,
      },
    };
  } catch (error) {
    console.error(
      "Ошибка при получении статистики звонков пользователя:",
      error
    );
    return {
      status: "error",
      message: "Ошибка при получении статистики звонков",
    };
  }
});
