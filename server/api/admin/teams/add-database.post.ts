import { db } from "../../..";
import { teamDatabases } from "../../../schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const { teamId, databaseId } = await readBody(event);

    console.log(
      "Добавление доступа к базе данных, teamId:",
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

    // Проверяем, нет ли уже доступа к этой базе
    const existingAccess = await db
      .select()
      .from(teamDatabases)
      .where(
        and(
          eq(teamDatabases.team_id, teamId),
          eq(teamDatabases.database_id, databaseId)
        )
      )
      .limit(1);

    if (existingAccess.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Доступ к базе данных уже предоставлен",
      });
    }

    // Добавляем доступ к базе данных
    await db.insert(teamDatabases).values({
      team_id: teamId,
      database_id: databaseId,
    });

    console.log("Доступ к базе данных успешно предоставлен");

    return {
      status: "success",
      message: "Доступ к базе данных предоставлен",
    };
  } catch (error) {
    console.error("Ошибка при предоставлении доступа к базе данных:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : "Внутренняя ошибка сервера",
    });
  }
});
