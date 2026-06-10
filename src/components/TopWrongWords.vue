<template>
  <div v-if="data.length === 0" class="empty">
    <span class="emoji">🎉</span>
    <p>暂无错题，继续保持！</p>
  </div>
  <div v-else class="top-wrong">
    <div v-for="(item, idx) in data" :key="idx" class="row">
      <div class="rank" :class="`rank-${idx + 1}`">{{ idx + 1 }}</div>
      <div class="info">
        <div class="word-line">
          <span class="word">{{ item.word }}</span>
          <span class="count">{{ item.count }}次</span>
        </div>
        <div class="meaning">{{ item.meaning }}</div>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: item.percent + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Array, required: true } // [{ word, meaning, count, percent }]
})
</script>

<style scoped>
.top-wrong {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.empty {
  text-align: center;
  padding: 20px 0;
  color: var(--text-secondary);
}
.empty .emoji {
  font-size: 36px;
  display: block;
  margin-bottom: 6px;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rank-1 { background: #FEF3C7; color: #F59E0B; }
.rank-2 { background: #E5E7EB; color: #6B7280; }
.rank-3 { background: #FED7AA; color: #C2410C; }
.info {
  flex: 1;
  min-width: 0;
}
.word-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}
.word {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.count {
  font-size: 11px;
  color: var(--danger);
  font-weight: 600;
}
.meaning {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bar-track {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #F59E0B, #EF4444);
  border-radius: 2px;
  transition: width 0.5s;
}
</style>
