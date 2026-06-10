import { computed } from 'vue'
import { useLearningStore } from '../stores/learning.js'

/** 获取本地日期字符串 'YYYY-MM-DD'，避免 UTC 偏移导致跨天 */
function dateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 派生学习报告所需的所有统计数据。
 * - heatmapData:  最近 30 天每日学习量
 * - masteryData:  4 个状态的单词数与占比
 * - topWrong:     错题本按错误次数降序前 5
 * - summary:      顶部摘要（连续天数、累计学习、累计复习、当前掌握率）
 */
export function useLearningStats() {
  const store = useLearningStore()

  /** 热力图：固定 30 格。第一格=最早学习日，向后固定 30 天 */
  const heatmapData = computed(() => {
    const activity = store.state.dailyActivity || {}
    const keys = Object.keys(activity).sort()
    if (keys.length === 0) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 从最早 key 直接解析起始日期
    const [fy, fm, fd] = keys[0].split('-').map(Number)
    const start = new Date(fy, fm - 1, fd)

    // 从今天往前数 30 天
    const windowStart = new Date(today)
    windowStart.setDate(windowStart.getDate() - 29)

    // 起始日期取「最早学习日」和「今天-29天」中较晚的
    const baseDate = start > windowStart ? start : windowStart

    const result = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + i)
      const key = dateKey(d)
      const act = activity[key] || {}
      result.push({
        date: key,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        learned: act.learned || 0,
        reviewed: act.reviewed || 0,
        total: (act.learned || 0) * 2 + (act.reviewed || 0)
      })
    }
    return result
  })

  /** 4 种状态的分布 */
  const masteryData = computed(() => {
    const counts = { unknown: 0, learning: 0, known: 0, mastered: 0 }
    Object.values(store.state.wordStates || {}).forEach(ws => {
      const s = ws.status || 'unknown'
      if (counts[s] !== undefined) counts[s]++
    })
    // 未学习的单词也归到 unknown
    const allWordCount = store.totalWords
    const tracked = counts.unknown + counts.learning + counts.known + counts.mastered
    if (allWordCount > tracked) {
      counts.unknown += allWordCount - tracked
    }
    return [
      { key: 'mastered', label: '已熟练', count: counts.mastered, color: '#F59E0B' },
      { key: 'known', label: '已掌握', count: counts.known, color: '#10B981' },
      { key: 'learning', label: '学习中', count: counts.learning, color: '#3B82F6' },
      { key: 'unknown', label: '未学', count: counts.unknown, color: '#9CA3AF' }
    ]
  })

  /** 错题 TOP 5 */
  const topWrong = computed(() => {
    const wrongWords = store.wrongWordsList.slice(0, 5)
    const maxCount = wrongWords[0]?.wrongCount || 1
    return wrongWords.map(w => ({
      word: w.word,
      meaning: w.meaning,
      count: w.wrongCount || 0,
      percent: Math.round(((w.wrongCount || 0) / maxCount) * 100)
    }))
  })

  /** 顶部摘要 */
  const summary = computed(() => ({
    streakDays: store.state.streakDays || 0,
    totalLearned: store.state.stats?.totalLearned || 0,
    totalReviewed: store.state.stats?.totalReviewed || 0,
    masteryRate: (() => {
      const m = masteryData.value
      const total = m.reduce((s, x) => s + x.count, 0) || 1
      const mastered = (m.find(x => x.key === 'known')?.count || 0) + (m.find(x => x.key === 'mastered')?.count || 0)
      return Math.round((mastered / total) * 100)
    })(),
    totalWords: store.totalWords
  }))

  return { heatmapData, masteryData, topWrong, summary }
}
