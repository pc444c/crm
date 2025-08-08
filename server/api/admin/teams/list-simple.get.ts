import { db } from "../../..";
import { teams } from "../../../schema";

export default defineEventHandler(async () => {
  try {
    console.log("Запрос списка команд...");
    const teamsList = await db
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teams)
      .orderBy(teams.name);

    console.log("Найдено команд:", teamsList.length);
    return {
      status: "success",
      teams: teamsList,
    };
  } catch (error) {
    console.error("Ошибка при получении списка команд:", error);
    console.error("Stack trace:", (error as Error).stack);
    return {
      status: "error",
      message: "Не удалось получить список команд",
      error: (error as Error).message,
    };
  }
});
