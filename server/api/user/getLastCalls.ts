import { db } from "~~/server";
import { records, tags } from "~~/server/schema";
import { eq, sql, and, gte, lte, asc, desc } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  try {
    // РџРѕР»СѓС‡Р°РµРј РїР°СЂР°РјРµС‚СЂС‹ РёР· С‚РµР»Р° Р·Р°РїСЂРѕСЃР°
    const body = await readBody(event);
    const {
      userId,
      limit = 50,
      offset = 0,
      filterStatus,
      sortBy = "status_updated_at",
      sortOrder = "desc",
      dateFrom,
      dateTo,
    } = body;

    if (!userId) {
      return {
        success: false,
        error: "ID РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РЅРµ СѓРєР°Р·Р°РЅ",
      };
    }

    // РџСЂРѕРІРµСЂРєР° РІР°Р»РёРґРЅРѕСЃС‚Рё ID РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return {
        success: false,
        error: "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ ID РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ",
      };
    }

    // Получаем все доступные теги с их цветами
    const tagsList = await db.select().from(tags).execute();

    // Строим условия для запроса
    // Находим все записи, у которых тег не "no used",
    // это будут все обработанные записи в системе
    const conditions = [];

    // По умолчанию исключаем записи со статусом "no used"
    conditions.push(sql`${records.tag} != 'no used'`);

    // Добавляем условие по user_id для показа только записей текущего пользователя
    conditions.push(eq(records.user_id, userIdNum));

    // Р”РѕР±Р°РІР»СЏРµРј С„РёР»СЊС‚СЂ РїРѕ СЃС‚Р°С‚СѓСЃСѓ, РµСЃР»Рё СѓРєР°Р·Р°РЅ
    if (filterStatus) {
      conditions.push(eq(records.tag, filterStatus));
    }

    // Р”РѕР±Р°РІР»СЏРµРј С„РёР»СЊС‚СЂР°С†РёСЋ РїРѕ РґР°С‚Рµ, РµСЃР»Рё СѓРєР°Р·Р°РЅРѕ
    if (dateFrom) {
      conditions.push(gte(records.status_updated_at, new Date(dateFrom)));
    }

    if (dateTo) {
      // Р”РѕР±Р°РІР»СЏРµРј 1 РґРµРЅСЊ Рє РєРѕРЅРµС‡РЅРѕР№ РґР°С‚Рµ, С‡С‚РѕР±С‹ РІРєР»СЋС‡РёС‚СЊ РІРµСЃСЊ РґРµРЅСЊ
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(records.status_updated_at, endDate));
    }

    // РЎС‚СЂРѕРёРј Р±Р°Р·РѕРІС‹Р№ Р·Р°РїСЂРѕСЃ СЃ СѓСЃР»РѕРІРёСЏРјРё
    // Р’ Drizzle ORM РЅСѓР¶РЅРѕ СЃСЂР°Р·Сѓ РѕРїСЂРµРґРµР»РёС‚СЊ СЃРѕСЂС‚РёСЂРѕРІРєСѓ
    let query;

    // РџСЂРёРјРµРЅСЏРµРј СЃРѕСЂС‚РёСЂРѕРІРєСѓ РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ РІС‹Р±СЂР°РЅРЅРѕРіРѕ РїРѕР»СЏ
    if (sortBy === "dateAssign") {
      query = db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(
          sortOrder === "desc" ? desc(records.used_at) : asc(records.used_at)
        );
    } else if (sortBy === "fio") {
      query = db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(sortOrder === "desc" ? desc(records.fio) : asc(records.fio));
    } else if (sortBy === "phone") {
      query = db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(
          sortOrder === "desc" ? desc(records.phone) : asc(records.phone)
        );
    } else {
      // РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ СЃРѕСЂС‚РёСЂРѕРІРєР° РїРѕ РґР°С‚Рµ СЃС‚Р°С‚СѓСЃР°
      query = db
        .select()
        .from(records)
        .where(and(...conditions))
        .orderBy(
          sortOrder === "desc"
            ? desc(records.status_updated_at)
            : asc(records.status_updated_at)
        );
    }

    // Р’С‹РїРѕР»РЅСЏРµРј Р·Р°РїСЂРѕСЃ СЃ РїР°РіРёРЅР°С†РёРµР№
    const recordsList = await query
      .limit(parseInt(limit.toString()))
      .offset(parseInt(offset.toString()))
      .execute();

    // РџРѕР»СѓС‡Р°РµРј РѕР±С‰РµРµ РєРѕР»РёС‡РµСЃС‚РІРѕ Р·Р°РїРёСЃРµР№ РґР»СЏ РїР°РіРёРЅР°С†РёРё СЃ СѓС‡РµС‚РѕРј РІСЃРµС… С„РёР»СЊС‚СЂРѕРІ
    const countQuery = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(records)
      .where(and(...conditions));

    const total = countQuery[0]?.count || 0;

    // РћР±РѕРіР°С‰Р°РµРј Р·Р°РїРёСЃРё РёРЅС„РѕСЂРјР°С†РёРµР№ Рѕ С‚РµРіР°С…
    const enrichedRecords = recordsList.map((record) => {
      const tagInfo = tagsList.find((tag) => tag.name === record.tag);
      return {
        ...record,
        tagInfo: tagInfo
          ? {
              id: tagInfo.id,
              name: tagInfo.name,
              color: tagInfo.color,
              about: tagInfo.about,
            }
          : null,
      };
    });

    return {
      success: true,
      records: enrichedRecords,
      total,
      tags: tagsList,
    };
  } catch (error) {
    console.error(
      "РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЃРїРёСЃРєР° Р·РІРѕРЅРєРѕРІ:",
      error
    );
    return {
      success: false,
      error:
        "РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЃРїРёСЃРєР° Р·РІРѕРЅРєРѕРІ",
    };
  }
});
