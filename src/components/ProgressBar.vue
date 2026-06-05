<template>
  <div class="progress-bar-wrapper">
    <div class="progress-info">
      <span class="label">{{ label }}</span>
      <span class="value">{{ current }}/{{ total }}</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: percentage + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  label: { type: String, default: '' }
})

const percentage = computed(() => Math.round((props.current / props.total) * 100) || 0)
</script>

<style scoped>
.progress-bar-wrapper {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.label {
  color: var(--text-secondary);
}

.value {
  color: var(--accent);
  font-weight: 600;
}

.progress-track {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #818CF8);
  border-radius: 3px;
  transition: width 0.4s ease;
}
</style>
