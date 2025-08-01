// ~/utils/dates.ts

/**
 * Форматирует дату в локализованный формат (только дата)
 * @param dateStr Строка даты для форматирования
 * @param locale Локаль для форматирования, по умолчанию 'ru-RU'
 * @returns Отформатированная дата или сообщение об ошибке
 */
export function formatDate(
  dateStr: string | null | undefined,
  locale: string = "ru-RU"
): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Некорректная дата";
    return date.toLocaleDateString(locale);
  } catch (e) {
    console.error("Ошибка форматирования даты:", e);
    return "Ошибка даты";
  }
}

/**
 * Форматирует дату и время в локализованный формат
 * @param dateStr Строка даты для форматирования
 * @param locale Локаль для форматирования, по умолчанию 'ru-RU'
 * @param defaultValue Значение по умолчанию, если дата не указана
 * @returns Отформатированная дата и время или сообщение об ошибке
 */
export function formatFullDate(
  dateStr: string | null | undefined,
  locale: string = "ru-RU",
  defaultValue: string = "Не указано"
): string {
  if (!dateStr) return defaultValue;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Некорректная дата";
    return (
      date.toLocaleDateString(locale) + " " + date.toLocaleTimeString(locale)
    );
  } catch (e) {
    console.error("Ошибка форматирования даты:", e);
    return "Ошибка даты";
  }
}

/**
 * Получает текущую дату в формате YYYY-MM-DD
 * @returns Текущая дата в формате YYYY-MM-DD
 */
export function getCurrentDate(): string {
  const result = new Date().toISOString().split("T")[0];
  return result || "";
}

/**
 * Фильтрует массив объектов по диапазону дат
 * @param items Массив объектов для фильтрации
 * @param startDate Начальная дата фильтра (строка в формате YYYY-MM-DD)
 * @param endDate Конечная дата фильтра (строка в формате YYYY-MM-DD)
 * @param dateField Название поля с датой в объектах (по умолчанию 'status_updated_at')
 * @returns Отфильтрованный массив объектов
 */
export function filterByDateRange<T extends Record<string, unknown>>(
  items: T[],
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  dateField: string = "status_updated_at"
): T[] {
  if (!startDate && !endDate) return items;

  return items.filter((item) => {
    const dateValue = item[dateField];
    if (!dateValue || typeof dateValue !== "string") return false;

    const itemDate = new Date(dateValue);

    // Проверяем начальную дату
    if (startDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      if (itemDate < startDateObj) return false;
    }

    // Проверяем конечную дату
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      if (itemDate > endDateObj) return false;
    }

    return true;
  });
}
