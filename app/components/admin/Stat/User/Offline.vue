<template>
  <UCard class="p-4 bg-neutral-900 min-w-full h-full">
    <USeparator color="error" label="Все оффлайн холодники" class="mb-3" />
    <div class="max-h-80 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
      <div
        v-for="(item, index) in 10"
        :key="index"
        class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error-900 transition"
      >
        <div
          class="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-error-700 text-white text-base"
        >
          {{ index + 1 }}
        </div>
        <span class="text-base text-white"
          >Офлайн холодник {{ index + 1 }}</span
        >
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup></script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--ui-color-error-500) #18181b;
}

/* Chrome, Edge, Safari */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  border-radius: 8px;
  background: #18181b;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #22c55e;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4ade80;
}
</style>
