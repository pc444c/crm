import { useAuthStore } from "@/store/useAuth";

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useAuthStore();
  const toast = useToast();

  // Получаем ID пользователя напрямую из store
  const userId = userStore.getId;

  if (userId && to.path === "/") {
    toast.add({
      title: "Вы уже вошли",
      description: "Перенаправление...",
      color: "info",
    });

    const role = userStore.getRole;
    if (role === "admin") return navigateTo("/admin");
    if (role === "user") return navigateTo("/user");
    return navigateTo("/");
  }

  if (!userId) {
    if (to.path !== "/") {
      toast.add({
        title: "Ошибка",
        description: "У вас нет доступа к этой странице",
        color: "error",
      });
      return navigateTo("/");
    }
  } else {
    const role = userStore.getRole;
    if (to.path.startsWith("/admin") && role !== "admin") {
      toast.add({
        title: "Ошибка",
        description: "У вас нет доступа к этой странице",
        color: "error",
      });
      return navigateTo("/");
    }
    if (to.path.startsWith("/user") && role !== "user") {
      toast.add({
        title: "Ошибка",
        description: "У вас нет доступа к этой странице",
        color: "error",
      });
      return navigateTo("/");
    }
  }

  if (to.path.startsWith("/admin")) {
    to.meta.layout = "admin";
  } else if (to.path.startsWith("/user")) {
    to.meta.layout = "user";
  } else {
    to.meta.layout = false;
  }
});
