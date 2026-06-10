const STORAGE_KEY = 'wordcraft_vocab'
const BACKUP_KEY = 'wordcraft_vocab_backup'
const BACKUP_INTERVAL = 5 * 60 * 1000 // 5 分钟内最多备份一次
let lastBackupTime = 0

/**
 * 加载主状态。如主键缺失或损坏，尝试从备份恢复。
 */
export function loadState() {
  // 主键正常
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const state = JSON.parse(data)
      // 修复：如果 completedDays 有数据但 currentDay 为 1，自动恢复
      if (state.currentDay === 1 && state.completedDays && state.completedDays.length > 0) {
        state.currentDay = Math.max(...state.completedDays) + 1
      }
      return state
    }
  } catch (e) {
    console.warn('主状态数据损坏，尝试从备份恢复:', e.message)
  }

  // 主键缺失或损坏 → 尝试备份
  try {
    const backup = localStorage.getItem(BACKUP_KEY)
    if (backup) {
      const state = JSON.parse(backup)
      console.info('已从备份恢复数据')
      // 立刻写回主键
      try {
        localStorage.setItem(STORAGE_KEY, backup)
      } catch {}
      return state
    }
  } catch (e) {
    console.warn('备份数据也损坏:', e.message)
  }

  return null
}

/**
 * 写入主状态。失败时自动备份当前内存状态到备份键。
 */
export function saveState(state) {
  const json = JSON.stringify(state)
  try {
    localStorage.setItem(STORAGE_KEY, json)
  } catch (e) {
    console.warn('Failed to save state:', e.message)
    // 写入失败：尝试写备份（用于下次启动恢复）
    try {
      localStorage.setItem(BACKUP_KEY, json)
    } catch {}
  }

  // 定时备份：成功写入主键 5 分钟后，同步一份到备份键
  const now = Date.now()
  if (now - lastBackupTime > BACKUP_INTERVAL) {
    try {
      localStorage.setItem(BACKUP_KEY, json)
      lastBackupTime = now
    } catch {}
  }
}

/**
 * 手动触发一次完整备份（如导出/重置前）
 */
export function backupNow(state) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(state))
    lastBackupTime = Date.now()
  } catch (e) {
    console.warn('备份失败:', e.message)
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
    dailyActivity: {},  // { 'YYYY-MM-DD': { learned: N, reviewed: M, minutes: K } }
    stats: {
      totalLearned: 0,
      totalReviewed: 0,
      totalMastered: 0
    }
  }
}
