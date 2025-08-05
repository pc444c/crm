import { db } from "..";
import { readBody } from "h3";
import { eq, inArray } from "drizzle-orm";
import { databases, records } from "../schema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { dbname, dbdates } = body;

  const existingDb = await db
    .select()
    .from(databases)
    .where(eq(databases.name, dbname))
    .limit(1);

  if (existingDb.length > 0) {
    return {
      status: "error",
      message: "База данных с таким именем уже существует",
    };
  }

  const [newDb] = await db
    .insert(databases)
    .values({ name: dbname })
    .returning({ id: databases.id });

  const newDbId = newDb.id;

  // Инициализируем переменные для статистики
  let duplicateRecords: any[] = [];
  let recordsToInsert: any[] = [];

  if (dbdates && dbdates.length > 0) {
    // Получаем только записи с телефонами для проверки дубликатов
    const recordsWithPhones = dbdates.filter(
      (record: any) => record.phone && String(record.phone).trim() !== ""
    );
    const phones = recordsWithPhones.map((record: any) =>
      String(record.phone).trim()
    );

    let existingPhones: string[] = [];
    if (phones.length > 0) {
      // Проверяем дубликаты во всех БД
      const existingRecords = await db
        .select({ phone: records.phone })
        .from(records)
        .where(inArray(records.phone, phones));

      existingPhones = existingRecords.map((r: any) => String(r.phone));
    }

    // Разделяем записи на уникальные и дубликаты
    const uniqueRecords = dbdates.filter((record: any) => {
      // Если нет телефона - считаем уникальной
      if (!record.phone || String(record.phone).trim() === "") {
        return true;
      }
      // Если есть телефон - проверяем, есть ли он в существующих
      return !existingPhones.includes(String(record.phone).trim());
    });

    duplicateRecords = dbdates.filter((record: any) => {
      // Только записи с телефонами могут быть дубликатами
      if (!record.phone || String(record.phone).trim() === "") {
        return false;
      }
      return existingPhones.includes(String(record.phone).trim());
    });

    // Если все записи с телефонами являются дубликатами и нет записей без телефонов
    if (uniqueRecords.length === 0) {
      // Удаляем созданную БД, так как нечего в неё добавлять
      await db.delete(databases).where(eq(databases.id, newDbId));

      return {
        status: "error",
        message: `Все записи (${duplicateRecords.length}) уже существуют в базе данных. База данных не создана.`,
        statistics: {
          inserted: 0,
          duplicates: duplicateRecords.length,
          total: dbdates.length,
        },
      };
    }

    recordsToInsert = uniqueRecords.map((record: any) => ({
      database_id: newDbId,
      title: record.title ?? null,
      number: record.number ?? null,
      fio: record.fio ?? null,
      city: record.city ?? null,
      region: record.region ?? null,
      address: record.address ?? null,
      age: record.age ?? null,
      phone: record.phone ?? null,
      timezone: record.timezone ?? null,
      custom1: record.custom1 ?? null,
      custom2: record.custom2 ?? null,
      custom3: record.custom3 ?? null,
      description: record.description ?? null,
      tag: record.tag ?? "no used",
    }));

    if (recordsToInsert.length > 0) {
      await db.insert(records).values(recordsToInsert);
    }

    return {
      status: "success",
      message: `База данных успешно создана! Добавлено записей: ${
        recordsToInsert.length
      }${
        duplicateRecords.length > 0
          ? `, дубликатов пропущено: ${duplicateRecords.length}`
          : ""
      }`,
      database: {
        id: newDbId,
        name: dbname,
      },
      statistics: {
        inserted: recordsToInsert.length,
        duplicates: duplicateRecords.length,
        total: dbdates.length,
      },
    };
  }

  return {
    status: "success",
    message: "База данных создана, но записи не добавлены!",
    database: {
      id: newDbId,
      name: dbname,
    },
    statistics: {
      inserted: 0,
      duplicates: 0,
      total: 0,
    },
  };
});
