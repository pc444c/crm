<template>
  <UApp>
    <NuxtLayout>
      <!-- <ClientOnly> -->
        <NuxtPage />
      <!-- </ClientOnly> -->
    </NuxtLayout>
  </UApp>
</template>
<script setup lang="ts">


const colorMode = useColorMode()

// Заставляем всегда быть в dark режиме
colorMode.value = 'dark'
</script>
