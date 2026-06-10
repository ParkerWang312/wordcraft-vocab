<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    closeable
    close-icon-position="top-right"
    :style="{ maxHeight: '85vh' }"
    @update:show="emit('update:show', $event)"
  >
    <div class="dashboard">
      <div class="dashboard-title">📊 我的学习报告</div>

      <!-- 顶部摘要条 -->
      <div class="summary-bar">
        <div class="summary-item">
          <div class="summary-num">🔥 {{ summary.streakDays }}</div>
          <div class="summary-label">连续天数</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-num">{{ summary.totalLearned }}</div>
          <div class="summary-label">累计学习</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-num">{{ summary.totalReviewed }}</div>
          <div class="summary-label">累计复习</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-num accent">{{ summary.masteryRate }}%</div>
          <div class="summary-label">掌握率</div>
        </div>
      </div>

      <!-- 30 天热力图 -->
      <div class="section">
        <h3 class="section-title">📅 30 天学习日历</h3>
        <HeatmapCalendar :data="heatmapData" />
      </div>

      <!-- 掌握分布 -->
      <div class="section">
        <h3 class="section-title">🥧 单词掌握分布</h3>
        <MasteryPieChart :data="masteryData" />
      </div>

      <!-- 错题 TOP 5 -->
      <div class="section">
        <h3 class="section-title">🔥 错题 TOP 5</h3>
        <TopWrongWords :data="topWrong" />
      </div>

      <div class="footer-hint">💡 坚持每天学一点点，30 天后回头看会很惊喜</div>

      <div class="share-actions">
        <van-button
          round
          type="primary"
          class="share-btn"
          @click="shareReport"
        >
          📤 分享学习报告
        </van-button>
        <van-button
          round
          plain
          type="primary"
          class="share-btn daily-btn"
          @click="shareDailyReport"
        >
          📋 生成每日打卡
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import HeatmapCalendar from './HeatmapCalendar.vue'
import MasteryPieChart from './MasteryPieChart.vue'
import TopWrongWords from './TopWrongWords.vue'
import { useLearningStats } from '../composables/useLearningStats.js'
import { useLearningStore } from '../stores/learning.js'
import { useSettingsStore } from '../stores/settings.js'
import { drawShareImage } from '../composables/useShareImage.js'
import { drawDailyReport } from '../composables/drawDailyReport.js'
import { useDailyReport } from '../composables/useDailyReport.js'
import { showToast } from 'vant'

defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['update:show'])

const { heatmapData, masteryData, topWrong, summary } = useLearningStats()
const settings = useSettingsStore()
const store = useLearningStore()
const dailyReport = useDailyReport()

async function shareReport() {
  try {
    const blob = await drawShareImage(summary.value, masteryData.value, topWrong.value, settings.data.nickname)
    if (!blob) { showToast('生成失败'); return }

    const file = new File([blob], '学习报告.png', { type: 'image/png' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'WordCraft 词匠 · 学习报告', files: [file] })
      return
    }

    // 降级：下载图片
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `WordCraft_学习报告_${new Date().toISOString().slice(0,10)}.png`
    a.click()
    URL.revokeObjectURL(url)
    showToast('图片已保存')
  } catch (e) {
    console.error('分享学习报告失败:', e)
    showToast('分享失败')
  }
}

async function shareDailyReport() {
  try {
    const blob = await drawDailyReport({
      nickname: settings.data.nickname,
      streakDays: store.state.streakDays || 0,
      learned: dailyReport.todayActivity.value.learned || 0,
      reviewed: dailyReport.todayActivity.value.reviewed || 0,
      currentDay: store.state.currentDay,
      totalDays: store.vocabularyData?.totalDays || 28,
      percentage: store.progress.percentage,
      masteryData: masteryData.value,
      wrongWords: dailyReport.todayWrongWords.value,
      wrongRate: dailyReport.wrongRate.value,
      masteryRate: dailyReport.masteryRate.value,
      totalLearned: store.state.stats?.totalLearned || 0,
      dayTheme: dailyReport.dayTheme.value
    })
    if (!blob) { showToast('生成失败'); return }

    const file = new File([blob], '每日打卡.png', { type: 'image/png' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'WordCraft 词匠 · 每日打卡', files: [file] })
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `WordCraft_每日打卡_${new Date().toISOString().slice(0,10)}.png`
    a.click()
    URL.revokeObjectURL(url)
    showToast('图片已保存')
  } catch (e) {
    console.error('生成每日打卡失败:', e)
    showToast('生成失败')
  }
}
</script>

<style scoped>
.dashboard {
  padding: 24px 20px 32px;
}
.dashboard-title {
  font-size: 20px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08));
  border-radius: 14px;
  padding: 14px 8px;
  margin-bottom: 20px;
}
.summary-item {
  text-align: center;
  flex: 1;
}
.summary-num {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}
.summary-num.accent {
  color: var(--accent);
}
.summary-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.summary-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
}

.section {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.footer-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.share-actions {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}
.share-actions .share-btn {
  flex: 1;
}
.daily-btn {
}
</style>

<style>
[data-theme="dark"] .summary-bar {
  background: linear-gradient(135deg, rgba(129,140,248,0.15), rgba(167,139,250,0.15));
}
[data-theme="dark"] .van-popup__close-icon {
  color: var(--text-secondary) !important;
}
</style>
