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

  if (dbdates && dbdates.length > 0) {
    const phones = dbdates
      .map((record: any) => record.phone)
      .filter((p: any) => p != null);

    let existingPhones: any[] = [];
    if (phones.length > 0) {
      const existingRecords = await db
        .select({ phone: records.phone })
        .from(records)
        .where(eq(records.database_id, newDbId))
        .where(inArray(records.phone, phones)); // ✅ ВАЖНО: тут inArray

      existingPhones = existingRecords.map((r: any) => r.phone);
    }

    const uniqueRecords = dbdates.filter(
      (record: any) => !existingPhones.includes(record.phone)
    );

    const recordsToInsert = uniqueRecords.map((record: any) => ({
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
  }

  return {
    status: "success",
    message: "База данных успешно создана",
    database: {
      id: newDbId,
      name: dbname,
    },
  };
});
