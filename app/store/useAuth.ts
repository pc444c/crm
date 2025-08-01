export const useAuthStore = defineStore("auth", {
  state: () => ({
    role: "",
    login: "",
    id: "",
    token: "",
    isAuthenticated: false,
    errorCode: "", // Код ошибки аутентификации
  }),

  getters: {
    getRole: (state) => (state.role ? atob(state.role) : ""),
    getLogin: (state) => (state.login ? atob(state.login) : ""),
    getId: (state) => (state.id ? atob(state.id) : ""),
  },

  actions: {
    setErrorCode(code: string) {
      this.errorCode = code;
    },

    saveAll(role: string, login: string, id: string, token: string) {
      this.role = btoa(role);
      this.login = btoa(login);
      this.id = btoa(id);
      this.token = token;
      this.isAuthenticated = true;
    },

    clear() {
      this.role = "";
      this.login = "";
      this.id = "";
      this.token = "";
      this.isAuthenticated = false;
      // Не очищаем errorCode, чтобы он сохранялся для отображения ошибки
    },

    async logout() {
      // Вызываем API для выхода (удаление серверных сессий/кук)
      try {
        await $fetch("/api/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("Ошибка при выходе из системы:", error);
      }

      // Очищаем локальное состояние
      this.clear();
    },

    // Кэшируем последний запрос проверки аутентификации
    _authCheckPromise: null as Promise<boolean> | null,
    _lastAuthCheck: 0,

    async checkAuth() {
      const now = Date.now();
      
      // Если у нас уже есть токен и роль, и проверка была недавно (в течение 30 секунд),
      // возвращаем кэшированный результат без запроса на сервер
      if (
        this.isAuthenticated && 
        this.token && 
        now - this._lastAuthCheck < 30000 && 
        !this.errorCode
      ) {
        return true;
      }
      
      // Если уже идет запрос на проверку, возвращаем его результат
      if (this._authCheckPromise) {
        return this._authCheckPromise;
      }
      
      // Создаем новый запрос на проверку
      this._lastAuthCheck = now;
      this._authCheckPromise = this._doCheckAuth();
      
      try {
        return await this._authCheckPromise;
      } finally {
        this._authCheckPromise = null;
      }
    },
    
    async _doCheckAuth() {
      // Проверяем аутентификацию на сервере
      try {
        const response: any = await $fetch("/api/verify-auth", {
          method: "GET",
          // Добавляем кэширование на уровне браузера
          headers: {
            "Cache-Control": "max-age=30",
          }
        });

        if (response && response.status === "success") {
          // Обновляем данные пользователя из токена
          if (response.user && response.token) {
            this.saveAll(
              response.user.role,
              response.user.username,
              response.user.id,
              response.token
            );
            this.errorCode = ""; // Сбрасываем код ошибки
          }
          return true;
        } else {
          // Если токен недействителен или пользователь не существует, очищаем состояние
          this.clear();

          // Если есть код ошибки, сохраняем его
          if (response && response.code) {
            this.errorCode = response.code;
          }

          return false;
        }
      } catch (err) {
        // При ошибке (401, 403 и т.д.) очищаем состояние
        this.clear();
        console.error("Ошибка при проверке аутентификации:", err);
        return false;
      }
    },

    async init() {
      // Попытка восстановить сессию при инициализации приложения
      return this.checkAuth();
    },
  },

  persist: true,
});
