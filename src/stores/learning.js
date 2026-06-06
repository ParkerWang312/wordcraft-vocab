import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadState, saveState, getDefaultState } from '../utils/storage.js'
import { getDefaultWordState, calculateNextReview, getTodayReviewCount } from '../utils/memoryCurve.js'
import vocabularyData from '../data/vocabulary.json'

export function getDefaultWrongState() {
  return {}  // { wordId: { wrongCount, lastWrongAt } }
}

export const useLearningStore = defineStore('learning', () => {
  const state = ref(loadState() || getDefaultState())

  function persist() {
    saveState(state.value)
  }

  // 初始化错题本
  if (!state.value.wrongWords) {
    state.value.wrongWords = {}
  }

  // 初始化每日学习进度
  if (!state.value.dayProgress) {
    state.value.dayProgress = {}
  }

  // 所有单词（扁平化）
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

  // 记录学习
  function markWord(wordId, known) {
    const ws = initWordState(wordId)
    ws.learnedAt = new Date().toISOString()
    if (known) {
      ws.status = 'known'
      if (ws.reviewCount === 0) {
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + 1)
        nextDate.setHours(0, 0, 0, 0)
        ws.nextReviewAt = nextDate.toISOString()
        ws.interval = 1
      }
    } else {
      ws.status = 'learning'
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
    const ws = state.value.wordStates[wordId] || initWordState(wordId)
    const updated = calculateNextReview(ws, quality)
    state.value.wordStates[wordId] = updated
    state.value.stats.totalReviewed++
    if (updated.status === 'mastered') {
      state.value.stats.totalMastered++
    }
    // 复习答对（quality>=1）时从错题本减少计数
    if (quality >= 1 && state.value.wrongWords[wordId]) {
      state.value.wrongWords[wordId].wrongCount = Math.max(0, state.value.wrongWords[wordId].wrongCount - 1)
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

  // === 错题本 ===
  function addWrongWord(wordId) {
    if (!state.value.wrongWords[wordId]) {
      state.value.wrongWords[wordId] = { wrongCount: 0, lastWrongAt: '' }
    }
    state.value.wrongWords[wordId].wrongCount++
    state.value.wrongWords[wordId].lastWrongAt = new Date().toISOString()
    persist()
  }

  function removeWrongWord(wordId) {
    if (state.value.wrongWords[wordId]) {
      state.value.wrongWords[wordId].wrongCount = 0
      persist()
    }
  }

  const wrongWordsList = computed(() => {
    return Object.entries(state.value.wrongWords || {})
      .filter(([id, ww]) => ww.wrongCount > 0)
      .map(([id, ww]) => {
        const word = allWords.value.find(w => generateWordId(w) === id)
        return word ? { ...word, wordId: id, wrongCount: ww.wrongCount, lastWrongAt: ww.lastWrongAt } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.wrongCount - a.wrongCount)
  })

  const wrongCount = computed(() => wrongWordsList.value.length)

  // === 待复习 ===
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
    const ws = initWordState(wordId)
    ws.inWordBook = !ws.inWordBook
    persist()
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

  // 每日学习进度（记录学到了第几个单词）
  function getDayProgress(day) {
    return state.value.dayProgress[day] || 0
  }

  function saveDayProgress(day, index) {
    state.value.dayProgress[day] = index
    persist()
  }

  return {
    state,
    allWords,
    totalWords,
    vocabularyData,
    dueReviewWords,
    dueReviewCount,
    wordBookWords,
    wrongWordsList,
    wrongCount,
    progress,
    getDayWords,
    getDayTitle,
    markWord,
    reviewWord,
    completeDay,
    toggleWordBook,
    initWordState,
    addWrongWord,
    removeWrongWord,
    getDayProgress,
    saveDayProgress,
    persist
  }
})

export function generateWordId(word) {
  // 生成唯一ID：d{day}_{word}
  return `d${word.day}_${word.word.replace(/[^a-zA-Z]/g, '_')}`
}
