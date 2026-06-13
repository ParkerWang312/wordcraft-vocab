<template>
  <div class="page home-page">
    <!-- 顶部 -->
    <div class="header">
      <div class="header-top">
        <div class="theme-toggle" @click="theme.toggle">
          <span class="theme-icon">{{ theme.isDark ? '☀️' : '🌙' }}</span>
        </div>
        <h1 class="title">WordCraft 词匠</h1>
        <div class="theme-toggle" @click="openSettings">
          <span class="theme-icon">⚙️</span>
        </div>
      </div>
      <p class="subtitle">28天词汇记忆训练营</p>
    </div>

    <!-- 今日概览卡片 -->
    <div class="overview-card">
      <div class="stats-row">
        <div class="stat" @click="$router.push('/review')">
          <span class="stat-num warn">{{ store.dueReviewCount }}</span>
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
        <div class="stat" @click="$router.push('/review?source=wrongwords')">
          <span class="stat-num danger" v-if="store.wrongCount > 0">{{ store.wrongCount }}</span>
          <span class="stat-num" v-else>0</span>
          <span class="stat-label">错题本 🚩</span>
        </div>
      </div>
    </div>

    <!-- 28天进度 -->
    <div class="section">
      <div class="section-title-row">
        <h3 class="section-title">📅 学习进度</h3>
        <span class="plan-adjust-btn" @click="openPlanDialog">📝 修改</span>
      </div>
      <div class="home-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: homePercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ store.planProgress.completed }} / {{ store.planProgress.total }}</span>
      </div>
      <div class="report-link" @click="showDashboard = true">
        <span>📊 查看学习报告</span>
        <span class="arrow">›</span>
      </div>
    </div>

    <!-- 学习报告弹层 -->
    <LearningDashboard v-model:show="showDashboard" />

    <!-- 快捷操作 -->
    <div class="section">
      <div class="action-row">
        <van-button
          type="primary"
          block
          round
          size="large"
          @click="startLearn"
          :disabled="store.currentUnit > store.totalPlanUnits"
        >
          开始学习 - Day {{ store.currentUnit }}
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

    <!-- 快速导航 -->
    <div class="section">
      <h3 class="section-title">📚 快速导航</h3>
      <div class="nav-header">
        <span class="nav-page-btn" :class="{ dim: navPage <= 0 }" @click="navPage = Math.max(0, navPage - 1)">‹ 上一页</span>
        <span class="nav-page-label">{{ navRangeLabel }}</span>
        <span class="nav-page-btn" :class="{ dim: (navPage + 1) * navPageSize >= planUnits.length }" @click="navPage = Math.min(Math.floor((planUnits.length - 1) / navPageSize), navPage + 1)">下一页 ›</span>
      </div>
      <div class="day-grid">
        <div
          v-for="unit in visibleUnits"
          :key="unit.id"
          :class="['day-item', {
            completed: unit.completed,
            current: unit.current,
            locked: unit.locked && !unlockAll
          }]"
          @click="goToUnit(unit)"
        >
          <span class="day-num">{{ unit.label }}</span>
          <span class="day-status" v-if="unit.completed">✓</span>
          <span class="day-status" v-else-if="unit.current">▶</span>
        </div>
      </div>
    </div>
  </div>

  <StudyPlanAdjust v-model:show="planDialogShow" @saved="onPlanSaved" />
</template>

