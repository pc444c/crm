import { db } from "..";
import { databases, records } from "../schema";
import { eq, count } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || user.role !== "admin") {
        return {
            status: "error",
            message: "Доступ запрещен",
        };
    }
    const allDatabases = await db.select().from(databases);
    const databasesWithRecordsCount = await Promise.all(
        allDatabases.map(async (database) => {
            const [{ count: recordsCount }] = await db
                .select({ count: count() })
                .from(records)
                .where(eq(records.database_id, database.id))
                .execute(); // ←
            return {
                ...database,
                recordsCount,
            };
        })
    );
    return {
        status: "success",
        message: "Все базы данных успешно загружены",
        databases: databasesWithRecordsCount,
    };
});
