import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import systemWordbooks from '../data/wordbooks.json'

const WBS_KEY = 'wordcraft_wordbooks'
const ENTRIES_KEY = 'wordcraft_wordbook_entries'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useWordbookStore = defineStore('wordbook', () => {
  // ===== State =====
  const wordbooks = ref([])
  const entries = ref([])

  // ===== Init =====
  function init() {
    const savedBooks = loadJSON(WBS_KEY)
    const savedEntries = loadJSON(ENTRIES_KEY)

    if (savedBooks && savedEntries) {
      wordbooks.value = migrateWordbooks(savedBooks, savedEntries)
      entries.value = savedEntries
    } else {
      seedSystemWordbooks()
    }
  }

  function migrateWordbooks(books, existingEntries) {
    const existingIds = new Set(books.map(b => b.id))
    let needsSave = false
    systemWordbooks.forEach(sys => {
      if (!existingIds.has(sys.id)) {
        books.push({
          id: sys.id,
          name: sys.name,
          description: sys.description,
          type: sys.type,
          coverColor: sys.coverColor,
          coverLetter: sys.coverLetter || '',
          isDeletable: sys.isDeletable,
          createdAt: Date.now(),
          settings: { ...sys.settings },
          practiceRound: 0,
          totalLearnedInRound: 0,
          practiceHistory: []
        })
        sys.words.forEach(w => {
          existingEntries.push({
            ...w,
            wordbookId: sys.id,
            learned: false,
            createdAt: Date.now()
          })
        })
        needsSave = true
      }
    })
    if (needsSave) persistAll()
    return books
  }

  function seedSystemWordbooks() {
    const books = []
    const allEntries = []

    systemWordbooks.forEach(sys => {
      books.push({
        id: sys.id,
        name: sys.name,
        description: sys.description,
        type: sys.type,
        coverColor: sys.coverColor,
        isDeletable: sys.isDeletable,
        createdAt: Date.now(),
        settings: { ...sys.settings },
        practiceRound: 0,
        totalLearnedInRound: 0,
        practiceHistory: []
      })
      sys.words.forEach(w => {
        allEntries.push({
          ...w,
          wordbookId: sys.id,
          learned: false,
          createdAt: Date.now()
        })
      })
    })

    wordbooks.value = books
    entries.value = allEntries
    persistAll()
  }

  // ===== Helpers =====
  function loadJSON(key) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  function saveJSON(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
  }

  function persistAll() {
    saveJSON(WBS_KEY, wordbooks.value)
    saveJSON(ENTRIES_KEY, entries.value)
  }

  function getBook(id) {
    return wordbooks.value.find(b => b.id === id)
  }

  // ===== Getters =====
  const systemBooks = computed(() =>
    wordbooks.value.filter(b => b.type === 'system')
  )
  const userBooks = computed(() =>
    wordbooks.value.filter(b => b.type === 'user')
  )
  function getWordsByBookId(id) {
    return entries.value.filter(e => e.wordbookId === id)
  }

  // ===== Actions: 单词本 CRUD =====
  function createWordBook(name, description = '') {
    const book = {
      id: genId(),
      name,
      description,
      type: 'user',
      coverColor: randomColor(),
      isDeletable: true,
      createdAt: Date.now(),
      settings: { wordsPerSession: 20 },
      practiceRound: 0,
      totalLearnedInRound: 0,
      practiceHistory: []
    }
    wordbooks.value.push(book)
    persistAll()
    return book
  }

  function deleteWordBook(id) {
    const book = getBook(id)
    if (!book || !book.isDeletable) return false
    wordbooks.value = wordbooks.value.filter(b => b.id !== id)
    entries.value = entries.value.filter(e => e.wordbookId !== id)
    persistAll()
    return true
  }

  function updateWordBook(id, fields) {
    const book = getBook(id)
    if (!book) return
    Object.assign(book, fields)
    persistAll()
  }

  // ===== Actions: 单词 CRUD =====
  function addWord(wordbookId, word, meaning, phonetic = '') {
    const entry = {
      id: genId(),
      wordbookId,
      word,
      meaning,
      phonetic,
      learned: false,
      createdAt: Date.now()
    }
    entries.value.push(entry)
    persistAll()
    return entry
  }

  function addWordsBatch(wordbookId, wordList) {
    // wordList: [{ word, meaning, phonetic }]
    if (!wordList.length) return []
    const added = wordList.map(w => ({
      id: genId(),
      wordbookId,
      word: w.word,
      meaning: w.meaning,
      phonetic: w.phonetic || '',
      learned: false,
      createdAt: Date.now()
    }))
    entries.value.push(...added)
    persistAll()
    return added
  }

  function deleteWord(entryId) {
    entries.value = entries.value.filter(e => e.id !== entryId)
    persistAll()
  }

  // ===== Actions: 设置 =====
  function updateSettings(wordbookId, settings) {
    const book = getBook(wordbookId)
    if (!book) return
    book.settings = { ...book.settings, ...settings }
    persistAll()
  }

  // ===== Actions: 学习循环 =====
  function markLearned(entryId) {
    const entry = entries.value.find(e => e.id === entryId)
    if (!entry) return
    entry.learned = true

    const book = getBook(entry.wordbookId)
    if (book) {
      book.totalLearnedInRound = (book.totalLearnedInRound || 0) + 1
    }
    persistAll()
  }

  function getUnlearnedWords(wordbookId) {
    return entries.value.filter(e =>
      e.wordbookId === wordbookId && !e.learned
    )
  }

  function checkAndResetRound(wordbookId, needCount) {
    const book = getBook(wordbookId)
    if (!book) return false

    const unlearned = getUnlearnedWords(wordbookId)
    if (unlearned.length < needCount) {
      // 全部重置
      entries.value
        .filter(e => e.wordbookId === wordbookId)
        .forEach(e => { e.learned = false })
      book.totalLearnedInRound = 0
      book.practiceRound = (book.practiceRound || 0) + 1
      persistAll()
      return true // 表示开始了新一轮
    }
    return false
  }

  function resetAllLearned(wordbookId) {
    entries.value
      .filter(e => e.wordbookId === wordbookId)
      .forEach(e => { e.learned = false })
    const book = getBook(wordbookId)
    if (book) {
      book.totalLearnedInRound = 0
      book.practiceRound = 0
      book.practiceHistory = []
    }
    persistAll()
  }

  function reloadSystemBooks() {
    // 清除本地缓存，重新从 JSON 加载系统单词本
    localStorage.removeItem(WBS_KEY)
    localStorage.removeItem(ENTRIES_KEY)
    wordbooks.value = []
    entries.value = []
    seedSystemWordbooks()
  }

  // ===== Actions: 练习历史 =====
  function recordPractice(wordbookId, result) {
    const book = getBook(wordbookId)
    if (!book) return
    if (!book.practiceHistory) book.practiceHistory = []

    const today = new Date().toISOString().slice(0, 10)
    book.practiceHistory.push({
      date: today,
      total: result.total,
      correct: result.correct,
      wrong: result.wrong,
      retries: result.retries || {},
      duration: result.duration || 0,
      round: book.practiceRound || 0
    })
    persistAll()
  }

  function getTodayHistory(wordbookId) {
    const book = getBook(wordbookId)
    if (!book || !book.practiceHistory) return []
    const today = new Date().toISOString().slice(0, 10)
    return book.practiceHistory.filter(h => h.date === today)
  }

  function generateReportData(wordbookId) {
    const history = getTodayHistory(wordbookId)
    const book = getBook(wordbookId)
    if (!book) return null

    const totalSessions = history.length
    const totalQuestions = history.reduce((s, h) => s + h.total, 0)
    const totalCorrect = history.reduce((s, h) => s + h.correct, 0)
    const totalWrong = history.reduce((s, h) => s + h.wrong, 0)
    const totalDuration = history.reduce((s, h) => s + h.duration, 0)
    const accuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0

    // 合并所有 retries 统计错误单词
    const wrongWordMap = {}
    history.forEach(h => {
      if (h.retries) {
        Object.entries(h.retries).forEach(([word, count]) => {
          if (!wrongWordMap[word]) {
            const entry = entries.value.find(e => e.word === word && e.wordbookId === wordbookId)
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

    return {
      bookName: book.name,
      totalSessions,
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalDuration,
      accuracy,
      topWrongWords,
      round: book.practiceRound || 0,
      totalWords: getWordsByBookId(wordbookId).length,
      isEmpty: history.length === 0
    }
  }

  function clearPracticeHistory(wordbookId) {
    const book = getBook(wordbookId)
    if (!book) return
    book.practiceHistory = []
    persistAll()
  }

  // ===== Init on creation =====
  init()

  return {
    wordbooks,
    entries,
    systemBooks,
    userBooks,
    getWordsByBookId,
    getBook,
    createWordBook,
    deleteWordBook,
    updateWordBook,
    addWord,
    addWordsBatch,
    deleteWord,
    updateSettings,
    markLearned,
    getUnlearnedWords,
    checkAndResetRound,
    resetAllLearned,
    recordPractice,
    getTodayHistory,
    generateReportData,
    clearPracticeHistory,
    reloadSystemBooks,
    persistAll
  }
})

function randomColor() {
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  return colors[Math.floor(Math.random() * colors.length)]
}
