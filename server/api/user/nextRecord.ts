import { db } from "../..";
import { records, tags, userTeams, teamDatabases, users } from "../../schema";
import { eq, and, asc, isNull, inArray } from "drizzle-orm";

// Получить следующую запись данных для пользователя и обновить текущую
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { userId, currentRecordId, newTag } = body;

  // Проверяем параметры
  if (!userId || isNaN(Number(userId))) {
    return {
      success: false,
      error: "Некорректный идентификатор пользователя",
    };
  }

  const userIdNum = Number(userId);

  try {
    // Проверяем существование пользователя и получаем его роль
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

    if (userResult.length === 0) {
      return {
        success: false,
        error: "Пользователь не найден",
      };
    }

    const user = userResult[0];

    // Если есть текущая запись и новый тег, обновляем её
    if (currentRecordId && newTag) {
      // Устанавливаем финальный тег для записи
      await db
        .update(records)
        .set({
          tag: newTag,
          status_updated_at: new Date(),
        })
        .where(eq(records.id, currentRecordId))
        .execute();
    }

    // Получаем все теги для дополнительной информации
    const allTags = await db.select().from(tags).execute();

    // ВАЖНО: Сначала ищем уже назначенные пользователю записи "used"
    // БЕЗ ограничения по командам (чтобы он мог завершить работу с ними)
    let recordResult = await db
      .select()
      .from(records)
      .where(and(eq(records.tag, "used"), eq(records.user_id, userIdNum)))
      .orderBy(asc(records.used_at))
      .limit(1)
      .execute();

    console.log(
      `[nextRecord] Найдено уже назначенных записей "used" для пользователя ${userIdNum}:`,
      recordResult.length
    );

    // Если нет уже назначенных записей "used", ищем новые записи "no used"
    if (recordResult.length === 0) {
      // Для обычных пользователей проверяем доступ через команды только для новых записей
      if (user.role !== "admin") {
        console.log(
          `[nextRecord] Проверка доступа через команды для пользователя ${userIdNum}`
        );

        // Получаем команды пользователя
        const userTeamsResult = await db
          .select({ team_id: userTeams.team_id })
          .from(userTeams)
          .where(eq(userTeams.user_id, userIdNum));

        if (userTeamsResult.length === 0) {
          return {
            success: false,
            error:
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
            success: false,
            error: "У ваших команд нет доступа к базам данных.",
          };
        }

        const accessibleDatabaseIds = accessibleDatabasesResult.map(
          (result) => result.database_id
        );

        // Ищем новые записи только из доступных баз данных
        recordResult = await db
          .select()
          .from(records)
          .where(
            and(
              eq(records.tag, "no used"),
              isNull(records.user_id),
              inArray(records.database_id, accessibleDatabaseIds)
            )
          )
          .orderBy(asc(records.created_at))
          .limit(1)
          .execute();

        console.log(
          `[nextRecord] Найдено новых записей "no used" в доступных базах:`,
          recordResult.length
        );
      } else {
        // Для админов ищем любые новые записи
        console.log(`[nextRecord] Поиск новых записей для админа ${userIdNum}`);

        recordResult = await db
          .select()
          .from(records)
          .where(and(eq(records.tag, "no used"), isNull(records.user_id)))
          .orderBy(asc(records.created_at))
          .limit(1)
          .execute();
      }

      // Если нашли новую запись, назначаем её пользователю
      if (recordResult.length > 0) {
        const record = recordResult[0];
        await db
          .update(records)
          .set({
            user_id: userIdNum,
            tag: "used",
            used_at: new Date(),
            status_updated_at: new Date(),
          })
          .where(eq(records.id, record.id))
          .execute();

        // Обновляем локальный объект
        record.tag = "used";
        record.user_id = userIdNum;
      }
    }

    if (recordResult.length === 0) {
      return {
        success: false,
        error: "Нет доступных записей",
      };
    }

    const record = recordResult[0];

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
