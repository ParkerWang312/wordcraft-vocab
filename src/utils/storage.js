const STORAGE_KEY = 'wordcraft_vocab'

export function loadState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save state:', e)
  }
}

export function getDefaultState() {
  return {
    currentDay: 1,
    completedDays: [],
    streakDays: 0,
    lastStudyDate: null,
    wordStates: {}, // { wordId: WordState }
    stats: {
      totalLearned: 0,
      totalReviewed: 0,
      totalMastered: 0
    }
  }
}
