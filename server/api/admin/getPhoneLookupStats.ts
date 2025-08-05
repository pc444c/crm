import { defineEventHandler } from "h3";
import { verifyAuth } from "../../utils/jwt";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

// Создаем доступ к хранилищам
const storage = createStorage({
  driver: fsDriver({ base: "./tmp/phone-cache" }),
});

const errorStorage = createStorage({
  driver: fsDriver({ base: "./tmp/phone-errors" }),
});

// Типы данных
interface PhoneLookupData {
  phone: string;
  operator: string;
  region: string;
  mnp: any;
  timezone: string;
  mcc: string;
  mnc: string;
  requestTime: string;
}

interface PhoneLookupError {
  timestamp: string;
  message: string;
  phoneQuery: string;
}

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

    // Получаем хранилища для запросов и ошибок
    const phoneStorage = useStorage("phone-lookup");
    const errorStorage = useStorage("phone-lookup-errors");

    // Получаем все ключи из хранилищ
    const phoneKeys = await phoneStorage.getKeys("phone:");
    const errorKeys = await errorStorage.getKeys("error:");

    // Собираем статистику
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Данные запросов
    let totalRequests = 0;
    let requestsToday = 0;
    let requestsThisWeek = 0;
    let operators = {};
    let regions = {};

    // Получаем все записи из кеша
    const phoneLookups = await Promise.all(
      phoneKeys.map(async (key) => {
        const data = await phoneStorage.getItem(key);
        return {
          key,
          data,
          timestamp: data.requestTime ? new Date(data.requestTime) : null,
        };
      })
    );

    // Анализируем данные
    for (const item of phoneLookups) {
      if (item.data) {
        totalRequests++;

        if (item.timestamp) {
          if (item.timestamp >= oneDayAgo) requestsToday++;
          if (item.timestamp >= oneWeekAgo) requestsThisWeek++;
        }

        // Анализ по операторам
        if (item.data.operator) {
          operators[item.data.operator] =
            (operators[item.data.operator] || 0) + 1;
        }

        // Анализ по регионам
        if (item.data.region) {
          regions[item.data.region] = (regions[item.data.region] || 0) + 1;
        }
      }
    }

    // Анализ ошибок
    const errors = await Promise.all(
      errorKeys.map(async (key) => await errorStorage.getItem(key))
    );

    // Группируем ошибки по типам
    const errorsByType = errors.reduce((acc, error) => {
      if (error && error.message) {
        const errorType = error.message.split(":")[0];
        acc[errorType] = (acc[errorType] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      status: "success",
      data: {
        totalLookups: totalRequests,
        lookupsToday: requestsToday,
        lookupsThisWeek: requestsThisWeek,
        totalErrors: errors.length,
        operators: Object.entries(operators)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        regions: Object.entries(regions)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        errorTypes: Object.entries(errorsByType)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
      },
    };
  } catch (error) {
    console.error("Ошибка при получении статистики проверок номеров:", error);
    return {
      status: "error",
      message: "Ошибка при получении статистики проверок номеров",
    };
  }
});
