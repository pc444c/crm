import { db } from "../../..";
import { userTeams } from "../../../schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const { teamId, userId } = await readBody(event);

    console.log(
      "Удаление пользователя из команды, teamId:",
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

    // Удаляем пользователя из команды
    await db
      .delete(userTeams)
      .where(and(eq(userTeams.team_id, teamId), eq(userTeams.user_id, userId)));

    console.log("Пользователь успешно удален из команды");

    return {
      status: "success",
      message: "Пользователь удален из команды",
    };
  } catch (error) {
    console.error("Ошибка при удалении пользователя из команды:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : "Внутренняя ошибка сервера",
    });
  }
});
