import { db } from "../../../../";
import { userTeams, users } from "../../../../schema";
import { eq } from "drizzle-orm";

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
    console.log("API: Запрос участников команды, teamId:", teamId);

    // Получаем список участников команды с дополнительной информацией из таблицы users
    const teamMembers = await db
      .select({
        id: users.id,
        login: users.login,
        role: users.role,
      })
      .from(userTeams)
      .innerJoin(users, eq(userTeams.user_id, users.id))
      .where(eq(userTeams.team_id, teamId));

    console.log("API: Найдено участников:", teamMembers.length);

    return {
      status: "success",
      message: "Список участников команды успешно получен",
      members: teamMembers,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Ошибка при получении участников команды ${teamId}:`,
      errorMessage
    );

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch team members",
      data: { error: errorMessage },
    });
  }
});
