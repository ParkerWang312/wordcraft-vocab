import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadState, saveState, getDefaultState } from '../utils/storage.js'
import { getDefaultWordState, calculateNextReview, getTodayReviewCount } from '../utils/memoryCurve.js'
import vocabularyData from '../data/vocabulary.json'
import { useSettingsStore } from './settings.js'

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

  // 初始化每日活动统计（向后兼容老用户）
  if (!state.value.dailyActivity) {
    state.value.dailyActivity = {}
  }

  // 记录今日学习活动
  function recordActivity(field, delta = 1) {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!state.value.dailyActivity[today]) {
      state.value.dailyActivity[today] = { learned: 0, reviewed: 0, minutes: 0 }
    }
    state.value.dailyActivity[today][field] = (state.value.dailyActivity[today][field] || 0) + delta
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
      cat.words.map(w => ({ ...w, day: d.day, category: cat.name }))
    )
  }

  // 获取某一天的标题
  function getDayTitle(day) {
    const d = vocabularyData.days.find(d => d.day === Number(day))
    if (!d) return ''
    const title = d.title || d.categories.map(c => c.name).join(' / ')
    const idx = title.indexOf('：')
    return idx > -1 ? title.slice(idx + 1) : title
  }

  // ===== 新模式学习单位 =====

  /** 获取指定学习单位的单词列表 */
  function getUnitWords(unitIndex) {
    const settings = useSettingsStore()
    const mode = settings.data.planMode || 'categories'
    const idx = Math.max(1, Number(unitIndex))

    if (mode === 'categories') {
      const cat = allCategories.value[idx - 1]
      if (!cat) return []
      return cat.words.map(w => ({ ...w, day: cat.day, category: cat.name, unit: idx }))
    }

    if (mode === 'custom') {
      const wpd = settings.data.wordsPerDay || 30
      const start = (idx - 1) * wpd
      return allWords.value.slice(start, start + wpd).map(w => ({ ...w, unit: idx }))
    }

    // 28days 模式
    return getDayWords(idx).map(w => ({ ...w, unit: idx }))
  }

  /** 获取指定学习单位的标题 */
  function getUnitTitle(unitIndex) {
    const settings = useSettingsStore()
    const mode = settings.data.planMode || 'categories'
    const idx = Math.max(1, Number(unitIndex))

    if (mode === 'categories') {
      const cat = allCategories.value[idx - 1]
      return cat ? cat.name : ''
    }

    if (mode === 'custom') {
      return `Day ${idx}`
    }

    return getDayTitle(idx)
  }

  /** 计划模式下的总单位数 */
  const totalPlanUnits = computed(() => {
    const settings = useSettingsStore()
    const mode = settings.data.planMode || 'categories'
    if (mode === 'categories') return totalCategories.value
    if (mode === 'custom') return Math.ceil(totalWords.value / (settings.data.wordsPerDay || 30))
    return 28
  })

  /** 完成一个学习单位 */
  function completeUnit(unitIndex) {
    const d = Number(unitIndex)
    if (!state.value.completedUnits.includes(d)) {
      state.value.completedUnits.push(d)
    }

    // 28days 模式同时更新旧的 completedDays（向后兼容）
    if (d <= 28) {
      if (!state.value.completedDays.includes(d)) {
        state.value.completedDays.push(d)
      }
    }

    // 更新当前单位
    let nextUnit = d + 1
    for (let i = 1; i < nextUnit; i++) {
      if (!state.value.completedUnits.includes(i)) {
        nextUnit = i
        break
      }
    }
    if (state.value.currentPlanUnit <= d) {
      state.value.currentPlanUnit = Math.min(nextUnit, totalPlanUnits.value + 1)
    }

    // 28days 模式同步 currentDay
    const settings = useSettingsStore()
    if ((settings.data.planMode || 'categories') === '28days' && nextUnit <= 29) {
      state.value.currentDay = nextUnit
    }

    updateStreak()
    persist()
  }

  /** 当前应学习的单位 */
  const currentUnit = computed(() => {
    if (state.value.completedUnits.length > 0) {
      const next = Math.max(...state.value.completedUnits) + 1
      return Math.min(next, totalPlanUnits.value)
    }
    return 1
  })

  /** 切换计划模式时重新计算已完成单位 */
  function recalcCompletedUnits(mode, wordsPerDay) {
    const newCompleted = []
    // 判断单词是否已学过（learnedAt 不为空），而非是否完全掌握
    function isLearned(w, day) {
      const id = 'd' + day + '_' + w.word.replace(/[^a-zA-Z]/g, '_')
      const ws = state.value.wordStates[id]
      return ws && (ws.status === 'known' || ws.status === 'learning' || ws.status === 'mastered')
    }

    if (mode === 'categories') {
      allCategories.value.forEach((cat, i) => {
        const allDone = cat.words.every(w => isLearned(w, cat.day))
        if (allDone) newCompleted.push(i + 1)
      })
    } else if (mode === 'custom') {
      const wpd = wordsPerDay || 30
      let idx = 0
      const words = allWords.value
      while (idx < words.length) {
        const chunk = words.slice(idx, idx + wpd)
        const allDone = chunk.every(w => isLearned(w, w.day))
        if (allDone) newCompleted.push(Math.floor(idx / wpd) + 1)
        idx += wpd
      }
    } else {
      // 28days
      vocabularyData.days.forEach(d => {
        const dayWords = d.categories.flatMap(c => c.words)
        const allDone = dayWords.every(w => isLearned(w, d.day))
        if (allDone) newCompleted.push(d.day)
      })
    }

    state.value.completedUnits = newCompleted
    state.value.completedDays = mode === '28days' ? [...newCompleted] : []

    const nextUnit = newCompleted.length > 0
      ? Math.max(...newCompleted) + 1
      : 1
    state.value.currentPlanUnit = nextUnit

    if (mode === '28days') {
      state.value.currentDay = Math.min(nextUnit, 29)
    }

    persist()
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

    // 词已在SM-2复习管线中（有nextReviewAt），重学时不影响曲线
    const inSchedule = !!ws.nextReviewAt

    if (known) {
      ws.status = 'known'
      if (!inSchedule) {
        // 首次学习：设置SM-2首日计划
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + 1)
        nextDate.setHours(0, 0, 0, 0)
        ws.nextReviewAt = nextDate.toISOString()
        ws.interval = 1
      } else {
        // 旧词重学：仅标记时间，不动SM-2
        ws.lastRelearnedAt = new Date().toISOString()
      }
    } else {
      ws.status = 'learning'
      if (!inSchedule) {
        // 首次学习不认识：明天再来
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + 1)
        nextDate.setHours(0, 0, 0, 0)
        ws.nextReviewAt = nextDate.toISOString()
        ws.interval = 0
      }
      // 旧词重学不认识：只改状态，不动SM-2
    }
    state.value.stats.totalLearned++
    recordActivity('learned', 1)
    updateStreak()
    persist()
  }

  // 复习反馈
  function reviewWord(wordId, quality) {
    const ws = state.value.wordStates[wordId] || initWordState(wordId)
    const updated = calculateNextReview(ws, quality)
    state.value.wordStates[wordId] = updated
    state.value.stats.totalReviewed++
    recordActivity('reviewed', 1)
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

  // === 错题本 ===
  function addWrongWord(wordId) {
    if (!state.value.wrongWords[wordId]) {
      state.value.wrongWords[wordId] = { wrongCount: 0, lastWrongAt: '' }
    }
    state.value.wrongWords[wordId].wrongCount++
    state.value.wrongWords[wordId].lastWrongAt = new Date().toISOString()
    persist()
  }

  // 只在"记得"时调用：从错题本中扣 1（>=1 才彻底移除）
  function acknowledgeWrongWord(wordId) {
    if (state.value.wrongWords[wordId]) {
      state.value.wrongWords[wordId].wrongCount = Math.max(0, state.value.wrongWords[wordId].wrongCount - 1)
      if (state.value.wrongWords[wordId].wrongCount === 0) {
        delete state.value.wrongWords[wordId]
      }
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

  // 分类统计
  const allCategories = computed(() => {
    const list = []
    vocabularyData.days.forEach(day => {
      day.categories.forEach(cat => {
        list.push({ name: cat.name, words: cat.words, day: day.day })
      })
    })
    return list
  })
  const totalCategories = computed(() => allCategories.value.length)

  // 已完成的分类（所有单词标记为 known）
  const completedCategories = computed(() => {
    return allCategories.value.filter(cat =>
      cat.words.every(w => {
        const id = generateWordId({ ...w, day: cat.day })
        return state.value.wordStates[id]?.status === 'known'
      })
    ).length
  })

  // 计划进度（根据 planMode 动态计算）
  const planProgress = computed(() => {
    const settings = useSettingsStore()
    const mode = settings.data.planMode || 'categories'

    if (mode === 'categories') {
      return {
        completed: completedCategories.value,
        total: totalCategories.value,
        percentage: totalCategories.value
          ? Math.round((completedCategories.value / totalCategories.value) * 100)
          : 0
      }
    }

    if (mode === 'custom') {
      const wpd = settings.data.wordsPerDay || 30
      const totalPlanDays = Math.ceil(totalWords.value / wpd)
      const learned = state.value.stats?.totalLearned || 0
      const completedPlanDays = Math.min(totalPlanDays, Math.ceil(learned / wpd))
      return {
        completed: completedPlanDays,
        total: totalPlanDays,
        percentage: Math.round((completedPlanDays / totalPlanDays) * 100)
      }
    }

    // 默认：28天计划（使用 completedUnits 统一追踪）
    return {
      completed: state.value.completedUnits.length,
      total: vocabularyData.totalDays,
      percentage: Math.round((state.value.completedUnits.length / vocabularyData.totalDays) * 100)
    }
  })

  // 每日学习进度（记录学到了第几个单词）
  function getDayProgress(day) {
    const v = state.value.dayProgress[day]
    if (typeof v === 'number') return v
    if (v && typeof v === 'object') return v.wordIndex || 0
    return 0
  }

  function saveDayProgress(day, index) {
    const existing = state.value.dayProgress[day]
    if (typeof existing === 'object' && existing !== null) {
      existing.wordIndex = index
    } else {
      state.value.dayProgress[day] = index
    }
    persist()
  }

  // 设置天是否需要练习（强制练习模式用）
  function setDayNeedsPractice(day, needs) {
    const existing = state.value.dayProgress[day]
    const wordIndex = typeof existing === 'number' ? existing : (existing?.wordIndex || 0)
    state.value.dayProgress[day] = { wordIndex, needsPractice: needs }
    persist()
  }

  function getDayNeedsPractice(day) {
    const v = state.value.dayProgress[day]
    if (v && typeof v === 'object') return !!v.needsPractice
    return false
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
    planProgress,
    totalCategories,
    allCategories,
    getDayWords,
    getDayTitle,
    getUnitWords,
    getUnitTitle,
    completeUnit,
    currentUnit,
    totalPlanUnits,
    recalcCompletedUnits,
    markWord,
    reviewWord,
    completeDay,
    toggleWordBook,
    initWordState,
    addWrongWord,
    acknowledgeWrongWord,
    getDayProgress,
    saveDayProgress,
    setDayNeedsPractice,
    getDayNeedsPractice,
    recordActivity,
    persist
  }
})

export function generateWordId(word) {
  // 生成唯一ID：d{day}_{word}
  return `d${word.day}_${word.word.replace(/[^a-zA-Z]/g, '_')}`
}
