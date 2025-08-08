import { eq, sql } from "drizzle-orm";
import { db } from "../../..";
import { teams, userTeams, users, records } from "../../../schema";

function getDaysArray(start: string, end: string): string[] {
  const arr: string[] = [];
  let dt = new Date(start);
  const endDt = new Date(end);
  while (dt <= endDt) {
    arr.push(dt.toISOString().split("T")[0]);
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;
  const teamId = query.teamId as string;

  // Динамика по дням
  const days: string[] =
    startDate && endDate ? getDaysArray(startDate, endDate) : [];

  // Получаем все команды
  const allTeams = await db.select().from(teams).orderBy(teams.name);

  // Получаем участников по командам
  const teamMembersRaw = await db
    .select({ team_id: userTeams.team_id, user_id: userTeams.user_id })
    .from(userTeams);
  const teamMembersMap: Record<string, number[]> = {};
  teamMembersRaw.forEach((row) => {
    const key = String(row.team_id);
    if (!teamMembersMap[key]) teamMembersMap[key] = [];
    teamMembersMap[key].push(row.user_id);
  });

  // Получаем все звонки
  const recordsRaw = await db
    .select({
      id: records.id,
      team_id: records.team_id,
      status_updated_at: records.status_updated_at,
      tag: records.tag,
    })
    .from(records);

  // Группируем звонки по командам и датам
  const teamStats = allTeams.map((team) => {
    const teamRecords = recordsRaw.filter(
      (r) => r.team_id === team.id && r.tag !== "no used"
    );
    const memberCount = teamMembersMap[String(team.id)]?.length || 0;
    const totalCalls = teamRecords.length;
    // Звонки за период
    const periodCalls =
      startDate && endDate
        ? teamRecords.filter(
            (r) =>
              r.status_updated_at &&
              r.status_updated_at.toISOString().split("T")[0] >= startDate &&
              r.status_updated_at.toISOString().split("T")[0] <= endDate
          ).length
        : totalCalls;
    // Звонки за выбранный день
    const todayDate =
      startDate && endDate && startDate === endDate
        ? startDate
        : new Date().toISOString().split("T")[0];
    const todayCalls = teamRecords.filter(
      (r) =>
        r.status_updated_at &&
        r.status_updated_at.toISOString().split("T")[0] === todayDate
    ).length;
    // Динамика по дням
    const callsByDay = days.map((d) => ({
      date: d,
      count: teamRecords.filter(
        (r) =>
          r.status_updated_at &&
          r.status_updated_at.toISOString().split("T")[0] === d
      ).length,
    }));
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount,
      totalCalls,
      periodCalls,
      todayCalls,
      callsByDay,
    };
  });

  // Общая статистика
  const totalTeams = allTeams.length;
  const totalMembers = Object.values(teamMembersMap).reduce(
    (acc, arr) => acc + arr.length,
    0
  );
  const totalCalls = recordsRaw.filter((r) => r.tag !== "no used").length;
  const periodCalls =
    startDate && endDate
      ? recordsRaw.filter(
          (r) =>
            r.tag !== "no used" &&
            r.status_updated_at &&
            r.status_updated_at.toISOString().split("T")[0] >= startDate &&
            r.status_updated_at.toISOString().split("T")[0] <= endDate
        ).length
      : totalCalls;
  const todayDate =
    startDate && endDate && startDate === endDate
      ? startDate
      : new Date().toISOString().split("T")[0];
  const todayCalls = recordsRaw.filter(
    (r) =>
      r.tag !== "no used" &&
      r.status_updated_at &&
      r.status_updated_at.toISOString().split("T")[0] === todayDate
  ).length;
  const callsByDay = days.map((d) => ({
    date: d,
    count: recordsRaw.filter(
      (r) =>
        r.tag !== "no used" &&
        r.status_updated_at &&
        r.status_updated_at.toISOString().split("T")[0] === d
    ).length,
  }));

  return {
    status: "success",
    data: {
      overallStats: {
        totalTeams,
        totalMembers,
        totalCalls,
        periodCalls,
        todayCalls,
        callsByDay,
      },
      teams: teamStats,
    },
  };
});
