import { computed } from 'vue'
import { useLearningStore, generateWordId } from '../stores/learning.js'

/**
 * 派生每日打卡报告所需数据
 */
export function useDailyReport() {
  const store = useLearningStore()

  /** 今日日期 key */
  const todayKey = computed(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  /** 今日活动数据 */
  const todayActivity = computed(() => {
    return store.state.dailyActivity?.[todayKey.value] || { learned: 0, reviewed: 0, minutes: 0 }
  })

  /** 今日错词列表（按 lastWrongAt 日期筛选今天的） */
  const todayWrongWords = computed(() => {
    const todayKey = new Date().toISOString().slice(0, 10)

    return Object.entries(store.state.wrongWords || {})
      .filter(([id, ww]) => {
        if (!ww.lastWrongAt || ww.wrongCount <= 0) return false
        // 比较日期部分避免时区问题
        return ww.lastWrongAt.slice(0, 10) >= todayKey
      })
      .map(([id]) => {
        const word = store.allWords.find(w => generateWordId(w) === id)
        return word || null
      })
      .filter(Boolean)
  })

  /** 错词率 */
  const wrongRate = computed(() => {
    const learned = todayActivity.value.learned || 0
    if (learned === 0) return 0
    return Math.round((todayWrongWords.value.length / learned) * 100)
  })

  /** 当前 Day 主题 */
  const dayTheme = computed(() => {
    return store.getDayTitle(store.state.currentDay)
  })

  /** 掌握率（复用 masteryData 逻辑） */
  const masteryRate = computed(() => {
    const wordStates = store.state.wordStates || {}
    const total = store.totalWords || 1
    let mastered = 0
    Object.values(wordStates).forEach(ws => {
      if (ws.status === 'known' || ws.status === 'mastered') mastered++
    })
    return Math.round((mastered / total) * 100)
  })

  return {
    todayActivity,
    todayWrongWords,
    wrongRate,
    dayTheme,
    masteryRate
  }
}
