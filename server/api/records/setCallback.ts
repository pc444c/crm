import { db } from "../../index";
import { records, userTeams, teamDatabases, tags } from "../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq, inArray } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// API для назначения перезвона
export default defineEventHandler(async (event) => {
  try {
    // Получаем информацию об авторизованном пользователе
    const userData = await verifyAuth(event);

    if (!userData) {
      return {
        status: "error",
        message: "Не авторизован",
        code: 401,
      };
    }

    const body = await readBody(event);
    const { recordId, tagId, callbackTime, callbackComment } = body;

    // Проверяем обязательные поля
    if (!recordId || !tagId || !callbackTime) {
      return {
        status: "error",
        message: "ID записи, ID тега и время перезвона обязательны",
      };
    }

    // Получаем тег для получения имени
    const tagResult = await db
      .select()
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (tagResult.length === 0) {
      return {
        status: "error",
        message: "Тег не найден",
      };
    }

    const tagName = tagResult[0].name;

    // Получаем запись для проверки существования
    const recordResult = await db
      .select()
      .from(records)
      .where(eq(records.id, recordId))
      .limit(1);

    if (recordResult.length === 0) {
      return {
        status: "error",
        message: "Запись не найдена",
      };
    }

    const currentRecord = recordResult[0];

    // Проверяем доступ к базе данных через команды (если пользователь не админ)
    if (userData.role !== "admin") {
      // ВАЖНО: Если запись уже назначена текущему пользователю,
      // разрешаем ему завершить работу с ней (установить перезвон),
      // даже если его удалили из команды
      if (currentRecord.user_id === userData.id) {
        console.log(
          `Разрешение установить перезвон для записи ${recordId} пользователем ${userData.id} (запись уже назначена ему)`
        );
        // Пропускаем проверку команд и разрешаем завершить работу
      } else {
        // Для новых записей проверяем доступ через команды
        console.log(
          `Проверка доступа через команды для установки перезвона записи ${recordId} пользователем ${userData.id}`
        );

        // Получаем команды пользователя
        const userTeamsResult = await db
          .select({ team_id: userTeams.team_id })
          .from(userTeams)
          .where(eq(userTeams.user_id, userData.id));

        if (userTeamsResult.length === 0) {
          return {
            status: "error",
            message:
              "У вас нет доступа к базам данных. Обратитесь к администратору.",
          };
        }

        const teamIds = userTeamsResult.map((result) => result.team_id);

        // Получаем базы данных, к которым есть доступ через команды
        const accessibleDatabasesResult = await db
          .select({ database_id: teamDatabases.database_id })
          .from(teamDatabases)
          .where(inArray(teamDatabases.team_id, teamIds));

        if (accessibleDatabasesResult.length === 0) {
          return {
            status: "error",
            message: "У ваших команд нет доступа к базам данных.",
          };
        }

        const accessibleDatabaseIds = accessibleDatabasesResult.map(
          (result) => result.database_id
        );

        // Проверяем, что запись принадлежит к доступной базе данных
        if (!accessibleDatabaseIds.includes(currentRecord.database_id)) {
          return {
            status: "error",
            message: "У вас нет доступа к этой базе данных.",
          };
        }
      }
    }

    // Обновляем запись с новым тегом, временем перезвона и комментарием к перезвону
    const updateData: {
      tag: string;
      callback_time: Date;
      status_updated_at: Date;
      user_id: number;
      callback_comment?: string;
    } = {
      tag: tagName,
      callback_time: new Date(callbackTime),
      status_updated_at: new Date(),
      user_id: userData.id,
    };

    // Если есть комментарий к перезвону, добавляем его в отдельное поле
    if (callbackComment) {
      updateData.callback_comment = callbackComment;
    }

    const [updatedRecord] = await db
      .update(records)
      .set(updateData)
      .where(eq(records.id, recordId))
      .returning();

    return {
      status: "success",
      message: "Перезвон успешно назначен",
      record: updatedRecord,
    };
  } catch (error) {
    console.error("Ошибка при назначении перезвона:", error);
    return {
      status: "error",
      message: "Ошибка при назначении перезвона",
    };
  }
});
