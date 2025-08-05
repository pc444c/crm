import { defineEventHandler, getQuery } from "h3";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

// Создаем локальное хранилище с использованием файловой системы
const storage = createStorage({
  driver: fsDriver({ base: "./tmp/phone-cache" }),
});

const errorStorage = createStorage({
  driver: fsDriver({ base: "./tmp/phone-errors" }),
});

export default defineEventHandler(async (event) => {
  // Получаем параметры запроса в начале обработчика, чтобы они были доступны и в блоке catch
  const query = getQuery(event);
  const phone = query.phone;
  const forceRefresh = query.forceRefresh === "true";

  try {
    if (!phone || typeof phone !== "string") {
      throw new Error("Телефон не указан или неверный формат");
    }

    // Форматируем номер телефона - удаляем все, кроме цифр, включая +, (, ), -, пробелы
    const cleanPhone = phone.replace(/[^\d]/g, "");

    // Убеждаемся, что это российский номер и он имеет правильную длину
    if (
      cleanPhone.length !== 11 ||
      (!cleanPhone.startsWith("7") && !cleanPhone.startsWith("8"))
    ) {
      throw new Error(
        "Неверный формат номера телефона. Ожидается российский номер"
      );
    }

    // Преобразуем номер к формату с кодом страны 7, если начинается с 8
    const formattedPhone = cleanPhone.startsWith("8")
      ? "7" + cleanPhone.slice(1)
      : cleanPhone;

    // Используем кеширование для избежания повторных запросов
    const cacheKey = `phone:${formattedPhone}`;

    // Проверяем кеш, если не требуется принудительное обновление
    if (!forceRefresh) {
      try {
        const cachedData = await storage.getItem(cacheKey);
        if (cachedData) {
          console.log(`Данные получены из кеша для номера: ${formattedPhone}`);
          return {
            status: "success",
            data: cachedData,
            source: "cache",
          };
        }
      } catch (cacheError) {
        console.warn(`Не удалось получить данные из кеша: ${cacheError}`);
        // Продолжаем выполнение и делаем запрос к API
      }
    }

    // Запрос к HTMLWeb API (без API ключа)
    const apiUrl = `https://htmlweb.ru/json/mnp/phone/${formattedPhone}`;
    console.log(`Отправка запроса к API: ${apiUrl}`);

    // Выполняем запрос с обработкой ошибок сети
    let response;
    try {
      response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(
          `Ошибка HTTP: ${response.status} ${response.statusText}`
        );
      }
    } catch (fetchError) {
      throw new Error(
        `Ошибка сетевого запроса: ${
          fetchError instanceof Error
            ? fetchError.message
            : "Неизвестная ошибка"
        }`
      );
    }

    // Парсим JSON ответ
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Ошибка при разборе JSON ответа от API");
    }

    console.log("Ответ от API HTMLWeb:", JSON.stringify(data, null, 2));

    // Проверка на ошибку в ответе API
    if (data.error) {
      throw new Error(`Ошибка API: ${data.error}`);
    }

    // В ответе HTMLWeb API статус 200 означает успех
    if (!data.status || data.status !== 200) {
      throw new Error(`Ошибка API: Неверный статус ответа ${data.status}`);
    }

    // Проверяем наличие номера телефона в ответе
    if (!data.phone) {
      throw new Error("API не вернуло данные о номере телефона");
    }

    // Извлекаем и форматируем только нужные данные для более чистого ответа
    const formattedData = {
      phone: data.phone,
      operator: data.operator?.name || "",
      region: data.region?.name || "",
      mnp: data.mnp || null,
      timezone: data.region?.timezone || "",
      mcc: data.country?.mcc || "",
      mnc: data.operator?.mnc || "",
      requestTime: new Date().toISOString(),
    };

    // Сохраняем результат в кеш
    try {
      await storage.setItem(cacheKey, formattedData);
      console.log(`Данные для номера ${formattedPhone} сохранены в кеш`);
    } catch (cacheError) {
      console.warn(`Не удалось сохранить данные в кеш: ${cacheError}`);
      // Продолжаем выполнение и возвращаем данные клиенту
    }

    return {
      status: "success",
      data: formattedData,
      source: "api",
    };
  } catch (error) {
    console.error("Ошибка при проверке номера:", error);

    // Логируем ошибку для дальнейшего анализа
    const errorTime = new Date().toISOString();
    const errorDetails = {
      timestamp: errorTime,
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
      phoneQuery: phone ? String(phone) : "не указан",
    };

    // Сохраняем информацию об ошибках в отдельное хранилище
    try {
      await errorStorage.setItem(`error:${errorTime}`, errorDetails);
    } catch (storageError) {
      console.error("Не удалось сохранить данные об ошибке:", storageError);
    }

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Не удалось выполнить проверку номера",
      errorId: errorTime,
    };
  }
});
