import { db } from "../../..";
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

  try {
    console.log(
      "API: Запрос на создание команды от пользователя:",
      user.login,
      user.role
    );

    // Получение данных команды из тела запроса
    const body = await readBody(event);
    console.log("API: Получено тело запроса:", JSON.stringify(body));

    const { name, description } = body;

    if (!name) {
      console.log("API: Ошибка - отсутствует название команды");
      throw createError({
        statusCode: 400,
        statusMessage: "Team name is required",
      });
    }

    // Проверяем, существует ли команда с таким именем
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, name))
      .limit(1);

    if (existingTeam.length > 0) {
      console.log("API: Ошибка - команда с названием уже существует:", name);
      throw createError({
        statusCode: 400,
        statusMessage: "Team with this name already exists",
      });
    }

    // Создаем новую команду
    console.log("API: Создаем команду:", name);
    const [newTeam] = await db
      .insert(teams)
      .values({
        name,
        description: description || null,
      })
      .returning();

    console.log("API: Команда успешно создана с ID:", newTeam.id);
    return {
      status: "success",
      message: "Команда успешно создана",
      team: newTeam,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ошибка при создании команды:", errorMessage);

    if (error instanceof Error && error.stack) {
      console.error("Stack:", error.stack);
    }

    // Если это ошибка от createError, прокидываем её дальше
    if (typeof (error as Record<string, unknown>).statusCode === "number") {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create team",
      data: { error: errorMessage },
    });
  }
});
