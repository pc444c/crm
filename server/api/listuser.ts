import { db } from "..";
import { users } from "../schema";
import { eq, desc } from "drizzle-orm";

// Хендлер для получения списка пользователей
export default defineEventHandler(async () => {
    // Получение всех пользователей из базы данных c ролей user
    const allUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, "user"))
        .orderBy(desc(users.created_at));
   
    
    // Формирование ответа с информацией о пользователях
    return {
        status: "success",
        message: "Список пользователей успешно загружен",
        users: allUsers.map(user => ({
            id: user.id,
            login: user.login,
            role: user.role,
            created_at: user.created_at
        })),
    };
});