<script setup>
import { inject, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '../stores/learning.js'
import { useThemeStore } from '../stores/theme.js'
import { useSettingsStore } from '../stores/settings.js'
import { showDialog } from 'vant'
import LearningDashboard from '../components/LearningDashboard.vue'
import StudyPlanAdjust from '../components/StudyPlanAdjust.vue'

const router = useRouter()
const store = useLearningStore()
const theme = useThemeStore()
const settingsStore = useSettingsStore()
const showDashboard = ref(false)
const planDialogShow = ref(false)
const navPage = ref(0)
const navPageSize = 14
const unlockAll = inject('unlockAll', ref(false))
const openSettings = inject('openSettings', () => {})

const homePercent = computed(() => store.planProgress.percentage)

// 计划单位列表
const planUnits = computed(() => {
  const mode = settingsStore.data.planMode || 'categories'

  if (mode === 'categories') {
    const cats = store.allCategories
    const cur = store.currentUnit
    return cats.map((cat, i) => {
      const idx = i + 1
      const isCompleted = store.state.completedUnits.includes(idx)
      return {
        id: `cat_${i}`,
        label: String(idx),
        completed: isCompleted,
        current: cur === idx && !isCompleted,
        locked: !unlockAll.value && idx > cur
      }
    })
  }

  const total = mode === 'custom'
    ? Math.ceil(store.totalWords / (settingsStore.data.wordsPerDay || 30))
    : 28

  const list = []
  for (let i = 1; i <= total; i++) {
    const isCompleted = store.state.completedUnits.includes(i)
    const currentUnit = store.currentUnit
    list.push({
      id: `day_${i}`,
      label: String(i),
      completed: isCompleted,
      current: currentUnit === i && !isCompleted,
      locked: !unlockAll.value && i > currentUnit
    })
  }
  return list
})

const visibleUnits = computed(() => {
  const start = navPage.value * navPageSize
  return planUnits.value.slice(start, start + navPageSize)
})

const navRangeLabel = computed(() => {
  const total = planUnits.value.length
  if (total === 0) return '0 / 0'
  const start = navPage.value * navPageSize + 1
  const end = Math.min(start + navPageSize - 1, total)
  return `${start}-${end} / ${total}`
})

function onPlanSaved() {
  navPage.value = 0
}

function openPlanDialog() {
  planDialogShow.value = true
}

function startLearn() {
  const unit = store.currentUnit
  if (unit > store.totalPlanUnits) return

  if (store.dueReviewCount > 0) {
    showDialog({
      title: '📖 有待复习',
      message: `你有 ${store.dueReviewCount} 个单词需要复习，\n先完成复习再学习新内容吧！`,
      confirmButtonText: '去复习',
      confirmButtonColor: '#F59E0B',
      allowHtml: true
    }).then(() => {
      router.push({ path: '/review', query: { redirectTo: `/learn/${unit}` } })
    })
    return
  }

  router.push(`/learn/${unit}`)
}

function goToUnit(unit) {
  const idx = parseInt(unit.label)
  if (!isNaN(idx) && (unlockAll.value || !unit.locked)) {
    // 有待复习时强制先去复习
    const isCompleted = unit.completed
    if (!isCompleted && store.dueReviewCount > 0) {
      showDialog({
        title: '📖 有待复习',
        message: `你有 ${store.dueReviewCount} 个单词需要复习，\n先完成复习再学习新内容吧！`,
        confirmButtonText: '去复习',
        confirmButtonColor: '#F59E0B'
      }).then(() => {
        router.push({ path: '/review', query: { redirectTo: `/learn/${idx}` } })
      })
      return
    }
    router.push(`/learn/${idx}`)
  }
}

function goToDay(day) {
  // 学习未完成的新天时，强制先去复习（28天模式兼容）
  const isCompleted = store.state.completedDays.includes(day)
  if (!isCompleted && store.dueReviewCount > 0) {
    showDialog({
      title: '📖 有待复习',
      message: `你有 ${store.dueReviewCount} 个单词需要复习，\n先完成复习再学习新内容吧！`,
      confirmButtonText: '去复习',
      confirmButtonColor: '#F59E0B'
    }).then(() => {
      router.push({ path: '/review', query: { redirectTo: `/learn/${day}` } })
    })
    return
  }

  if (unlockAll.value || store.state.completedDays.includes(day) || day <= store.state.currentDay) {
    router.push(`/learn/${day}`)
  }
}
</script>

<style scoped>
.home-page {
  padding: 20px 16px;
}

.home-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.progress-track {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: var(--border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--accent), #EC4899);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 44px;
}

.report-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.08));
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}
.report-link:active {
  transform: scale(0.98);
}
.report-link .arrow {
  font-size: 18px;
  color: var(--text-secondary);
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
  position: relative;
}

.header-top .theme-toggle {
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.header-top .theme-toggle:first-child {
  left: 0;
}

.header-top .theme-toggle:last-child {
  right: 0;
}

.header-top .theme-toggle:active {
  transform: scale(0.9);
}

.header-top .theme-icon {
  font-size: 16px;
  line-height: 1;
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

.stat-num.warn {
  color: var(--warning);
}

.stat-num.danger {
  color: var(--danger);
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
  margin-top: 12px;
}
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title-row .section-title { margin-top: 0; margin-bottom: 0; }
.plan-adjust-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  border-radius: 14px;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 12px; font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}
.plan-adjust-btn:active { transform: scale(0.95); }

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.nav-page-btn {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: opacity 0.15s;
}
.nav-page-btn.dim { opacity: 0.3; pointer-events: none; }
.nav-page-label { font-size: 12px; color: var(--text-secondary); }

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
