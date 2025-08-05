import { db } from "../../../";
import { teams } from "../../../schema";
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
    // Получение данных из запроса
    const { name, description } = await readBody(event);

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Team name is required",
      });
    }

    // Проверяем, существует ли другая команда с таким именем
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, name))
      .limit(1);

    if (existingTeam.length > 0 && existingTeam[0].id !== teamId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Team with this name already exists",
      });
    }

    // Обновляем команду
    const [updatedTeam] = await db
      .update(teams)
      .set({
        name,
        description: description || null,
        updated_at: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning();

    return {
      status: "success",
      message: "Команда успешно обновлена",
      team: updatedTeam,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Ошибка при обновлении команды ${teamId}:`, errorMessage);

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update team",
      data: { error: errorMessage },
    });
  }
});
