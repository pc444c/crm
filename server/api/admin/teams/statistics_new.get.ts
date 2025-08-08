import { defineEventHandler, getQuery, createError } from "h3";
import { db } from "~~/server";
import { teams, userTeams, records, users } from "~~/server/schema";
import { and, between, ne, eq, gte, lte, isNotNull } from "drizzle-orm";

interface TeamStatistics {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  totalCalls: number;
  todayCalls: number;
  weekCalls: number;
  monthCalls: number;
  tagsCount: Record<string, number>;
  avgCallsPerDay: number;
  lastActivityDate: string | null;
  activeMembers: number;
  topPerformers: Array<{ userId: number; login: string; calls: number }>;
}

export default defineEventHandler(async (event) => {
  try {
    const { startDate: sd, endDate: ed, teamId } = getQuery(event);

    // Настройка дат
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Конец дня для корректного сравнения

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const startDate = sd ? new Date(`${sd}T00:00:00`) : null;
    const endDate = ed ? new Date(`${ed}T23:59:59`) : null;

    // Получаем команды с фильтрацией
    const teamConditions = [];
    if (teamId && Number(teamId) > 0) {
      teamConditions.push(eq(teams.id, Number(teamId)));
    }

    const teamsData = await db
      .select()
      .from(teams)
      .where(teamConditions.length > 0 ? and(...teamConditions) : undefined);

    // Получаем связи пользователей и команд с информацией о пользователях
    const userTeamsData = await db
      .select({
        teamId: userTeams.team_id,
        userId: userTeams.user_id,
        userLogin: users.login,
        userLastActivity: users.last_activity,
        userIsOnline: users.is_online,
      })
      .from(userTeams)
      .innerJoin(users, eq(userTeams.user_id, users.id));

    // Создаем маппинг участников по командам
    const teamMembersMap = new Map<
      number,
      Array<{
        userId: number;
        login: string;
        lastActivity: Date | null;
        isOnline: string;
      }>
    >();

    userTeamsData.forEach(
      ({ teamId, userId, userLogin, userLastActivity, userIsOnline }) => {
        if (!teamMembersMap.has(teamId)) {
          teamMembersMap.set(teamId, []);
        }
        teamMembersMap.get(teamId)!.push({
          userId,
          login: userLogin,
          lastActivity: userLastActivity,
          isOnline: userIsOnline,
        });
      }
    );

    // Формируем условия для записей
    const recordConditions = [
      ne(records.tag, "no used"),
      isNotNull(records.status_updated_at),
    ];

    if (startDate && endDate) {
      recordConditions.push(
        between(records.status_updated_at, startDate, endDate)
      );
    } else if (startDate) {
      recordConditions.push(gte(records.status_updated_at, startDate));
    } else if (endDate) {
      recordConditions.push(lte(records.status_updated_at, endDate));
    }

    // Получаем все записи с обработкой
    const recordsData = await db
      .select({
        id: records.id,
        teamId: records.team_id,
        userId: records.user_id,
        date: records.status_updated_at,
        tag: records.tag,
        usedAt: records.used_at,
        createdAt: records.created_at,
      })
      .from(records)
      .where(and(...recordConditions));

    // Вычисляем статистику для каждой команды
    const statistics: TeamStatistics[] = [];

    for (const team of teamsData) {
      const teamMembers = teamMembersMap.get(team.id) || [];
      const teamRecords = recordsData.filter((r) => r.teamId === team.id);

      // Подсчет звонков по периодам
      const totalCalls = teamRecords.length;
      const todayCalls = teamRecords.filter(
        (r) => r.date && r.date >= todayStart && r.date <= today
      ).length;
      const weekCalls = teamRecords.filter(
        (r) => r.date && r.date >= weekStart && r.date <= today
      ).length;
      const monthCalls = teamRecords.filter(
        (r) => r.date && r.date >= monthStart && r.date <= today
      ).length;

      // Подсчет тегов
      const tagsCount: Record<string, number> = {};
      teamRecords.forEach((record) => {
        const tag = record.tag;
        if (tag && tag !== "used" && tag !== "no used") {
          tagsCount[tag] = (tagsCount[tag] || 0) + 1;
        }
      });

      // Активные участники (те, кто звонил за последнюю неделю или онлайн)
      const recentActiveUserIds = new Set(
        teamRecords
          .filter((r) => r.date && r.date >= weekStart && r.userId)
          .map((r) => r.userId!)
      );

      // Добавляем пользователей, которые онлайн
      teamMembers.forEach((member) => {
        if (member.isOnline === "online") {
          recentActiveUserIds.add(member.userId);
        }
      });

      // Топ исполнители за выбранный период
      const userCallsMap = new Map<number, number>();
      teamRecords.forEach((record) => {
        if (record.userId) {
          userCallsMap.set(
            record.userId,
            (userCallsMap.get(record.userId) || 0) + 1
          );
        }
      });

      const topPerformers = Array.from(userCallsMap.entries())
        .map(([userId, callCount]) => {
          const member = teamMembers.find((m) => m.userId === userId);
          return {
            userId,
            login: member?.login || `User ${userId}`,
            calls: callCount,
          };
        })
        .sort((a, b) => b.calls - a.calls)
        .slice(0, 10); // Увеличиваем до 10 для общей статистики

      // Средние звонки в день
      const daysInPeriod =
        startDate && endDate
          ? Math.max(
              1,
              Math.ceil(
                (endDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : Math.max(
              1,
              Math.ceil(
                (today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
              )
            );

      const avgCallsPerDay =
        totalCalls > 0
          ? Math.round((totalCalls / daysInPeriod) * 100) / 100
          : 0;

      // Дата последней активности команды
      const lastActivityDate = teamRecords
        .map((r) => r.date)
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0];

      statistics.push({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: teamMembers.length,
        totalCalls,
        todayCalls,
        weekCalls,
        monthCalls,
        tagsCount,
        avgCallsPerDay,
        lastActivityDate: lastActivityDate?.toISOString() || null,
        activeMembers: recentActiveUserIds.size,
        topPerformers,
      });
    }

    // Сортируем команды по активности
    statistics.sort((a, b) => b.totalCalls - a.totalCalls);

    // Общая статистика (если выбраны все команды)
    if (!teamId || Number(teamId) === 0) {
      // Подсчет уникальных активных пользователей по всем командам
      const allActiveUsers = new Set<number>();
      statistics.forEach((team) => {
        const teamMembers = teamMembersMap.get(team.id) || [];
        const teamActiveRecords = recordsData.filter(
          (r) =>
            r.teamId === team.id && r.date && r.date >= weekStart && r.userId
        );

        teamActiveRecords.forEach((r) => allActiveUsers.add(r.userId!));

        // Добавляем онлайн пользователей
        teamMembers.forEach((member) => {
          if (member.isOnline === "online") {
            allActiveUsers.add(member.userId);
          }
        });
      });

      const totalStats: TeamStatistics = {
        id: 0,
        name: "Общая статистика",
        description: "Сводная информация по всем командам",
        memberCount: statistics.reduce(
          (sum, team) => sum + team.memberCount,
          0
        ),
        totalCalls: statistics.reduce((sum, team) => sum + team.totalCalls, 0),
        todayCalls: statistics.reduce((sum, team) => sum + team.todayCalls, 0),
        weekCalls: statistics.reduce((sum, team) => sum + team.weekCalls, 0),
        monthCalls: statistics.reduce((sum, team) => sum + team.monthCalls, 0),
        tagsCount: statistics.reduce((acc, team) => {
          Object.entries(team.tagsCount).forEach(([tag, count]) => {
            acc[tag] = (acc[tag] || 0) + count;
          });
          return acc;
        }, {} as Record<string, number>),
        avgCallsPerDay:
          statistics.length > 0
            ? Math.round(
                (statistics.reduce(
                  (sum, team) => sum + team.avgCallsPerDay,
                  0
                ) /
                  statistics.length) *
                  100
              ) / 100
            : 0,
        lastActivityDate:
          statistics
            .map((team) => team.lastActivityDate)
            .filter(Boolean)
            .sort(
              (a, b) => new Date(b!).getTime() - new Date(a!).getTime()
            )[0] || null,
        activeMembers: allActiveUsers.size,
        topPerformers: statistics
          .flatMap((team) => team.topPerformers)
          .reduce((acc, performer) => {
            const existing = acc.find((p) => p.userId === performer.userId);
            if (existing) {
              existing.calls += performer.calls;
            } else {
              acc.push({ ...performer });
            }
            return acc;
          }, [] as Array<{ userId: number; login: string; calls: number }>)
          .sort((a, b) => b.calls - a.calls)
          .slice(0, 10),
      };

      return [totalStats, ...statistics];
    }

    return statistics;
  } catch (error: unknown) {
    console.error("Ошибка получения статистики команд:", error);
    throw createError({
      statusCode: 500,
      statusMessage:
        typeof error === "object" && error && "message" in error
          ? String((error as { message?: string }).message)
          : "Ошибка сервера при получении статистики",
    });
  }
});
// ...existing code...
