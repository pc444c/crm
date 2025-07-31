// ~/utils/api.ts
import { useAuthStore } from "@/store/useAuth";
import type { NitroFetchRequest, NitroFetchOptions } from "nitropack";
import { FetchError } from "ofetch";

// Базовая функция для API-запросов
export const createApiClient = (role?: string) => {
  return async <T = unknown>(
    url: string,
    options: NitroFetchOptions<NitroFetchRequest> = {}
  ) => {
    const auth = useAuthStore();

    // Проверяем права доступа, если указана конкретная роль
    if (role) {
      // Для админских запросов
      if (role === "admin" && auth.getRole !== "admin") {
        throw new Error(
          "У вас нет прав администратора для выполнения этого запроса"
        );
      }

      // Для пользовательских запросов
      if (role === "user" && !["user", "admin"].includes(auth.getRole)) {
        throw new Error(
          "У вас нет прав пользователя для выполнения этого запроса"
        );
      }
    }

    // Базовые опции для всех запросов
    const baseOptions = {
      ...options,
      headers: {
        ...options.headers,
        "X-Role": auth.getRole, // Добавляем роль в заголовок
      },
    };

    try {
      return await $fetch<T>(url, baseOptions);
    } catch (error: unknown) {
      // Обработка ошибок авторизации
      if (error instanceof FetchError && error.status === 401) {
        auth.clear(); // Очищаем данные авторизации
        navigateTo("/"); // Перенаправляем на главную
      }

      throw error;
    }
  };
};

// Клиенты для разных ролей
export const adminApi = createApiClient("admin");
export const userApi = createApiClient("user");
export const api = createApiClient(); // Без проверки роли
