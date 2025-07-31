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

    async checkAuth() {
      // Проверяем аутентификацию на сервере
      try {
        const response: any = await $fetch("/api/verify-auth", {
          method: "GET",
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
