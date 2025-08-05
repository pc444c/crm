import { db } from "../../..";
import { userTeams } from "../../../schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const { teamId, userId } = await readBody(event);

    console.log(
      "Добавление пользователя в команду, teamId:",
      teamId,
      "userId:",
      userId
    );

    if (!teamId || !userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Необходимы teamId и userId",
      });
    }

    // Проверяем, не состоит ли пользователь уже в команде
    const existingMember = await db
      .select()
      .from(userTeams)
      .where(and(eq(userTeams.team_id, teamId), eq(userTeams.user_id, userId)))
      .limit(1);

    if (existingMember.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Пользователь уже состоит в команде",
      });
    }

    // Добавляем пользователя в команду
    await db.insert(userTeams).values({
      team_id: teamId,
      user_id: userId,
    });

    console.log("Пользователь успешно добавлен в команду");

    return {
      status: "success",
      message: "Пользователь добавлен в команду",
    };
  } catch (error) {
    console.error("Ошибка при добавлении пользователя в команду:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : "Внутренняя ошибка сервера",
    });
  }
});
