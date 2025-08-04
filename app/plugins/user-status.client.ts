// Плагин для отслеживания статуса пользователя
import { useAuthStore } from "~/store/useAuth";

export default defineNuxtPlugin((nuxtApp) => {
  // Получаем хранилище авторизации
  const authStore = useAuthStore();
  let interval: ReturnType<typeof setInterval> | null = null;

  // Функция для обновления статуса
  const updateUserStatus = async () => {
    if (authStore.isAuthenticated) {
      try {
        await fetch("/api/user/updateStatus");
      } catch (error) {
        console.error("Ошибка при обновлении статуса пользователя:", error);
      }
    }
  };

  // Функция инициализации отслеживания статуса
  const setupStatusTracking = () => {
    // Очищаем предыдущий интервал, если он был
    if (interval) {
      clearInterval(interval);
    }

    // Если пользователь авторизован, запускаем периодическое обновление статуса
    if (authStore.isAuthenticated) {
      // Сразу обновляем статус
      updateUserStatus();

      // Устанавливаем интервал обновления каждые 4 минуты и 55 секунд
      // Чтобы не допустить автоматического перехода в оффлайн после 5 минут
      interval = setInterval(updateUserStatus, 4 * 60 * 1000 + 55 * 1000);
    }
  };

  // Следим за изменением статуса авторизации
  watch(
    () => authStore.isAuthenticated,
    () => {
      setupStatusTracking();
    }
  );

  // Инициализируем при загрузке
  setupStatusTracking();

  // Обработчики событий активности пользователя
  const userActivityHandler = debounce(updateUserStatus, 5000);

  // Функция установки статуса оффлайн при закрытии страницы
  const setOfflineStatus = () => {
    if (authStore.isAuthenticated) {
      try {
        // Используем синхронный XMLHttpRequest для гарантированной отправки при закрытии
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/user/setOffline", false); // false для синхронного запроса
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();

        // Дублируем запрос через sendBeacon для надежности
        navigator.sendBeacon("/api/user/setOffline");

        // Устанавливаем локальный флаг, что мы вышли
        localStorage.setItem("user_manually_offline", "true");
      } catch (error) {
        console.error("Ошибка при установке статуса оффлайн:", error);
      }
    }
  };

  // Добавляем слушателей событий
  window.addEventListener("mousemove", userActivityHandler);
  window.addEventListener("keydown", userActivityHandler);
  window.addEventListener("click", userActivityHandler);
  window.addEventListener("scroll", userActivityHandler);

  // Добавляем обработчики события закрытия страницы
  window.addEventListener("beforeunload", setOfflineStatus);
  window.addEventListener("unload", setOfflineStatus);
  window.addEventListener("pagehide", setOfflineStatus);

  // Если был установлен флаг выхода, отправляем запрос на обновление статуса
  if (localStorage.getItem("user_manually_offline") === "true") {
    localStorage.removeItem("user_manually_offline");
    updateUserStatus();
  }

  // Очистка при размонтировании приложения
  nuxtApp.hook("app:beforeMount", () => {
    if (interval) {
      clearInterval(interval);
    }
    window.removeEventListener("mousemove", userActivityHandler);
    window.removeEventListener("keydown", userActivityHandler);
    window.removeEventListener("click", userActivityHandler);
    window.removeEventListener("scroll", userActivityHandler);
    window.removeEventListener("beforeunload", setOfflineStatus);
    window.removeEventListener("unload", setOfflineStatus);
    window.removeEventListener("pagehide", setOfflineStatus);
  });
});

// Простая реализация debounce для ограничения количества вызовов
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}
