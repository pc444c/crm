<template>
  <UApp>
    <NuxtLayout>
      <transition name="book-flip" mode="out-in" appear>
        <div class="page-container">
          <NuxtPage />
        </div>
      </transition>
    </NuxtLayout>
  </UApp>
</template>
<script setup lang="ts"></script>

<style>
/* Контейнер для страниц */
.page-container {
  width: 100%;
  position: relative;
}

/* Эффект перелистывания книги — плавнее и быстрее */
.book-flip-enter-active,
.book-flip-leave-active {
  transition: transform 0.45s cubic-bezier(0.4, 0.2, 0.2, 1), opacity 0.35s;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  position: absolute;
  width: 100%;
}
.book-flip-enter-from {
  transform: rotateY(-60deg) scale(0.98);
  opacity: 0;
}
.book-flip-enter-to {
  transform: rotateY(0deg) scale(1);
  opacity: 1;
}
.book-flip-leave-from {
  transform: rotateY(0deg) scale(1);
  opacity: 1;
}
.book-flip-leave-to {
  transform: rotateY(60deg) scale(0.98);
  opacity: 0;
}
</style>
