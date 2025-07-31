<template>
  <div>
    
    <Header />
    
    <div class="flex flex-col gap-4 items-center justify-center h-screen">
      <section
        class="p-8 min-w-96 bg-neutral-800 rounded-lg shadow-lg flex flex-col items-center gap-4"
      >
        <span>АВТОРИЗАЦИЯ</span>
        <UFormField label="Логин" class="w-full">
          <UInput
            v-model="UserData.login"
            size="xl"
            placeholder="Введи свой логин"
            type="text"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Пароль" class="w-full">
          <UInput
            v-model="UserData.password"
            size="xl"
            placeholder="Введите свой пароль"
            type="password"
            class="w-full"
          />
        </UFormField>
        <UButton
          @click="Login()"
          icon="i-lucide-rocket"
          size="md"
          color="primary"
          variant="solid"
          class="w-full flex items-center justify-center"
          >Вход</UButton
        >
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from "@/store/useAuth";
const UserData = ref({
  login: "",
  password: "",
});
const useStore = useAuthStore();
const toast = useToast();

useHead({
  title: "Авторизация",
});
definePageMeta({
  title: "Авторизация",
  layout: false,
});

// Типы для ответа API
interface LoginSuccessResponse {
  status: "success";
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

interface LoginErrorResponse {
  status: "error";
  message: string;
}

type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

async function Login() {
  try {
    const route = useRoute();
    const response = await $fetch<LoginResponse>("/api/login", {
      method: "POST",
      body: UserData.value,
    });
    console.log(response);

    if (response.status === "success") {
      // Сохраняем данные пользователя и токен
      useStore.saveAll(
        response.user.role,
        response.user.username,
        String(response.user.id), // Преобразуем в строку
        response.token
      );

      // Проверяем, есть ли сохраненный маршрут для редиректа
      const redirectPath = route.query.redirect as string | undefined;
      
      if (response.user.role === "admin") {
        toast.add({
          title: "Вы вошли как администратор",
          color: "info",
        });
        // Перенаправляем на сохраненный маршрут или на админ-панель
        navigateTo(redirectPath || "/admin");
        return;
      } else if (response.user.role === "user") {
        toast.add({
          title: "Вы вошли как холодка",
          color: "info",
        });
        // Перенаправляем на сохраненный маршрут или на панель пользователя
        navigateTo(redirectPath || "/user");
        return;
      }
      // Например, перенаправление на главную страницу
    } else {
      toast.add({
        title: "Ошибка входа",
        description:
          (response as LoginErrorResponse).message ||
          "Пожалуйста, проверьте свои учетные данные.",
        color: "error",
      });
    }
    // Здесь можно обработать успешный вход, например, перенаправить пользователя
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
  }
}
</script>

<style lang="scss" scoped></style>
