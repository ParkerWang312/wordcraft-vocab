<template>
  <div class="page wb-practice-page">
    <van-nav-bar
      title="练习"
      left-arrow
      @click-left="confirmLeave"
      :fixed="false"
    />
    <div class="nav-timer" v-if="!finished">{{ formatTime(timerElapsed) }}</div>

    <template v-if="!finished && currentQuestion">
      <!-- 顶部统计 -->
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

      <!-- 题目区域 -->
      <div class="question-box" v-if="!showErrorCard">
        <div class="question-word-row">
          <div class="question-word">{{ currentQuestion.word }}</div>
          <span class="speak-btn" @click="playCurrentWord">🔊</span>
        </div>
        <div class="question-prompt">请选择正确的中文释义</div>

        <div class="options">
          <div
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            :class="['option', {
              selected: answered && selectedIndex === idx,
              correct: answered && idx === currentQuestion.answer,
              wrong: answered && selectedIndex === idx && idx !== currentQuestion.answer
            }]"
            @click="selectOption(idx)"
          >
            <span class="option-letter">{{ letters[idx] }}</span>
            <span class="option-text">{{ opt }}</span>
          </div>
        </div>

        <!-- 正确反馈 -->
        <div class="feedback correct-feedback" v-if="answered && isLastCorrect">
          <span class="feedback-text">✅ 正确！</span>
        </div>
      </div>

      <!-- 错误卡片 -->
      <div class="error-card" v-if="showErrorCard">
        <div class="error-word-row">
          <span class="error-word">{{ currentQuestion.word }}</span>
          <span class="speak-btn" @click="playCurrentWord">🔊</span>
        </div>
        <div class="error-phonetic" v-if="currentQuestion.phonetic">{{ currentQuestion.phonetic }}</div>
        <div class="error-meaning">❌ {{ getCorrectMeaning() }}</div>
        <van-button class="continue-btn" round type="primary" @click="retryQuestion">
          继续练习
        </van-button>
      </div>
    </template>

    <!-- 完成页 -->
    <div class="complete-box" v-if="finished">
      <div class="result-card">
        <span class="emoji">{{ accuracy >= 80 ? '🎉' : '💪' }}</span>
        <h3>{{ accuracy >= 80 ? '太棒了！' : '继续加油' }}</h3>
        <p class="result-detail">正确率：{{ accuracy }}%</p>
        <p class="result-detail">首次答对 {{ correctCount }} / {{ originalCount }} 题</p>
        <p class="result-detail" v-if="totalWrongCount > 0">错题已全部重做正确 ✅</p>
        <p class="result-detail" v-if="questions.length > originalCount">共重做 {{ questions.length - originalCount }} 次</p>
        <p class="result-detail">最大连击: {{ maxCombo }}</p>
        <p class="result-detail" v-if="currentRound >= 0">已学到第 {{ currentRound + 1 }} 轮</p>
      </div>
      <div class="result-actions">
        <van-button class="btn-home" round @click="goBack">返回</van-button>
        <van-button class="btn-retry" round @click="startPractice">再来一轮</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWordbookStore } from '../stores/wordbook.js'
