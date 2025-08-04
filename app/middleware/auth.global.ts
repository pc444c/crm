import { useAuthStore } from "@/store/useAuth";

// Кэшируем результат проверки аутентификации
let lastAuthCheck = 0;
let authCheckPromise: Promise<boolean> | null = null;

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();

  // Публичные маршруты, доступные без аутентификации
  const publicRoutes = ["/", "/login", "/error"];

  // Если это публичный маршрут или начинается с публичного маршрута, разрешаем доступ
  if (
    publicRoutes.some(
      (route) => to.path === route || to.path.startsWith(`${route}/`)
    )
  ) {
    return;
  }

  try {
    // Оптимизация: проверяем токен только если прошло больше 30 секунд с последней проверки
    // или если пользователь не аутентифицирован
    const now = Date.now();
    if (
      !auth.isAuthenticated ||
      now - lastAuthCheck > 30000 ||
      !authCheckPromise
    ) {
      authCheckPromise = auth.checkAuth();
      lastAuthCheck = now;
    }

    // Ждем результата проверки
    await authCheckPromise;

    if (import.meta.client && process.env.NODE_ENV !== "production") {
      console.debug(
        `[Auth Middleware] Доступ к ${to.path}, роль: ${auth.getRole}, аутентифицирован: ${auth.isAuthenticated}`
      );
    }

    // Если пользователь не аутентифицирован или произошла ошибка с кодом USER_NOT_EXISTS,
    // выполняем выход и перенаправляем на главную страницу с сообщением об ошибке
    if (!auth.isAuthenticated) {
      return navigateTo({
        path: "/",
        query: {
          redirect: to.fullPath,
          error:
            auth.errorCode === "USER_NOT_EXISTS"
              ? "USER_NOT_EXISTS"
              : undefined,
        },
      });
    }

    // Карта разрешений для маршрутов
    const routePermissions = {
      "/admin": ["admin"],
      "/user": ["user"],
    };

    // Проверка прав на основе маршрута
    for (const [prefix, roles] of Object.entries(routePermissions)) {
      if (to.path.startsWith(prefix) && !roles.includes(auth.getRole)) {
        // Редирект на соответствующую домашнюю страницу в зависимости от роли
        const fallbackRoute =
          auth.getRole === "admin"
            ? "/admin"
            : auth.getRole === "user"
            ? "/user"
            : "/";
        return navigateTo(fallbackRoute);
      }
    }
  } catch (error) {
    console.error("[Auth Middleware] Ошибка проверки аутентификации:", error);

    // В случае ошибки очищаем состояние аутентификации и перенаправляем
    auth.logout();
    return navigateTo("/");
  }
});
