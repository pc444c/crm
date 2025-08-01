<template>
  <UTooltip :text="tooltipText">
    <button
      :style="{ 
        backgroundColor: color, 
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)', 
        border: '1px solid rgba(255, 255, 255, 0.1)' 
      }"
      class="p-1 px-3 hover:opacity-80 transition-all text-white rounded font-medium"
      :class="buttonClass"
      @click="$emit('click')"
    >
      <slot>{{ text }}</slot>
      <UIcon v-if="icon" :name="icon" class="ml-1" />
    </button>
  </UTooltip>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: "Без статуса",
  },
  tooltipText: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "#6b7280", // серый по умолчанию
  },
  buttonClass: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
});

defineEmits(["click"]);
</script>
