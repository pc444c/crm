// ~/plugins/fetch-loader.client.ts

/**
 * Плагин для отображения глобального индикатора загрузки
 * при выполнении fetch-запросов и XMLHttpRequest
 */
export default defineNuxtPlugin((_nuxtApp) => {
  // Проверяем, что мы на клиенте
  if (typeof window === "undefined") return;

  let activeRequests = 0;
  let loader: HTMLElement | null = null;

  // Функция для создания/получения элемента лоадера
  const getLoader = (): HTMLElement => {
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "global-fetch-loader";
      loader.innerHTML = `<div class="loader-progress"></div>`;
      document.body.appendChild(loader);

      // Добавляем стили для лоадера
      const style = document.createElement("style");
      style.textContent = `
        #global-fetch-loader {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          pointer-events: none;
        }
        #global-fetch-loader .loader-progress {
          height: 3px;
          background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
          transition: width 0.3s ease-out, opacity 0.5s ease-out;
          width: 0;
          opacity: 0;
        }
        #global-fetch-loader.loading .loader-progress {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
    return loader;
  };

  // Функция для обновления индикатора загрузки
  const updateLoader = () => {
    const loader = getLoader();

    if (activeRequests > 0) {
      loader.classList.add("loading");

      // Анимируем прогресс-бар
      const progressBar = loader.querySelector(
        ".loader-progress"
      ) as HTMLElement;
      if (progressBar) {
        progressBar.style.width = "70%"; // Показываем 70% загрузки
      }
    } else {
      // Быстро завершаем анимацию и скрываем лоадер
      const progressBar = loader.querySelector(
        ".loader-progress"
      ) as HTMLElement;
      if (progressBar) {
        progressBar.style.width = "100%";

        // Через небольшую задержку скрываем лоадер
        setTimeout(() => {
          loader?.classList.remove("loading");
          if (progressBar) {
            progressBar.style.width = "0";
          }
        }, 300);
      }
    }
  };

  // Перехватываем все fetch-запросы
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    activeRequests++;
    updateLoader();

    try {
      const response = await originalFetch.apply(this, args);
      return response;
    } finally {
      activeRequests--;
      updateLoader();
    }
  };

  // Перехватываем все XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    // Сохраняем ссылку на текущий экземпляр для использования внутри вложенной функции
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // Перехватываем событие завершения запроса
    const originalOnreadystatechange = self.onreadystatechange;
    self.onreadystatechange = function (ev: Event) {
      if (self.readyState === 4) {
        // 4 = завершено
        activeRequests--;
        updateLoader();
      }
      if (originalOnreadystatechange) {
        originalOnreadystatechange.call(this, ev);
      }
    };

    // Увеличиваем счетчик при начале запроса
    activeRequests++;
    updateLoader();

    return originalOpen.call(this, method, url, async, username, password);
  };

  console.log("Глобальный индикатор загрузки для fetch-запросов активирован");
});