import { speak } from '../utils/speech.js'
import { showDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useWordbookStore()

const id = computed(() => route.params.id)
const book = computed(() => store.getBook(id.value))
const letters = ['A', 'B', 'C', 'D']

// 状态
const questions = ref([])
const originalCount = ref(0)
const currentIndex = ref(0)
const score = ref(0)
const correctCount = ref(0)
const totalWrongCount = ref(0)
const answered = ref(false)
const selectedIndex = ref(-1)
const isLastCorrect = ref(false)
const showErrorCard = ref(false)
const finished = ref(false)

// 记录每道题的首次答题状态：unanswered / correct / wrong
const questionStates = ref([])

// 连击
const combo = ref(0)
const comboAnimating = ref(false)
const maxCombo = ref(0)

// 记录本次练习中首次答错的单词（retries），用于 practiceHistory
const wrongWordRetries = ref({})

// 计时
const timerElapsed = ref(0)
let timerInterval = null

// 当前轮次（记录练习开始时）
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

function getCorrectMeaning() {
  if (!currentQuestion.value) return ''
  return currentQuestion.value.options[currentQuestion.value.answer]
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

  // 筛选未学过的单词
  let unlearned = allWords.filter(e => !e.learned)

  // 全部学完才重置新一轮；有少量未学则用已学补足
  if (unlearned.length === 0) {
    store.checkAndResetRound(id.value, wordPerSession)
    currentRound.value = bookObj.practiceRound || 0
    unlearned = allWords.filter(e => !e.learned)
  } else {
    currentRound.value = bookObj.practiceRound || 0
  }

  // 构建选题池：优先未学，不够的用已学单词补足
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

  // 生成题目
  return pool.map(entry => {
    // 从其他单词取3个干扰项
    const others = allWords
      .filter(e => e.id !== entry.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const options = shuffle([
      entry.meaning,
      ...others.map(o => o.meaning)
    ])

    return {
      entryId: entry.id,
      word: entry.word,
      phonetic: entry.phonetic || '',
      meaning: entry.meaning,
      options,
      answer: options.indexOf(entry.meaning)
    }
  })
}

function startPractice() {
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
  answered.value = false
  selectedIndex.value = -1
  isLastCorrect.value = false
  showErrorCard.value = false
  finished.value = false
  questionStates.value = new Array(q.length).fill('unanswered')
  wrongWordRetries.value = {}
  combo.value = 0
  comboAnimating.value = false
  maxCombo.value = 0

  // 启动计时
  timerElapsed.value = 0
  clearInterval(timerInterval)
  timerInterval = setInterval(() => { timerElapsed.value++ }, 1000)

  // 首题自动播放（startPractice 不会触发 watch，需要手动播）
  nextTick(() => {
    if (currentQuestion.value) {
      speak(currentQuestion.value.word)
    }
  })
}

function selectOption(idx) {
  if (answered.value) return
  selectedIndex.value = idx
  answered.value = true

  const correct = idx === currentQuestion.value.answer
  const currentState = questionStates.value[currentIndex.value] || 'unanswered'

  if (correct) {
    isLastCorrect.value = true
    score.value += 10
    // 连击
    combo.value++
    if (combo.value >= 3) score.value += 5
    // 只有首次答对才计分，且仅对原始题目计数（重做的不重复计）
    if (currentState === 'unanswered' && currentIndex.value < originalCount.value) {
      correctCount.value++
      questionStates.value[currentIndex.value] = 'correct'
    }
    // 标记 learned
    store.markLearned(currentQuestion.value.entryId)
    // 自动下一题
    setTimeout(() => nextQuestion(), 800)
  } else {
    isLastCorrect.value = false
    combo.value = 0
    // 只有首次答错才计 wrong，且仅对原始题目计数
    if (currentState === 'unanswered' && currentIndex.value < originalCount.value) {
      totalWrongCount.value++
      questionStates.value[currentIndex.value] = 'wrong'
    }
    // 记录错误单词的 retry 次数（每次重试都计数）
    const word = currentQuestion.value.word
    wrongWordRetries.value[word] = (wrongWordRetries.value[word] || 0) + 1
    // 弹出错误卡片
    showErrorCard.value = true
  }

  maxCombo.value = Math.max(maxCombo.value, combo.value)
}

function retryQuestion() {
  showErrorCard.value = false
  // 把当前错题复制一份加到队列末尾，让用户之后再答一次
  questions.value.push({ ...currentQuestion.value })
  questionStates.value.push('unanswered')
  // 原地重试当前题
  answered.value = false
  selectedIndex.value = -1
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    answered.value = false
    selectedIndex.value = -1
    isLastCorrect.value = false
    showErrorCard.value = false
  } else {
    finishPractice()
  }
}

function finishPractice() {
  finished.value = true
  clearInterval(timerInterval)

  // 记录练习历史
  store.recordPractice(id.value, {
    total: originalCount.value,
    correct: correctCount.value,
    wrong: totalWrongCount.value,
    retries: { ...wrongWordRetries.value },
    duration: timerElapsed.value
  })
}

function confirmLeave() {
  if (!finished.value && correctCount.value > 0) {
    showDialog({
      title: '确定退出？',
      message: '本次练习进度将丢失。',
      confirmButtonText: '退出',
      cancelButtonText: '继续练习'
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

// 首题自动播放
watch(currentIndex, () => {
  if (!finished.value && currentQuestion.value && !answered.value) {
    setTimeout(() => speak(currentQuestion.value.word), 300)
  }
})

onMounted(() => {
  startPractice()
})

// 清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<style scoped>
.wb-practice-page {
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

.stat-card.danger {
  background: #FEF2F2;
}

[data-theme="dark"] .stat-card.danger {
  background: #3B1212;
}

.stat-card-num {
  font-size: 24px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1.1;
}

.stat-card-num.c-green { color: #10B981; }

.stat-card.danger .stat-card-num {
  color: var(--danger);
}

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

.stat-card.combo-warm {
  background: #FFF7ED;
  border: 1px solid #FDBA74;
}

[data-theme="dark"] .stat-card.combo-warm {
  background: #3B1F0A;
  border-color: #F59E0B;
}

.stat-card.combo-hot {
  background: #FFFBEB;
  border: 2px solid #F59E0B;
  animation: comboPulse 1.5s ease-in-out infinite;
  will-change: transform;
}

[data-theme="dark"] .stat-card.combo-hot {
  background: #3B2E00;
  border-color: #F59E0B;
}

.stat-card.combo-fire {
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  border: 2px solid #F59E0B;
  animation: comboPulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
  will-change: transform;
}

[data-theme="dark"] .stat-card.combo-fire {
  background: linear-gradient(135deg, #4A2E00, #78350F);
  border-color: #F59E0B;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.5);
}

@keyframes comboPulse {
  0%, 100% { transform: translateZ(0) scale(1); }
  50% { transform: translateZ(0) scale(1.05); }
}

.day-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  margin: 0 auto 14px;
}

.day-progress .progress-track {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: var(--border);
  overflow: hidden;
}

.day-progress .progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--accent), #EC4899);
  transition: width 0.3s ease;
}

.day-progress .progress-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 44px;
}

.question-box {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  max-width: 440px;
  margin: 0 auto;
}

.question-word-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.question-word {
  font-size: 28px;
  font-weight: 700;
}

.speak-btn {
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  background: var(--accent-light);
  transition: transform 0.15s;
  user-select: none;
  line-height: 1;
}

.speak-btn:active { transform: scale(0.85); }

.question-prompt {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 20px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid var(--border);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
}

.option:active { transform: scale(0.98); }

.option.selected {
  border-color: var(--accent);
  background: var(--accent-light);
}

.option.correct {
  border-color: var(--success);
  background: #ECFDF5;
  color: var(--success);
  font-weight: 600;
}

[data-theme="dark"] .option.correct { background: #064E3B; }

.option.wrong {
  border-color: var(--danger);
  background: #FEF2F2;
  color: var(--danger);
}

[data-theme="dark"] .option.wrong { background: #7F1D1D; }

.option-letter {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--accent-light);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.option-text { flex: 1; }

.feedback {
  margin-top: 14px;
  text-align: center;
}

.correct-feedback .feedback-text {
  color: var(--success);
  font-size: 16px;
  font-weight: 600;
}

/* 错误卡片 */
.error-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 36px 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  text-align: center;
  max-width: 360px;
  margin: 40px auto;
}

.error-word-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.error-word {
  font-size: 36px;
  font-weight: 800;
  color: var(--danger);
}

.error-phonetic {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.error-meaning {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 24px;
}

.continue-btn {
  width: 160px !important;
}

/* 完成页 */
.complete-box {
  margin-top: 20px;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
}

.result-card {
  text-align: center;
  background: var(--bg-card);
  border-radius: 16px;
  padding: 30px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  margin-bottom: 16px;
}

.result-card .emoji { font-size: 56px; display: block; margin-bottom: 12px; }
.result-card h3 { font-size: 22px; margin-bottom: 12px; }
.result-detail { font-size: 14px; color: var(--text-secondary); margin-bottom: 4px; }

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-home, .btn-retry {
  width: 120px !important;
  height: 42px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  border-radius: 20px !important;
  color: #fff !important;
  border: none !important;
}

.btn-home { background: #6B7280 !important; }
.btn-retry { background: #F59E0B !important; }
</style>
