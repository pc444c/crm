export const useAuthStore = defineStore("auth", {
  state: () => ({
    role: "",
    login: "",
    id: "",
    token: "",
    isAuthenticated: false,
  }),

  getters: {
    getRole: (state) => (state.role ? atob(state.role) : ""),
    getLogin: (state) => (state.login ? atob(state.login) : ""),
    getId: (state) => (state.id ? atob(state.id) : ""),
  },

  actions: {
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
        const response = await $fetch("/api/verify-auth", {
          method: "GET",
        });

        if (response && response.status === "success") {
          // Обновляем данные пользователя из токена
          this.saveAll(
            response.user.role,
            response.user.username,
            response.user.id,
            response.token
          );
          return true;
        } else {
          // Если токен недействителен, очищаем состояние
          this.clear();
          return false;
        }
      } catch (error) {
        // При ошибке (401, 403 и т.д.) очищаем состояние
        this.clear();
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
