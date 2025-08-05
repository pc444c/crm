import { db } from "..";
import { users, userTeams } from "../schema";
import { eq } from "drizzle-orm";
// Хендлер для добавления нового пользователя
export default defineEventHandler(async (event) => {
  // Получение тела запроса
  const body = await readBody(event);
  // login password teamId
  const { login, password, teamId } = body;
  // Проверка на наличие пользователя с таким именем
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.login, login))
    .limit(1);
  // Если пользователь с таким именем уже существует, то возвращаем ошибку
  if (existingUser.length > 0) {
    return {
      status: "error",
      message: "Пользователь с таким именем уже существует",
    };
  }

  try {
    // Начинаем транзакцию
    // Если пользователя с таким именем нет, то создаем нового пользователя
    const [newUser] = await db
      .insert(users)
      .values({ login, password })
      .returning({ id: users.id, username: users.login, role: users.role });

    // Если указана команда, добавляем пользователя в эту команду
    if (teamId) {
      await db.insert(userTeams).values({
        user_id: newUser.id,
        team_id: teamId,
      });
    }

    // Возвращаем успешный ответ с информацией о новом пользователе
    return {
      status: "success",
      message: "Пользователь успешно добавлен",
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
    };
  } catch (error) {
    console.error("Ошибка при создании пользователя:", error);
    return {
      status: "error",
      message: "Произошла ошибка при создании пользователя",
    };
  }
});
