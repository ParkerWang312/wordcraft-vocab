<template>
  <div class="page home-page">
    <!-- 顶部 -->
    <div class="header">
      <div class="header-top">
        <h1 class="title">WordCraft 词匠</h1>
      </div>
      <p class="subtitle">28天词汇记忆训练营</p>
    </div>

    <!-- 今日概览卡片 -->
    <div class="overview-card">
      <div class="stats-row">
        <div class="stat">
          <span class="stat-num">{{ store.dueReviewCount }}</span>
          <span class="stat-label">待复习</span>
        </div>
        <div class="stat">
          <span class="stat-num">{{ store.progress.completed }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat">
          <span class="stat-num">{{ store.state.streakDays }}</span>
          <span class="stat-label">连续天 🔥</span>
        </div>
      </div>
    </div>

    <!-- 28天进度 -->
    <div class="section">
      <h3 class="section-title">📅 学习进度</h3>
      <ProgressBar :current="store.progress.completed" :total="28" :label="'Day ' + store.state.currentDay + ' / 28'" />
    </div>

    <!-- 快捷操作 -->
    <div class="section">
      <div class="action-row">
        <van-button
          type="primary"
          block
          round
          size="large"
          @click="startLearn"
          :disabled="store.state.currentDay > 28"
        >
          开始学习 - Day {{ store.state.currentDay }}
        </van-button>
      </div>
      <div class="action-row" v-if="store.dueReviewCount > 0">
        <van-button type="warning" block round size="large" @click="$router.push('/review')">
          去复习 ({{ store.dueReviewCount }}词)
        </van-button>
      </div>
      <div class="action-row" v-else>
        <van-button type="default" block round size="large" disabled>
          🎉 暂无待复习
        </van-button>
      </div>
    </div>

    <!-- 快速导航 - 28天网格 -->
    <div class="section">
      <h3 class="section-title">📚 快速导航</h3>
      <div class="day-grid">
        <div
          v-for="day in 28"
          :key="day"
          :class="['day-item', {
            completed: store.state.completedDays.includes(day),
            current: store.state.currentDay === day,
            locked: day > store.state.currentDay
          }]"
          @click="goToDay(day)"
        >
          <span class="day-num">{{ day }}</span>
          <span class="day-status" v-if="store.state.completedDays.includes(day)">✓</span>
          <span class="day-status" v-else-if="day === store.state.currentDay">▶</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useLearningStore } from '../stores/learning.js'
import { useThemeStore } from '../stores/theme.js'
import ProgressBar from '../components/ProgressBar.vue'

const router = useRouter()
const store = useLearningStore()
const theme = useThemeStore()

function startLearn() {
  if (store.state.currentDay <= 28) {
    router.push(`/learn/${store.state.currentDay}`)
  }
}

function goToDay(day) {
  if (day <= store.state.currentDay) {
    router.push(`/learn/${day}`)
  }
}
</script>

<style scoped>
.home-page {
  padding: 20px 16px;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title {
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent), #EC4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.overview-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  margin-bottom: 20px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
}

.stat {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.action-row {
  margin-bottom: 10px;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-item {
  aspect-ratio: 1;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.day-item.completed {
  background: var(--accent-light);
  border-color: var(--accent);
}

.day-item.current {
  border-color: var(--accent);
  border-width: 2px;
  box-shadow: 0 0 0 3px var(--accent-light);
}

.day-item.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.day-num {
  font-size: 14px;
  font-weight: 600;
}

.day-status {
  font-size: 10px;
  color: var(--accent);
  margin-top: 2px;
}
</style>
