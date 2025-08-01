// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    'nuxt-charts',
    '@pinia/nuxt',
    '@nuxtjs/color-mode'
  ],
  colorMode: {
    preference: 'dark', // default value of $colorMode.preference
    fallback: 'dark', // fallback value if not system preference found
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storage: 'localStorage', // or 'sessionStorage' or 'cookie'
    storageKey: 'nuxt-color-mode'
  },
    css: ['~/assets/css/main.css'],
    vite:{
      define: {
        global: 'globalThis',
      },
      optimizeDeps: {
        include: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers']
      }
    },
    build: {
      transpile: ['vue-echarts', 'echarts', 'resize-detector']
    },
    nitro: {
      esbuild: {
        options: {
          target: 'esnext'
        }
      }
    }
})