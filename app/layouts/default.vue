<template>
  <div class="min-h-screen flex flex-col gap-8">
    <Header/>
    <main class="min-w-full">
      <slot class="min-w-full" />
    </main>
  
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped></style>
