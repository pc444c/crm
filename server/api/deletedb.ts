import { db } from "..";
import { databases, records } from "../schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { dbId } = body;

  const existingDb = await db
    .select()
    .from(databases)
    .where(eq(databases.id, dbId))
    .limit(1);

  if (existingDb.length === 0) {
    return {
      status: "error",
      message: "База данных с таким ID не существует",
      id: dbId,
    };
  }

  // 🟢 Сначала удаляем записи
  await db.delete(records).where(eq(records.database_id, dbId));

  // 🔵 Потом саму базу
  await db.delete(databases).where(eq(databases.id, dbId));

  return {
    status: "success",
    message: "База данных успешно удалена",
  };
});
