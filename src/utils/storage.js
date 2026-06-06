const STORAGE_KEY = 'wordcraft_vocab'

export function loadState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    const state = JSON.parse(data)
    // 修复：如果 completedDays 有数据但 currentDay 为 1，自动恢复
    if (state.currentDay === 1 && state.completedDays && state.completedDays.length > 0) {
      state.currentDay = Math.max(...state.completedDays) + 1
    }
    return state
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    const json = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, json)
  } catch (e) {
    // localStorage 满了或其他错误，静默降级
    console.warn('Failed to save state:', e.message)
  }
}

export function getDefaultState() {
  return {
    currentDay: 1,
    completedDays: [],
    streakDays: 0,
    lastStudyDate: null,
    wordStates: {},
    wrongWords: {},
    dayProgress: {},
    stats: {
      totalLearned: 0,
      totalReviewed: 0,
      totalMastered: 0
    }
  }
}
