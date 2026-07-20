<template>
  <div class="page dictation-page">
    <van-nav-bar
      title="默写"
      left-arrow
      @click-left="confirmLeave"
      :fixed="false"
    />
    <div class="nav-timer" v-if="!finished">{{ formatTime(timerElapsed) }}</div>

    <template v-if="!finished && currentQuestion">
      <!-- 统计 -->
      <div class="review-stats">
        <div class="stat-card">
          <span class="stat-card-num">{{ score }}</span>
          <span class="stat-card-label">得分</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-num c-green">{{ correctCount }}</span>
          <span class="stat-card-label">正确</span>
        </div>
        <div class="stat-card danger">
          <span class="stat-card-num">{{ totalWrongCount }}</span>
          <span class="stat-card-label">错误</span>
        </div>
        <div class="stat-card" :class="comboCardClass">
          <span class="stat-card-num" :class="{ 'combo-pop': comboAnimating }" :style="comboStyle">{{ combo }}</span>
          <span class="stat-card-label">连击</span>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="day-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
      </div>

      <!-- 题干 -->
      <div class="question-box" v-if="!showErrorCard">
        <div class="audio-area" @click="playCurrentWord">
          <span class="audio-icon">🔊</span>
          <span class="audio-label">点击播放发音</span>
        </div>

        <!-- 输入区 -->
        <div class="input-area">
          <input
            ref="inputRef"
            v-model="userInput"
            class="spell-input"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="输入英文单词..."
            @keyup.enter="submitAnswer"
          />
          <button class="submit-btn" @click="submitAnswer" :disabled="!userInput.trim()">
            提交
          </button>
        </div>

        <!-- 提示（点击显示） -->
        <div class="hint-toggle" @click="showHint = !showHint">
          {{ showHint ? currentQuestion.meaning : '点击查看中文提示' }}
        </div>
      </div>

      <!-- 错误卡片 -->
      <div class="error-card" v-if="showErrorCard">
        <div class="error-word-row">
          <span class="error-word">{{ currentQuestion.word }}</span>
          <span class="speak-btn" @click="playCurrentWord">🔊</span>
        </div>
        <div class="error-phonetic" v-if="currentQuestion.phonetic">{{ currentQuestion.phonetic }}</div>
        <div class="error-meaning">{{ currentQuestion.meaning }}</div>
        <div class="error-user-input" v-if="lastUserInput">
          你输入的是：<span class="wrong-spelling">{{ lastUserInput }}</span>
        </div>
        <van-button class="continue-btn" round type="primary" @click="retryQuestion">
          继续
        </van-button>
      </div>
    </template>

    <!-- 完成页 -->
    <div class="complete-box" v-if="finished">
      <div class="result-card">
        <span class="emoji">{{ accuracy >= 80 ? '🎉' : '💪' }}</span>
        <h3>{{ accuracy >= 80 ? '太棒了！' : '继续加油' }}</h3>
        <p class="result-detail">正确率：{{ accuracy }}%</p>
        <p class="result-detail">首次写对 {{ correctCount }} / {{ originalCount }} 词</p>
        <p class="result-detail" v-if="totalWrongCount > 0">错词已全部默写正确 ✅</p>
        <p class="result-detail" v-if="questions.length > originalCount">共重写 {{ questions.length - originalCount }} 次</p>
        <p class="result-detail">最大连击: {{ maxCombo }}</p>
      </div>
      <div class="result-actions">
        <van-button class="btn-home" round @click="goBack">返回</van-button>
        <van-button class="btn-retry" round @click="startDictation">再来一轮</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWordbookStore } from '../stores/wordbook.js'
