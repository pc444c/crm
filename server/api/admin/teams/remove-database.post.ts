import { db } from "../../..";
import { teamDatabases } from "../../../schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const { teamId, databaseId } = await readBody(event);

    console.log(
      "Удаление доступа к базе данных, teamId:",
      teamId,
      "databaseId:",
      databaseId
    );

    if (!teamId || !databaseId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Необходимы teamId и databaseId",
      });
    }

    // Удаляем доступ к базе данных
    await db
      .delete(teamDatabases)
      .where(
        and(
          eq(teamDatabases.team_id, teamId),
          eq(teamDatabases.database_id, databaseId)
        )
      );

    console.log("Доступ к базе данных успешно отозван");

    return {
      status: "success",
      message: "Доступ к базе данных отозван",
    };
  } catch (error) {
    console.error("Ошибка при отзыве доступа к базе данных:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : "Внутренняя ошибка сервера",
    });
  }
});
