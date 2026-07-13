<template>
  <div class="ring-chart-wrap">
    <svg :viewBox="`0 0 ${size} ${size}`" :width="size" :height="size" class="ring-svg">
      <!-- 背景环 -->
      <circle
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        :stroke="bgColor"
        :stroke-width="ringW"
      />
      <!-- 正确段 -->
      <circle
        v-if="correctAngle > 0"
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        stroke="#10B981"
        :stroke-width="ringW"
        :stroke-dasharray="`${correctAngle} ${circumference - correctAngle}`"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="butt"
        :transform="`rotate(-90 ${cx} ${cy})`"
      />
      <!-- 错误段 -->
      <circle
        v-if="wrongAngle > 0 && correctAngle > 0"
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        :stroke="dangerColor"
        :stroke-width="ringW"
        :stroke-dasharray="`${wrongAngle} ${circumference - wrongAngle}`"
        :stroke-dashoffset="wrongDashOffset"
        stroke-linecap="butt"
        :transform="`rotate(-90 ${cx} ${cy})`"
      />
      <!-- 仅错误段（无正确时） -->
      <circle
        v-if="wrongAngle > 0 && correctAngle === 0"
        :cx="cx" :cy="cy" :r="r"
        fill="none"
        :stroke="dangerColor"
        :stroke-width="ringW"
        :stroke-dasharray="`${wrongAngle} ${circumference - wrongAngle}`"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="butt"
        :transform="`rotate(-90 ${cx} ${cy})`"
      />
      <!-- 中心总数 -->
      <text :x="cx" :y="cy - 4" text-anchor="middle" class="ring-total-num">{{ total }}</text>
      <text :x="cx" :y="cy + 18" text-anchor="middle" class="ring-total-label">总题数</text>
    </svg>

    <!-- 四个标注 -->
    <div class="ring-labels">
      <div class="ring-label">
        <span class="dot" style="background: #10B981"></span>
        <span class="label-text">正确题数</span>
        <span class="label-num">{{ correct }}</span>
      </div>
      <div class="ring-label">
        <span class="dot" style="background: #EF4444"></span>
        <span class="label-text">错误题数</span>
        <span class="label-num">{{ wrong }}</span>
      </div>
      <div class="ring-label">
        <span class="dot" style="background: #3B82F6"></span>
        <span class="label-text">本轮已学</span>
        <span class="label-num">{{ roundLearned }}</span>
      </div>
      <div class="ring-label">
        <span class="dot" style="background: #9CA3AF"></span>
        <span class="label-text">本轮未学</span>
        <span class="label-num">{{ roundUnlearned }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useCssVars } from 'vue'

const props = defineProps({
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  roundLearned: { type: Number, default: 0 },
  roundUnlearned: { type: Number, default: 0 }
})

const size = 180
const cx = size / 2
const cy = size / 2
const r = 72
const ringW = 18
const circumference = 2 * Math.PI * r
const bgColor = '#E5E7EB'
const dangerColor = '#EF4444'

const total = computed(() => props.correct + props.wrong)

const totalAngle = computed(() => {
  if (total.value === 0) return 0
  return circumference
})

const correctAngle = computed(() => {
  if (total.value === 0) return 0
  return (props.correct / total.value) * circumference
})

const wrongAngle = computed(() => {
  if (total.value === 0) return 0
  return (props.wrong / total.value) * circumference
})

const dashOffset = computed(() => 0)
const wrongDashOffset = computed(() => circumference - correctAngle.value)
</script>

<style scoped>
.ring-chart-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.ring-svg {
  width: 180px;
  height: 180px;
}

.ring-total-num {
  font-size: 26px;
  font-weight: 800;
  fill: var(--text-primary);
}

.ring-total-label {
  font-size: 12px;
  fill: var(--text-secondary);
}

.ring-labels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
}

.ring-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.ring-label .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ring-label .label-num {
  font-weight: 700;
  color: var(--text-primary);
  margin-left: 2px;
}
</style>
