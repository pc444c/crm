import { defineEventHandler, getQuery } from "h3";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const phone = query.phone;

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

    return {
      status: "success",
      data: data,
    };
  } catch (error) {
    console.error("Ошибка при проверке номера:", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Не удалось выполнить проверку номера",
    };
  }
});
