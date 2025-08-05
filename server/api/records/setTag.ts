import { db } from "../../index";
import { records, tags, userTeams, teamDatabases } from "../../schema";
import { defineEventHandler, readBody } from "h3";
import { eq, inArray } from "drizzle-orm";
import { verifyAuth } from "../../utils/jwt";

// API для назначения тега записи
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
    const { recordId, tagId, comment } = body;

    // Проверяем обязательные поля
    if (!recordId || !tagId) {
      return {
        status: "error",
        message: "ID записи и ID тега обязательны",
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

    // Получаем запись для проверки существования и доступа
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
      // разрешаем ему завершить работу с ней (отправить тег),
      // даже если его удалили из команды
      if (currentRecord.user_id === userData.id) {
        console.log(
          `Разрешение завершить работу с записью ${recordId} для пользователя ${userData.id} (запись уже назначена ему)`
        );
        // Пропускаем проверку команд и разрешаем завершить работу
      } else {
        // Для новых записей проверяем доступ через команды
        console.log(
          `Проверка доступа через команды для записи ${recordId} и пользователя ${userData.id}`
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
    // const currentUserId = currentRecord[0].user_id;

    // Обновляем запись с новым тегом, комментарием и сохраняем ID пользователя, который его обработал
    const updateData: Record<string, unknown> = {
      tag: tagName,
      status_updated_at: new Date(),
      user_id: userData.id, // Сохраняем ID пользователя, который назначил тег
    };

    // Если комментарий передан, сохраняем его
    if (comment !== undefined) {
      updateData.description = comment;
    }

    const [updatedRecord] = await db
      .update(records)
      .set(updateData)
      .where(eq(records.id, recordId))
      .returning();

    return {
      status: "success",
      message: "Тег успешно назначен",
      record: updatedRecord,
    };
  } catch (error) {
    console.error("Ошибка при назначении тега:", error);
    return {
      status: "error",
      message: "Ошибка при назначении тега",
    };
  }
});
