export default defineNuxtPlugin(() => {
  // Регистрируем Quill только на клиенте
  if (import.meta.client) {
    // Импорты будут происходить динамически при использовании компонента
  }
});
