// ~/utils/tags.ts

// Интерфейс для тега
export interface Tag {
  id: number;
  name: string;
  about: string;
  color: string;
}

/**
 * Получает цвет для тега на основе его имени и списка доступных тегов
 * @param tagName Имя тега
 * @param tags Список доступных тегов
 * @returns Цвет в формате HEX
 */
export function getTagActualColor(
  tagName: string | null | undefined,
  tags: Tag[]
): string {
  if (!tagName) return "#6b7280"; // серый по умолчанию

  // Ищем тег по точному совпадению имени
  const tag = tags.find((t) => t.name === tagName);
  if (tag && tag.color) {
    return tag.color; // Возвращаем цвет из базы данных
  }

  // Если тег не найден, используем стандартные цвета
  switch (tagName.toLowerCase()) {
    case "перезвон":
      return "#fbbf24"; // желтый
    case "нищий":
      return "#ef4444"; // красный
    case "слив":
      return "#dc2626"; // темно-красный
    case "мразь":
      return "#b91c1c"; // очень темно-красный
    case "ндз":
      return "#3b82f6"; // синий
    case "пустой":
      return "#8b5cf6"; // фиолетовый
    case "передать":
      return "#10b981"; // зеленый
    case "no used":
      return "#6b7280"; // серый
    default:
      return "#6b7280"; // серый по умолчанию
  }
}

/**
 * Получает описание для тега на основе его имени и списка доступных тегов
 * @param tagName Имя тега
 * @param tags Список доступных тегов
 * @returns Описание тега или его имя
 */
export function getTagAbout(
  tagName: string | null | undefined,
  tags: Tag[]
): string {
  if (!tagName) return "Без статуса";

  const tag = tags.find((t) => t.name === tagName);
  if (tag && tag.about) {
    return tag.about; // Возвращаем описание из базы данных
  }
  return tagName || "Без статуса"; // Если описания нет, возвращаем название тега
}

/**
 * Возвращает стилизованное имя тега для отображения
 * @param tagName Имя тега
 * @returns Имя тега или "Без статуса"
 */
export function getTagDisplayName(tagName: string | null | undefined): string {
  return tagName || "Без статуса";
}