import { speak } from '../utils/speech.js'
import { playCorrectSound, playWrongSound } from '../utils/sounds.js'
import { showDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useWordbookStore()

const id = computed(() => route.params.id)
const book = computed(() => store.getBook(id.value))

// 状态
const questions = ref([])
const originalCount = ref(0)
const currentIndex = ref(0)
const score = ref(0)
const correctCount = ref(0)
const totalWrongCount = ref(0)
const showErrorCard = ref(false)
const finished = ref(false)
const userInput = ref('')
const lastUserInput = ref('')
const showHint = ref(false)
const inputRef = ref(null)

// 连击
const combo = ref(0)
const comboAnimating = ref(false)
const maxCombo = ref(0)

// 错词重试记录
const wrongWordRetries = ref({})

// 计时
const timerElapsed = ref(0)
let timerInterval = null

// 轮次
const currentRound = ref(0)

// 连击动画
watch(combo, (val) => {
  if (val > 1) {
    comboAnimating.value = true
    setTimeout(() => { comboAnimating.value = false }, 400)
  }
})

const comboCardClass = computed(() => {
  if (combo.value >= 10) return 'combo-fire'
  if (combo.value >= 5) return 'combo-hot'
  if (combo.value >= 3) return 'combo-warm'
  return ''
})

const comboStyle = computed(() => {
  if (combo.value >= 10) return { color: '#fff', textShadow: '0 0 10px #F59E0B, 0 0 20px #EF4444' }
  if (combo.value >= 5) return { color: '#F59E0B' }
  return {}
})

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function playCurrentWord() {
  if (currentQuestion.value) {
    speak(currentQuestion.value.word)
  }
}

const currentQuestion = computed(() =>
  questions.value[currentIndex.value]
)

const progressPct = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
})

const accuracy = computed(() => {
  if (originalCount.value === 0) return 0
  return Math.round((correctCount.value / originalCount.value) * 100)
})

function generateQuestions() {
  const bookObj = book.value
  if (!bookObj) return []

  const wordPerSession = bookObj.settings?.wordsPerSession || 20
  const allWords = store.getWordsByBookId(id.value)

  if (allWords.length === 0) return []

  let unlearned = allWords.filter(e => !e.learned)

  if (unlearned.length === 0) {
    store.checkAndResetRound(id.value, wordPerSession)
    currentRound.value = bookObj.practiceRound || 0
    unlearned = allWords.filter(e => !e.learned)
  } else {
    currentRound.value = bookObj.practiceRound || 0
  }

  let pool
  if (unlearned.length >= wordPerSession) {
    pool = shuffle(unlearned).slice(0, wordPerSession)
  } else {
    const learned = allWords.filter(e => e.learned)
    pool = [
      ...unlearned,
      ...shuffle(learned).slice(0, wordPerSession - unlearned.length)
    ]
  }

  return pool.map(entry => ({
    entryId: entry.id,
    word: entry.word,
    phonetic: entry.phonetic || '',
    meaning: entry.meaning
  }))
}

function startDictation() {
  const q = generateQuestions()
  if (q.length === 0) {
    showDialog({ title: '提示', message: '单词本中还没有单词，请先添加单词。' })
      .then(() => router.back())
    return
  }
  questions.value = q
  originalCount.value = q.length
  currentIndex.value = 0
  score.value = 0
  correctCount.value = 0
  totalWrongCount.value = 0
  showErrorCard.value = false
  finished.value = false
  userInput.value = ''
  lastUserInput.value = ''
  showHint.value = false
  wrongWordRetries.value = {}
  combo.value = 0
  comboAnimating.value = false
  maxCombo.value = 0

  timerElapsed.value = 0
  clearInterval(timerInterval)
  timerInterval = setInterval(() => { timerElapsed.value++ }, 1000)

  nextTick(() => {
    inputRef.value?.focus()
    if (currentQuestion.value) {
      setTimeout(() => speak(currentQuestion.value.word), 400)
    }
  })
}

function submitAnswer() {
  if (!userInput.value.trim()) return

  const answer = userInput.value.trim().toLowerCase()
  const correct = answer === currentQuestion.value.word.toLowerCase()
  lastUserInput.value = userInput.value.trim()

  if (correct) {
    playCorrectSound()
    score.value += 10
    combo.value++
    if (combo.value >= 3) score.value += 5
    if (currentIndex.value < originalCount.value) {
      correctCount.value++
    }
    store.markLearned(currentQuestion.value.entryId)
    userInput.value = ''
    showHint.value = false
    setTimeout(() => nextQuestion(), 600)
  } else {
    playWrongSound()
    combo.value = 0
    if (currentIndex.value < originalCount.value) {
      totalWrongCount.value++
    }
    const word = currentQuestion.value.word
    wrongWordRetries.value[word] = (wrongWordRetries.value[word] || 0) + 1
    showErrorCard.value = true
  }

  maxCombo.value = Math.max(maxCombo.value, combo.value)
}

