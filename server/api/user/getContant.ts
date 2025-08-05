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

    // ВАЖНО: СНАЧАЛА проверяем уже назначенные пользователю записи "used"
    // БЕЗ ограничения по командам (чтобы он мог завершить работу с ними)
    console.log(
      `Поиск уже назначенных записей "used" для пользователя ${userId}`
    );

    const usedRecordResult = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.tag, "used"),
          eq(records.user_id, userId) // Только записи этого пользователя
          // НЕ проверяем принадлежность к командам для уже назначенных записей
        )
      )
      .orderBy(asc(records.used_at))
      .limit(1)
      .execute();

    console.log(
      `Найдено уже назначенных записей "used":`,
      usedRecordResult.length
    );

    // Если есть уже назначенная запись, возвращаем её (игнорируя команды)
    if (usedRecordResult.length > 0) {
      const record = usedRecordResult[0];
      console.log(
        `Возвращаем уже назначенную запись ${record.id} для пользователя ${userId}`
      );

      // Находим соответствующий тег
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

      return {
        success: true,
        record: {
          ...record,
          tagInfo,
          tagId: tagInfo ? tagInfo.id : null,
        },
      };
    }

    // Если нет уже назначенных записей, то для новых записей проверяем права через команды
    console.log(
      `Нет назначенных записей для пользователя ${userId}, проверяем доступ к новым записям`
    );

    // Проверяем, является ли пользователь администратором
    if (user.role === "admin") {
      console.log(
        `Пользователь ${userId} является админом - доступ ко всем записям`
      );

      // Для админов ищем любые новые записи "no used"
      const adminRecordResult = await db
        .select()
        .from(records)
        .where(and(eq(records.tag, "no used"), isNull(records.user_id)))
        .orderBy(asc(records.created_at))
        .limit(1)
        .execute();

      console.log(
        `Найдено новых записей "no used" для админа:`,
        adminRecordResult.length
      );

      const record = adminRecordResult[0];

      if (!record) {
        return {
          success: false,
          error: "Нет доступных записей",
        };
      }

      // Назначаем запись админу
      if (!skipMarking) {
        await db
          .update(records)
          .set({
            user_id: userId,
            tag: "used",
            used_at: new Date(),
            status_updated_at: new Date(),
          })
          .where(eq(records.id, record.id))
          .execute();

        // Обновляем локальный объект записи
        record.tag = "used";
        record.user_id = userId;
      }

      // Находим соответствующий тег
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

      return {
        success: true,
        record: {
          ...record,
          tagInfo,
          tagId: tagInfo ? tagInfo.id : null,
        },
      };
    } else {
      console.log(
        `Пользователь ${userId} обычный - проверяем доступ через команды`
      );

      // Для обычных пользователей проверяем доступ через команды только для новых записей
      // Получаем команды пользователя
      const userTeamsResult = await db
        .select({ team_id: userTeams.team_id })
        .from(userTeams)
        .where(eq(userTeams.user_id, userId));

      if (userTeamsResult.length === 0) {
        // Пользователь не состоит ни в одной команде - нет доступа к новым записям
        console.log(`Пользователь ${userId} не состоит ни в одной команде`);
        return {
          success: false,
          error:
            "У вас нет доступа к базам данных. Обратитесь к администратору для получения доступа через команду.",
        };
      }

      const teamIds = userTeamsResult.map((result) => result.team_id);
      console.log(`Пользователь ${userId} состоит в командах:`, teamIds);

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

      // Ищем новые записи "no used" только из доступных через команды баз данных
      console.log(
        `Поиск новых записей "no used" в доступных базах данных для пользователя ${userId}`
      );

      const recordResult = await db
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

      console.log(
        `Найдено новых записей "no used" в доступных базах:`,
        recordResult.length
      );

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
  } catch (error) {
    console.error("Ошибка при получении записи:", error);
    return {
      success: false,
      error: "Ошибка при получении записи",
    };
  }
});
