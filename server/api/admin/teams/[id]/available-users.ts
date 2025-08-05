import { db } from "../../../../";
import { users, userTeams } from "../../../../schema";
import { notInArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  // Проверка прав доступа - должен быть администратор
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied. Admin role required.",
    });
  }

  const teamId = Number(event.context.params?.id);
  if (!teamId || isNaN(teamId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid team ID",
    });
  }

  try {
    // Получаем ID всех пользователей, которые уже состоят в каких-либо командах
    const allTeamMembers = await db
      .select({ user_id: userTeams.user_id })
      .from(userTeams);

    const allTeamMemberIds = allTeamMembers.map((member) => member.user_id);

    // Получаем список пользователей, которые не состоят ни в одной команде
    let availableUsers;
    if (allTeamMemberIds.length > 0) {
      availableUsers = await db
        .select({
          id: users.id,
          login: users.login,
          role: users.role,
        })
        .from(users)
        .where(notInArray(users.id, allTeamMemberIds));
    } else {
      // Если нет пользователей в командах, возвращаем всех пользователей
      availableUsers = await db
        .select({
          id: users.id,
          login: users.login,
          role: users.role,
        })
        .from(users);
    }

    return {
      status: "success",
      message: "Список доступных пользователей получен",
      users: availableUsers,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Ошибка при получении доступных пользователей для команды ${teamId}:`,
      errorMessage
    );

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch available users",
      data: { error: errorMessage },
    });
  }
});