function retryQuestion() {
  showErrorCard.value = false
  userInput.value = ''
  // 追加到队尾
  questions.value.push({ ...currentQuestion.value })
  // 原地重试
  nextTick(() => {
    inputRef.value?.focus()
    playCurrentWord()
  })
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    userInput.value = ''
    showHint.value = false
    showErrorCard.value = false
    lastUserInput.value = ''
  } else {
    finishDictation()
  }
}

function finishDictation() {
  finished.value = true
  clearInterval(timerInterval)
  store.recordPractice(id.value, {
    total: originalCount.value,
    correct: correctCount.value,
    wrong: totalWrongCount.value,
    retries: { ...wrongWordRetries.value },
    duration: timerElapsed.value
  })

  // 如果本轮所有单词都已学会，立即推进轮次并持久化
  const unlearned = store.getWordsByBookId(id.value).filter(e => !e.learned)
  if (unlearned.length === 0) {
    const bookObj = book.value
    if (bookObj) {
      bookObj.practiceRound = (bookObj.practiceRound || 0) + 1
      bookObj.totalLearnedInRound = 0
      store.persistAll()
    }
  }
}

function confirmLeave() {
  if (!finished.value && correctCount.value > 0) {
    showDialog({
      title: '确定退出？',
      message: '本次默写进度将丢失。',
      confirmButtonText: '退出',
      cancelButtonText: '继续默写'
    }).then(() => {
      clearInterval(timerInterval)
      router.back()
    }).catch(() => {})
  } else {
    clearInterval(timerInterval)
    router.back()
  }
}

function goBack() {
  router.push(`/wordbook/${id.value}`)
}

// 切换题目自动播放发音
watch(currentIndex, () => {
  if (!finished.value && currentQuestion.value && !showErrorCard.value) {
    nextTick(() => {
      inputRef.value?.focus()
      setTimeout(() => speak(currentQuestion.value.word), 300)
    })
  }
})

