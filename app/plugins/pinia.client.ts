import { defineNuxtPlugin } from '#app'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia // ✅ Получаем уже инициализированный pinia
  pinia.use(piniaPluginPersistedstate)
})
