import { db } from "~~/server";
import {
  users,
  records,
  tags,
  userTeams,
  teamDatabases,
} from "~~/server/schema";
import { defineEventHandler, readBody } from "h3";
import { eq, and, asc, isNull, inArray } from "drizzle-orm";

// Получить запись данных для пользователя
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const userIdRaw = body.userId;
  const skipMarking = body.skipMarking || false; // Параметр для пропуска маркировки

  const userId = Number(userIdRaw);

  // Проверяем корректность ID пользователя
  if (!userId || isNaN(userId)) {
    return {
      success: false,
      error: "Некорректный или отсутствует userId",
    };
  }

  try {
    // Проверяем существование пользователя
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    const user = userResult[0];
    if (!user) {
      return {
        success: false,
        error: "Пользователь не найден",
      };
    }

    // Получаем список всех тегов
    const allTags = await db.select().from(tags).execute();

    // Проверяем, является ли пользователь администратором
    if (user.role === "admin") {
      // Для админов доступны все записи (старая логика)
    } else {
      // Для обычных пользователей проверяем доступ через команды

      // Получаем команды пользователя
      const userTeamsResult = await db
        .select({ team_id: userTeams.team_id })
        .from(userTeams)
        .where(eq(userTeams.user_id, userId));

      if (userTeamsResult.length === 0) {
        // Пользователь не состоит ни в одной команде - нет доступа к записям
        return {
          success: false,
          error:
            "У вас нет доступа к базам данных. Обратитесь к администратору для получения доступа через команду.",
        };
      }

      const teamIds = userTeamsResult.map((result) => result.team_id);

      // Получаем базы данных, к которым есть доступ через команды
      const accessibleDatabasesResult = await db
        .select({ database_id: teamDatabases.database_id })
        .from(teamDatabases)
        .where(inArray(teamDatabases.team_id, teamIds));

      if (accessibleDatabasesResult.length === 0) {
        // У команд пользователя нет доступа ни к одной базе данных
        return {
          success: false,
          error:
            "У ваших команд нет доступа к базам данных. Обратитесь к администратору.",
        };
      }

      const accessibleDatabaseIds = accessibleDatabasesResult.map(
        (result) => result.database_id
      );

      // Теперь ищем записи только из доступных баз данных
      // Сначала ищем записи со статусом "used" (приоритет) из доступных баз
      let recordResult = await db
        .select()
        .from(records)
        .where(
          and(
            eq(records.tag, "used"),
            eq(records.user_id, userId), // Только записи этого пользователя
            inArray(records.database_id, accessibleDatabaseIds) // Только из доступных баз
          )
        )
        .orderBy(asc(records.used_at))
        .limit(1)
        .execute();

      // Если нет записей "used" для этого пользователя, ищем новые записи "no used" из доступных баз
      if (recordResult.length === 0) {
        recordResult = await db
          .select()
          .from(records)
          .where(
            and(
              eq(records.tag, "no used"),
              isNull(records.user_id),
              inArray(records.database_id, accessibleDatabaseIds) // Только из доступных баз
            )
          )
          .orderBy(asc(records.created_at))
          .limit(1)
          .execute();
      }

      const record = recordResult[0];

      if (!record) {
        return {
          success: false,
          error: "Нет доступных записей в ваших базах данных",
        };
      }

      // Продолжаем обработку записи...
      // Если запись не назначена пользователю и не надо пропускать маркировку
      if (!record.user_id && !skipMarking) {
        // Обновляем запись - назначаем пользователя, устанавливаем статус "used" и время использования
        await db
          .update(records)
          .set({
            user_id: userId,
            tag: "used", // Меняем статус с "no used" на "used"
            used_at: new Date(),
            status_updated_at: new Date(),
          })
          .where(eq(records.id, record.id))
          .execute();

        // Обновляем локальный объект записи
        record.tag = "used";
        record.user_id = userId;
      }

      // Находим соответствующий тег, если он есть
      let tagInfo = null;
      if (record.tag) {
        const tagMatch = allTags.find((t) => t.name === record.tag);
        if (tagMatch) {
          tagInfo = {
            id: tagMatch.id,
            name: tagMatch.name,
            color: tagMatch.color,
          };
        }
      }

      // Возвращаем найденную запись с дополнительной информацией о теге
      return {
        success: true,
        record: {
          ...record,
          tagInfo,
          tagId: tagInfo ? tagInfo.id : null,
        },
      };
    }

    // Старая логика для администраторов (без ограничений по командам)

    // Сначала ищем записи со статусом "used" (приоритет)
    let recordResult = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.tag, "used"),
          eq(records.user_id, userId) // Только записи этого пользователя
        )
      )
      .orderBy(asc(records.used_at))
      .limit(1)
      .execute();

    // Если нет записей "used" для этого пользователя, ищем новые записи "no used"
    if (recordResult.length === 0) {
      recordResult = await db
        .select()
        .from(records)
        .where(and(eq(records.tag, "no used"), isNull(records.user_id)))
        .orderBy(asc(records.created_at))
        .limit(1)
        .execute();
    }

    const record = recordResult[0];

    if (!record) {
      return {
        success: false,
        error: "Нет доступных записей",
      };
    }

    // Если запись не назначена пользователю и не надо пропускать маркировку
    if (!record.user_id && !skipMarking) {
      // Обновляем запись - назначаем пользователя, устанавливаем статус "used" и время использования
      await db
        .update(records)
        .set({
          user_id: userId,
          tag: "used", // Меняем статус с "no used" на "used"
          used_at: new Date(),
          status_updated_at: new Date(),
        })
        .where(eq(records.id, record.id))
        .execute();

      // Обновляем локальный объект записи
      record.tag = "used";
      record.user_id = userId;
    }

    // Находим соответствующий тег, если он есть
    let tagInfo = null;
    if (record.tag) {
      const tagMatch = allTags.find((t) => t.name === record.tag);
      if (tagMatch) {
        tagInfo = {
          id: tagMatch.id,
          name: tagMatch.name,
          color: tagMatch.color,
        };
      }
    }

    // Возвращаем найденную запись с дополнительной информацией о теге
    return {
      success: true,
      record: {
        ...record,
        tagInfo,
        tagId: tagInfo ? tagInfo.id : null,
      },
    };
  } catch (error) {
    console.error("Ошибка при получении записи:", error);
    return {
      success: false,
      error: "Ошибка при получении записи",
    };
  }
});
