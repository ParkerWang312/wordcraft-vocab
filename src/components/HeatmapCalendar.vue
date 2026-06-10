<template>
  <div class="heatmap" v-if="data.length > 0">
    <div class="heatmap-grid">
      <div
        v-for="(d, i) in data"
        :key="i"
        class="cell"
        :class="`level-${getLevel(d.total)}`"
        :title="`${d.label} · 学${d.learned} 复${d.reviewed}`"
      ></div>
    </div>
    <div class="heatmap-legend">
      <span class="legend-label">低</span>
      <div class="legend-cell level-0"></div>
      <div class="legend-cell level-1"></div>
      <div class="legend-cell level-2"></div>
      <div class="legend-cell level-3"></div>
      <div class="legend-cell level-4"></div>
      <span class="legend-label">高</span>
    </div>
  </div>
  <div class="heatmap-empty" v-else>
    <span>还没有学习记录，开始你的第 1 天吧！</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true }
})

const maxVal = computed(() => {
  const max = Math.max(...props.data.map(d => d.total), 1)
  return max
})

function getLevel(total) {
  if (!total) return 0
  const ratio = total / maxVal.value
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}
</script>

<style scoped>
.heatmap {
  padding: 4px 0;
}
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}
.cell {
  aspect-ratio: 1;
  border-radius: 4px;
  transition: transform 0.15s;
}
.cell:active { transform: scale(1.2); }
.level-0 { background: var(--border); }
.level-1 { background: #DBEAFE; }
.level-2 { background: #93C5FD; }
.level-3 { background: #3B82F6; }
.level-4 { background: #1D4ED8; }

[data-theme="dark"] .level-0 { background: rgba(255,255,255,0.08); }
[data-theme="dark"] .level-1 { background: #1E3A8A; }
[data-theme="dark"] .level-2 { background: #2563EB; }
[data-theme="dark"] .level-3 { background: #3B82F6; }
[data-theme="dark"] .level-4 { background: #60A5FA; }

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}
.legend-label { margin: 0 2px; }
.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.heatmap-empty {
  text-align: center;
  padding: 16px 0;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