onMounted(() => {
  startDictation()
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<style scoped>
.dictation-page {
  padding: 14px 16px 80px;
}

.nav-timer {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

.review-stats {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin: 20px 0 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 2px;
  border-radius: 12px;
  background: var(--accent-light);
  width: 72px;
  flex-shrink: 0;
}

.stat-card.danger { background: #FEF2F2; }
[data-theme="dark"] .stat-card.danger { background: #3B1212; }

.stat-card-num {
  font-size: 24px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1.1;
}

.stat-card-num.c-green { color: #10B981; }
.stat-card.danger .stat-card-num { color: var(--danger); }

.stat-card-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 连击动画 */
.combo-pop {
  animation: comboBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform;
}
@keyframes comboBounce {
  0% { transform: translateZ(0) scale(1); }
  30% { transform: translateZ(0) scale(1.4); }
  60% { transform: translateZ(0) scale(0.9); }
  100% { transform: translateZ(0) scale(1); }
}
.stat-card.combo-warm { background: #FFF7ED; border: 1px solid #FDBA74; }
[data-theme="dark"] .stat-card.combo-warm { background: #3B1F0A; border-color: #F59E0B; }

.stat-card.combo-hot {
  background: #FFFBEB; border: 2px solid #F59E0B;
  animation: comboPulse 1.5s ease-in-out infinite; will-change: transform;
}
[data-theme="dark"] .stat-card.combo-hot { background: #3B2E00; border-color: #F59E0B; }

.stat-card.combo-fire {
  background: linear-gradient(135deg, #FEF3C7, #FDE68A); border: 2px solid #F59E0B;
  animation: comboPulse 0.8s ease-in-out infinite; box-shadow: 0 0 16px rgba(245,158,11,0.4);
  will-change: transform;
}
[data-theme="dark"] .stat-card.combo-fire {
  background: linear-gradient(135deg, #4A2E00, #78350F); border-color: #F59E0B;
  box-shadow: 0 0 16px rgba(245,158,11,0.5);
}
@keyframes comboPulse {
  0%, 100% { transform: translateZ(0) scale(1); }
  50% { transform: translateZ(0) scale(1.05); }
}

.day-progress {
  display: flex; align-items: center; gap: 10px;
  max-width: 360px; margin: 0 auto 14px;
}
.progress-track { flex: 1; height: 5px; border-radius: 3px; background: var(--border); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), #EC4899); transition: width 0.3s ease; }
.progress-text { font-size: 13px; font-weight: 700; color: var(--text-primary); min-width: 44px; }

.question-box {
  background: var(--bg-card); border-radius: 16px; padding: 24px;
  box-shadow: var(--shadow); border: 1px solid var(--border);
  max-width: 440px; margin: 0 auto;
}

.audio-area {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px; border-radius: 14px; background: var(--accent-light);
  margin-bottom: 20px; cursor: pointer; user-select: none; transition: opacity 0.2s;
}
.audio-area:active { opacity: 0.7; }
.audio-icon { font-size: 36px; }
.audio-label { font-size: 13px; color: var(--text-secondary); }

.input-area { display: flex; gap: 8px; margin-bottom: 14px; }

.spell-input {
  flex: 1; padding: 12px 16px; border-radius: 12px;
  border: 2px solid var(--border); background: var(--bg-primary);
  color: var(--text-primary); font-size: 18px; font-weight: 600;
  outline: none; transition: border-color 0.2s; font-family: 'Courier New', monospace;
}
.spell-input:focus { border-color: var(--accent); }
.spell-input::placeholder { font-weight: 400; font-family: inherit; }

.submit-btn {
  padding: 12px 20px; border-radius: 12px; border: none;
  background: var(--accent); color: #fff; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s;
}
.submit-btn:disabled { opacity: 0.4; }

.hint-toggle {
  text-align: center; padding: 10px; border-radius: 10px;
  background: var(--accent-light); color: var(--text-secondary);
  font-size: 13px; cursor: pointer; user-select: none; transition: opacity 0.2s;
}
.hint-toggle:active { opacity: 0.7; }

/* 错误卡片 */
.error-card {
  background: var(--bg-card); border-radius: 20px; padding: 36px 24px;
  box-shadow: var(--shadow); border: 1px solid var(--border);
  text-align: center; max-width: 360px; margin: 40px auto;
}
.error-word-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px; }
.error-word { font-size: 36px; font-weight: 800; color: var(--danger); }
.speak-btn { font-size: 20px; cursor: pointer; padding: 6px; border-radius: 50%; background: var(--accent-light); user-select: none; }
.error-phonetic { font-size: 16px; color: var(--text-secondary); margin-bottom: 8px; }
.error-meaning { font-size: 16px; font-weight: 600; color: var(--accent); margin-bottom: 8px; }
.error-user-input { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; }
.wrong-spelling { color: var(--danger); font-weight: 700; text-decoration: line-through; }
.continue-btn { width: 160px !important; }

/* 完成页 */
.complete-box { margin-top: 20px; max-width: 440px; margin-left: auto; margin-right: auto; }
.result-card {
  text-align: center; background: var(--bg-card); border-radius: 16px; padding: 30px;
  box-shadow: var(--shadow); border: 1px solid var(--border); margin-bottom: 16px;
}
.result-card .emoji { font-size: 56px; display: block; margin-bottom: 12px; }
.result-card h3 { font-size: 22px; margin-bottom: 12px; }
.result-detail { font-size: 14px; color: var(--text-secondary); margin-bottom: 4px; }
.result-actions { display: flex; gap: 12px; justify-content: center; }
.btn-home, .btn-retry {
  width: 120px !important; height: 42px !important; font-size: 15px !important;
  font-weight: 700 !important; border-radius: 20px !important; color: #fff !important; border: none !important;
}
.btn-home { background: #6B7280 !important; }
.btn-retry { background: #F59E0B !important; }
</style>
