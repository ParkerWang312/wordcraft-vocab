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
    <div class="dashboard" v-if="book">
      <div class="dashboard-title">📊 {{ book.name }}</div>

      <!-- 顶部摘要条 -->
      <div class="summary-bar">
        <div class="summary-item">
          <div class="summary-icon">📝</div>
          <div class="summary-num">{{ report.practiceCount }}</div>
          <div class="summary-label">练习次数</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-icon">🔄</div>
          <div class="summary-num">{{ report.currentRound + 1 }}</div>
          <div class="summary-label">当前轮次</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-icon">🕐</div>
          <div class="summary-num">{{ formatDuration(report.totalDuration) }}</div>
          <div class="summary-label">练习时长</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-icon">🎯</div>
          <div class="summary-num accent">{{ report.accuracy }}%</div>
          <div class="summary-label">正确率</div>
        </div>
      </div>

      <!-- 环形图：正确/错误 + 已学/未学 -->
      <div class="section">
        <h3 class="section-title">🥧 答题统计</h3>
        <WordBookRingChart
          :correct="report.totalCorrect"
          :wrong="report.totalWrong"
          :round-learned="report.roundLearned"
          :round-unlearned="report.roundUnlearned"
        />
      </div>

      <!-- 错题 TOP 5 -->
      <div class="section">
        <h3 class="section-title">🔥 错题 TOP 5</h3>
        <TopWrongWords :data="report.topWrongWords" />
      </div>

      <div class="footer-hint">💡 坚持每天学一点点，30 天后回头看会很惊喜</div>

      <div class="share-actions">
        <van-button round type="primary" class="share-btn" @click="shareReport">
          📤 分享学习报告
        </van-button>
        <van-button round plain type="primary" class="share-btn daily-btn" @click="shareDailyReport">
          📋 生成每日打卡
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed } from 'vue'
import { useWordbookStore } from '../stores/wordbook.js'
import { showToast } from 'vant'
import TopWrongWords from './TopWrongWords.vue'
import WordBookRingChart from './WordBookRingChart.vue'
import { drawWordbookShareImage } from '../composables/useWordbookShareImage.js'
import { drawWordbookDailyReport } from '../composables/drawWordbookDaily.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  bookId: { type: String, required: true }
})
const emit = defineEmits(['update:show'])

const store = useWordbookStore()

const book = computed(() => store.getBook(props.bookId))

const report = computed(() => {
  const b = book.value
  if (!b) return {
    practiceCount: 0, currentRound: 0, totalDuration: 0, accuracy: 0,
    totalCorrect: 0, totalWrong: 0, roundLearned: 0, roundUnlearned: 0,
    topWrongWords: []
  }

  const history = b.practiceHistory || []
  const entries = store.getWordsByBookId(props.bookId)

  const totalSessions = history.length
  const totalQuestions = history.reduce((s, h) => s + h.total, 0)
  const totalCorrect = history.reduce((s, h) => s + h.correct, 0)
  const totalWrong = history.reduce((s, h) => s + h.wrong, 0)
  const totalDuration = history.reduce((s, h) => s + h.duration, 0)
  const accuracy = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0
  const roundLearned = entries.filter(e => e.learned).length
  const roundUnlearned = entries.filter(e => !e.learned).length

  // 合并所有 retries 统计错误单词
  const wrongWordMap = {}
  history.forEach(h => {
    if (h.retries) {
      Object.entries(h.retries).forEach(([word, count]) => {
        if (!wrongWordMap[word]) {
          const entry = entries.find(e => e.word === word)
          wrongWordMap[word] = {
            word,
            meaning: entry ? entry.meaning : '',
            count: 0
          }
        }
        wrongWordMap[word].count += count
      })
    }
  })
  const topWrongWords = Object.values(wrongWordMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxCount = topWrongWords[0]?.count || 1
  topWrongWords.forEach(w => { w.percent = Math.round((w.count / maxCount) * 100) })

  return {
    practiceCount: totalSessions,
    currentRound: b.practiceRound || 0,
    totalDuration,
    accuracy,
    totalCorrect,
    totalWrong,
    roundLearned,
    roundUnlearned,
    totalWords: entries.length,
    topWrongWords
  }
})

function formatDuration(seconds) {
  if (!seconds) return '0分'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const rm = m % 60
    return `${h}时${rm}分`
  }
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

async function shareReport() {
  try {
    const blob = await drawWordbookShareImage(report.value, book.value.name)
    if (!blob) { showToast('生成失败'); return }

    const file = new File([blob], `${book.value.name}_学习报告.png`, { type: 'image/png' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: `WordCraft 词匠 · ${book.value.name} 学习报告`, files: [file] })
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `WordCraft_${book.value.name}_学习报告_${new Date().toISOString().slice(0, 10)}.png`
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
    const blob = await drawWordbookDailyReport(report.value, book.value.name)
    if (!blob) { showToast('生成失败'); return }

    const file = new File([blob], `${book.value.name}_每日打卡.png`, { type: 'image/png' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: `WordCraft 词匠 · ${book.value.name} 每日打卡`, files: [file] })
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `WordCraft_${book.value.name}_每日打卡_${new Date().toISOString().slice(0, 10)}.png`
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.summary-icon {
  font-size: 20px;
  line-height: 1;
}
.summary-num {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
  white-space: nowrap;
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
</style>

<style>
[data-theme="dark"] .summary-bar {
  background: linear-gradient(135deg, rgba(129,140,248,0.15), rgba(167,139,250,0.15));
}
</style>
