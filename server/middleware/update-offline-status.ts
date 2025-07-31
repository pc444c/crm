import { db } from "../index";
import { users } from "../schema";
import { eq, lt } from "drizzle-orm";

// Middleware для автоматического перевода пользователей в статус оффлайн
// при отсутствии активности более 3 минут
export default defineEventHandler(async (event) => {
  // Пропускаем запросы на пути, связанные с обновлением статуса,
  // чтобы избежать циклических обновлений
  const path = getRequestURL(event).pathname;
  if (path === "/api/user/updateStatus" || path === "/api/user/setOffline") {
    return;
  }

  try {
    // Устанавливаем предельное время неактивности (3 минуты назад)
    const inactiveTime = new Date();
    inactiveTime.setMinutes(inactiveTime.getMinutes() - 3);

    // Получаем всех пользователей со статусом "online"
    const onlineUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_online, "online"));

    // Проверяем каждого пользователя и обновляем статус если нужно
    for (const user of onlineUsers) {
      // Если последняя активность была более 3 минут назад или отсутствует,
      // устанавливаем статус "offline"
      if (!user.last_activity || new Date(user.last_activity) < inactiveTime) {
        await db
          .update(users)
          .set({ is_online: "offline" })
          .where(eq(users.id, user.id));
      }
    }
  } catch (error) {
    console.error("Ошибка при автоматическом обновлении статусов:", error);
  }
});
