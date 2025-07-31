import { useAuthStore } from "@/store/useAuth";

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
    // Проверяем токен
    const authResult = await auth.checkAuth();

    if (import.meta.client) {
      console.debug(
        `[Auth Middleware] Проверка доступа для ${to.path}, роль: ${auth.getRole}, аутентификация: ${auth.isAuthenticated}`
      );

      // Если есть query параметры, логируем и их
      if (Object.keys(to.query).length > 0) {
        console.debug(`[Auth Middleware] Query параметры:`, to.query);
      }
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
