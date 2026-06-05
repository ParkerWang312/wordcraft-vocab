import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadState, saveState, getDefaultState } from '../utils/storage.js'
import { getDefaultWordState, calculateNextReview, getTodayReviewCount } from '../utils/memoryCurve.js'
import vocabularyData from '../data/vocabulary.json'

export const useLearningStore = defineStore('learning', () => {
  const state = ref(loadState() || getDefaultState())

  function persist() {
    saveState(state.value)
  }

  // 获取所有单词（扁平化）
  const allWords = computed(() => {
    const result = []
    vocabularyData.days.forEach(day => {
      day.categories.forEach(cat => {
        cat.words.forEach(word => {
          result.push({ ...word, day: day.day, title: day.categories.map(c => c.name).join(' / ') })
        })
      })
    })
    return result
  })

  const totalWords = computed(() => allWords.value.length)

  // 获取某一天的单词
  function getDayWords(day) {
    const d = vocabularyData.days.find(d => d.day === Number(day))
    if (!d) return []
    return d.categories.flatMap(cat =>
      cat.words.map(w => ({ ...w, day: d.day }))
    )
  }

  // 获取某一天的标题
  function getDayTitle(day) {
    const d = vocabularyData.days.find(d => d.day === Number(day))
    if (!d) return ''
    return d.categories.map(c => c.name).join(' / ')
  }

  // 初始化单词状态
  function initWordState(wordId) {
    if (!state.value.wordStates[wordId]) {
      state.value.wordStates[wordId] = getDefaultWordState(wordId)
    }
    return state.value.wordStates[wordId]
  }

  // 记录学习（learn时标记认识/不认识）
  function markWord(wordId, known) {
    const ws = initWordState(wordId)
    ws.learnedAt = new Date().toISOString()
    if (known) {
      ws.status = 'known'
      if (ws.reviewCount === 0) {
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + 1) // 认识的1天后复习
        nextDate.setHours(0, 0, 0, 0)
        ws.nextReviewAt = nextDate.toISOString()
        ws.interval = 1
      }
    } else {
      ws.status = 'learning'
      // 不认识的当天就复习（10分钟后）
      const nextDate = new Date(Date.now() + 10 * 60 * 1000)
      ws.nextReviewAt = nextDate.toISOString()
      ws.interval = 0
    }
    state.value.stats.totalLearned++
    updateStreak()
    persist()
  }

  // 复习反馈
  function reviewWord(wordId, quality) {
    // quality: 0=忘记, 1=模糊, 2=记得
    const ws = state.value.wordStates[wordId] || initWordState(wordId)
    const updated = calculateNextReview(ws, quality)
    state.value.wordStates[wordId] = updated
    state.value.stats.totalReviewed++
    if (updated.status === 'mastered') {
      state.value.stats.totalMastered++
    }
    persist()
    return updated
  }

  // 完成一天的学习
  function completeDay(day) {
    const d = Number(day)
    if (!state.value.completedDays.includes(d)) {
      state.value.completedDays.push(d)
      if (state.value.currentDay <= d) {
        state.value.currentDay = d + 1
      }
      updateStreak()
      persist()
    }
  }

  // 更新连续学习天数
  function updateStreak() {
    const today = new Date().toDateString()
    if (state.value.lastStudyDate === today) return
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (state.value.lastStudyDate === yesterday) {
      state.value.streakDays++
    } else if (state.value.lastStudyDate !== today) {
      state.value.streakDays = 1
    }
    state.value.lastStudyDate = today
  }

  // 获取今日待复习单词
  const dueReviewWords = computed(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const nowIso = now.toISOString()
    const due = Object.entries(state.value.wordStates)
      .filter(([id, ws]) => ws.nextReviewAt && new Date(ws.nextReviewAt) <= now)
      .map(([id, ws]) => {
        const word = allWords.value.find(w => generateWordId(w) === id)
        return word ? { ...word, wordId: id, state: ws } : null
      })
      .filter(Boolean)
    return due
  })

  const dueReviewCount = computed(() => dueReviewWords.value.length)

  // 生词本
  function toggleWordBook(wordId) {
    const ws = state.value.wordStates[wordId]
    if (ws) {
      ws.inWordBook = !ws.inWordBook
      persist()
    }
  }

  const wordBookWords = computed(() => {
    return Object.entries(state.value.wordStates)
      .filter(([id, ws]) => ws.inWordBook)
      .map(([id, ws]) => {
        const word = allWords.value.find(w => generateWordId(w) === id)
        return word ? { ...word, wordId: id, state: ws } : null
      })
      .filter(Boolean)
  })

  // 进度
  const progress = computed(() => ({
    completed: state.value.completedDays.length,
    total: vocabularyData.totalDays,
    percentage: Math.round((state.value.completedDays.length / vocabularyData.totalDays) * 100)
  }))

  return {
    state,
    allWords,
    totalWords,
    vocabularyData,
    dueReviewWords,
    dueReviewCount,
    wordBookWords,
    progress,
    getDayWords,
    getDayTitle,
    markWord,
    reviewWord,
    completeDay,
    toggleWordBook,
    initWordState,
    persist
  }
})

export function generateWordId(word) {
  // 生成唯一ID：d{day}_{word}
  return `d${word.day}_${word.word.replace(/[^a-zA-Z]/g, '_')}`
}
