<template>
  <div class="mastery-compact">
    <!-- 顶部水平分段条（类似 GitHub 语言统计） -->
    <div class="mastery-bar">
      <div
        v-for="seg in segments"
        :key="seg.key"
        class="seg"
        :style="{ width: seg.percent + '%', background: seg.color }"
        :title="`${seg.label}: ${seg.count} (${seg.percent}%)`"
      ></div>
    </div>
    <!-- 底部标签行 -->
    <div class="mastery-labels">
      <span v-for="seg in segments" :key="seg.key" class="label-item">
        <span class="dot" :style="{ background: seg.color }"></span>
        {{ seg.label }} {{ seg.count }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true }
})

const total = computed(() => props.data.reduce((s, x) => s + x.count, 0))

const segments = computed(() => {
  const t = total.value || 1
  return props.data
    .filter(x => x.count > 0)
    .map(x => ({
      ...x,
      percent: Math.round((x.count / t) * 100)
    }))
})
</script>

<style scoped>
.mastery-compact {
  width: 100%;
}
.mastery-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  gap: 2px;
}
.seg {
  transition: width 0.4s ease;
}
.seg:first-child { border-radius: 5px 0 0 5px; }
.seg:last-child { border-radius: 0 5px 5px 0; }
.mastery-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}
.label-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
