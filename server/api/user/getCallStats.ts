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

    // Логируем исходные параметры
    console.log(
      `[getCallStats] Исходные параметры запроса: startDate=${query.startDate}, endDate=${query.endDate}, excludeTag=${query.excludeTag}`
    );

    // Преобразуем даты и управляем временем
    let startDate = null;
    let endDate = null;

    if (query.startDate) {
      startDate = new Date(query.startDate.toString());
      startDate.setHours(0, 0, 0, 0); // Начало дня
    }

    if (query.endDate) {
      endDate = new Date(query.endDate.toString());
      endDate.setHours(23, 59, 59, 999); // Конец дня
    }

    // Логируем преобразованные даты
    console.log(
      `[getCallStats] Преобразованные даты: startDate=${startDate?.toISOString()}, endDate=${endDate?.toISOString()}`
    );

    // Получаем все доступные теги из базы данных с их цветами для оформления
    const allTags = await db.select().from(tags);

    // Базовые условия запроса - звонки, обработанные текущим пользователем
    let whereClause = `records.user_id = ${userData.id}`;

    // Исключаем записи с определенными тегами
    const excludeTags = ["no user", "no used", "used"];
    if (query.excludeTag) {
      // Если передан дополнительный тег для исключения, добавляем его
      const additionalExcludeTag = query.excludeTag.toString();
      if (!excludeTags.includes(additionalExcludeTag)) {
        excludeTags.push(additionalExcludeTag);
      }
    }
    
    // Формируем условие исключения тегов
    const excludeTagsCondition = excludeTags.map(tag => `'${tag}'`).join(', ');
    whereClause += ` AND (records.tag NOT IN (${excludeTagsCondition}) AND records.tag IS NOT NULL)`;
    
    // Логируем исключаемые теги
    console.log(`[getCallStats] Исключаемые теги: ${excludeTags.join(', ')}`);

    // Добавляем фильтрацию по дате постановки тега, если указаны даты
    if (startDate && endDate) {
      whereClause += ` AND records.status_updated_at >= '${startDate.toISOString()}' AND records.status_updated_at <= '${endDate.toISOString()}'`;
    } else if (startDate) {
      whereClause += ` AND records.status_updated_at >= '${startDate.toISOString()}'`;
    } else if (endDate) {
      whereClause += ` AND records.status_updated_at <= '${endDate.toISOString()}'`;
    }

    // Выводим полный SQL запрос для отладки
    console.log(`[getCallStats] WHERE условие: ${whereClause}`);

    // SQL-запрос для получения статистики звонков по тегам
    const tagsStatsQuery = `
      SELECT 
        tag as status, 
        COUNT(*) as count 
      FROM records 
      WHERE ${whereClause}
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
      LIMIT 1000
    `;

    // Выполняем запросы
    const callStats = await db.execute(sql.raw(tagsStatsQuery));
    const timeSeriesData = await db.execute(sql.raw(timeSeriesQuery));
    const userCalls = await db.execute(sql.raw(userCallsQuery));

    // Логируем количество полученных данных для диагностики
    console.log(
      `[getCallStats] Получено статистик по тегам: ${callStats.rows.length}`
    );
    console.log(
      `[getCallStats] Получено данных по дням: ${timeSeriesData.rows.length}`
    );
    console.log(
      `[getCallStats] Получено записей звонков: ${userCalls.rows.length}`
    );

    // Проверяем наличие данных
    if (!callStats.rows.length && !timeSeriesData.rows.length) {
      console.warn(
        `[getCallStats] Нет данных для пользователя ${userData.id} с фильтрами: startDate=${startDate}, endDate=${endDate}`
      );
    }

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
