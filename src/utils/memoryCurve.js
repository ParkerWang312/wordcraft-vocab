// SM-2 简化版记忆曲线算法

const REVIEW_INTERVALS = [1, 3, 7, 15, 30]

export function getDefaultWordState(wordId) {
  return {
    wordId,
    status: 'unknown', // unknown | learning | known | mastered
    learnedAt: null,
    reviewCount: 0,
    nextReviewAt: null,
    easeFactor: 2.5,
    interval: 0,
    inWordBook: false
  }
}

export function calculateNextReview(wordState, quality) {
  const state = { ...wordState }

  if (quality === 0) {
    // 忘记 - 重置
    state.interval = 1
    state.reviewCount = 0
    state.status = 'unknown'
    state.easeFactor = Math.max(1.3, state.easeFactor - 0.2)
  } else {
    // 调整简易度系数（模糊也会轻度提升）
    const delta = quality === 2 ? 0.1 : 0.05
    state.easeFactor = Math.max(1.3, state.easeFactor + delta)

    // 计算下次复习间隔
    if (state.reviewCount === 0) {
      state.interval = quality === 2 ? 3 : 1
    } else if (state.reviewCount === 1) {
      state.interval = quality === 2 ? 7 : 3
    } else {
      state.interval = Math.round(state.interval * state.easeFactor)
    }

    state.reviewCount++

    // 更新状态
    if (state.reviewCount >= 4) {
      state.status = 'mastered'
    } else if (state.reviewCount >= 2) {
      state.status = 'known'
    } else {
      state.status = 'learning'
    }
  }

  // 设置下次复习时间
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + state.interval)
  nextDate.setHours(0, 0, 0, 0)
  state.nextReviewAt = nextDate.toISOString()

  return state
}

export function getDueReviewWords(wordStates) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Object.entries(wordStates).filter(([id, state]) => {
    if (!state.nextReviewAt) return false
    return new Date(state.nextReviewAt) <= now
  })
}

export function getTodayReviewCount(wordStates) {
  return getDueReviewWords(wordStates).length
}
