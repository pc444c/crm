import { verifyAuth } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем авторизацию пользователя
    const userData = await verifyAuth(event);

    if (!userData) {
      return {
        status: "error",
        message: "Не авторизован",
        code: 401,
      };
    }

    // Проверяем, что пользователь админ
    if (userData.role !== "admin") {
      return {
        status: "error",
        message: "Нет доступа",
        code: 403,
      };
    }

    // Заглушка для детальной статистики тега
    return {
      status: "success",
      data: {
        stats: {
          totalApplications: 245,
          uniqueUsers: 15,
          weeklyApplications: 42,
        },
        users: [
          {
            user_id: 1,
            user_name: "admin",
            applications_count: 89,
            last_used: new Date().toISOString(),
          },
        ],
      },
    };
  } catch (error) {
    console.error("Ошибка получения детальной статистики тега:", error);
    return {
      status: "error",
      message: "Ошибка получения детальной статистики тега",
      data: null,
    };
  }
});
