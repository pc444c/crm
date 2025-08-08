// server/api/statistics.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq, isNotNull, ne, and } from 'drizzle-orm';
import {
  users,
  records,
  teams,
  userTeams,
  tags,
} from '~~/server/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

export default defineEventHandler(async (event) => {
  try {
    // Получаем параметры запроса
    const query = getQuery(event);
    const dateFrom = query.dateFrom as string;
    const dateTo = query.dateTo as string;

    // Создаем условия для фильтрации по датам
    let dateConditions = sql`true`;
    if (dateFrom && dateTo) {
      dateConditions = sql`${records.created_at} >= ${dateFrom} AND ${records.created_at} <= ${dateTo}`;
    } else if (dateFrom) {
      dateConditions = sql`${records.created_at} >= ${dateFrom}`;
    } else if (dateTo) {
      dateConditions = sql`${records.created_at} <= ${dateTo}`;
    }

    // Общая статистика с учетом дат
    const [totalRecords] = await db.select({ 
      count: sql<number>`count(*)` 
    }).from(records).where(dateConditions);

    const [usedRecords] = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(records)
    .where(and(isNotNull(records.used_at), dateConditions));

    const [onlineUsers] = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(users)
    .where(eq(users.is_online, 'online'));

    const [totalUsers] = await db.select({ 
      count: sql<number>`count(*)` 
    }).from(users);

    // Статистика по командам с учетом дат
    const teamStats = await db
      .select({
        team_id: teams.id,
        team_name: teams.name,
        member_count: sql<number>`count(distinct ${userTeams.user_id})`,
        record_count: sql<number>`(
          SELECT count(*) 
          FROM ${records} 
          WHERE ${records.team_id} = ${teams.id} 
          AND ${dateConditions}
        )`,
        used_count: sql<number>`(
          SELECT count(*) 
          FROM ${records} 
          WHERE ${records.team_id} = ${teams.id} 
          AND ${records.used_at} IS NOT NULL 
          AND ${dateConditions}
        )`,
      })
      .from(teams)
      .leftJoin(userTeams, eq(teams.id, userTeams.team_id))
      .groupBy(teams.id, teams.name);

    // Статистика по тегам для каждой команды с фильтрацией по датам
    const tagStats = await db
      .select({
        team_id: records.team_id,
        tag: records.tag,
        count: sql<number>`count(*)`,
        color: tags.color,
      })
      .from(records)
      .leftJoin(tags, eq(tags.name, records.tag))
      .where(
        and(
          dateConditions,
          isNotNull(records.team_id),
          isNotNull(records.tag),
          ne(records.tag, 'used'),
          ne(records.tag, 'no used')
        )
      )
      .groupBy(records.team_id, records.tag, tags.color)
      .orderBy(records.team_id, sql`count(*) desc`);

    // Обрабатываем теги по командам
    const tagsByTeam: Record<string, Array<{ tag: string; count: number; color: string }>> = {};
    
    tagStats.forEach(row => {
      if (row.team_id && row.tag) {
        const teamId = String(row.team_id);
        if (!tagsByTeam[teamId]) {
          tagsByTeam[teamId] = [];
        }
        tagsByTeam[teamId].push({
          tag: row.tag,
          count: Number(row.count),
          color: row.color || '#3B82F6'
        });
      }
    });

    // Формируем единый ответ
    const response = {
      general: {
        totalRecords: Number(totalRecords.count) || 0,
        usedRecords: Number(usedRecords.count) || 0,
        onlineUsers: Number(onlineUsers.count) || 0,
        totalUsers: Number(totalUsers.count) || 0,
      },
      teams: teamStats.map(team => ({
        team_id: team.team_id,
        team_name: team.team_name || 'Неизвестная команда',
        member_count: Number(team.member_count) || 0,
        record_count: Number(team.record_count) || 0,
        used_count: Number(team.used_count) || 0,
      })),
      tagsByTeam,
      dateFilter: {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      }
    };

    console.log('Statistics response:', JSON.stringify(response, null, 2));
    return response;

  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch statistics'
    });
  }
});