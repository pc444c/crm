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

    // Заглушка для детальной статистики пользователя
    return {
      status: "success",
      data: {
        stats: {
          totalCalls: 89,
          successfulCalls: 67,
          totalTimeInSystem: 240,
          successRate: 75,
        },
        activity: [
          { date: "2025-01-01", calls: 15, session_time: 120 },
          { date: "2025-01-02", calls: 18, session_time: 145 },
          { date: "2025-01-03", calls: 22, session_time: 160 },
        ],
      },
    };
  } catch (error) {
    console.error("Ошибка получения детальной статистики пользователя:", error);
    return {
      status: "error",
      message: "Ошибка получения детальной статистики пользователя",
      data: null,
    };
  }
});
