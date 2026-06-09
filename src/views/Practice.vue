<template>
  <div class="page practice-page">
    <van-nav-bar
      title="练习模式"
      left-arrow
      @click-left="$router.back()"
      :fixed="false"
    >
      <template #right>
        <span class="nav-timer">{{ displayTime }}</span>
      </template>
    </van-nav-bar>

    <template v-if="!finished">
      <!-- 统计卡片 -->
      <div class="review-stats">
        <div class="stat-card">
          <span class="stat-card-num">{{ score }}</span>
          <span class="stat-card-label">得分</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-num" style="color: #10B981">{{ correctCount }}</span>
          <span class="stat-card-label">正确</span>
        </div>
        <div class="stat-card danger">
          <span class="stat-card-num">{{ wrongCount }}</span>
          <span class="stat-card-label">错误</span>
        </div>
        <div class="stat-card" :class="comboCardClass">
          <span class="stat-card-num" :class="{ 'combo-pop': comboAnimating }" :style="comboStyle">{{ combo }}</span>
          <span class="stat-card-label">连击</span>
        </div>
      </div>

      <div class="day-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: practicePercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
      </div>

      <!-- 题目 -->
      <div class="question-box" v-if="currentQuestion">
      <!-- 听音题问题区域 -->
      <template v-if="currentQuestion.type === 'audio'">
        <div class="audio-question">
          <span class="audio-icon" @click="playQuestionAudio">🔊</span>
          <div class="question-prompt">{{ currentQuestion.prompt }}</div>
        </div>
      </template>
      <!-- 文字题问题区域 -->
      <template v-else>
        <div class="question-word-row">
          <div class="question-word">{{ currentQuestion.question }}</div>
          <span v-if="currentQuestion.type === 'e2c'" class="speak-btn" @click="playQuestionAudio">🔊</span>
        </div>
        <div class="question-prompt">{{ currentQuestion.prompt }}</div>
      </template>

      <div class="options">
        <div
          v-for="(opt, idx) in currentQuestion.options"
          :key="idx"
          :class="['option', {
            selected: selectedIndex === idx,
            correct: answered && selectedIndex === idx && idx === currentQuestion.answer,
            wrong: answered && selectedIndex === idx && idx !== currentQuestion.answer
          }]"
          @click="selectOption(idx)"
        >
          <span class="option-letter">{{ letters[idx] }}</span>
          <span class="option-text">{{ opt }}</span>
          <span class="option-icon" v-if="answered && idx === currentQuestion.answer">✓</span>
          <span class="option-meaning" v-if="answered && idx === currentQuestion.answer && currentQuestion.type !== 'e2c' && currentQuestion.answerMeaning">
            {{ currentQuestion.answerMeaning }}
          </span>
        </div>
      </div>

      <div class="feedback" v-if="answered && !(isLastCorrect && settingsStore.data.autoAdvance)">
        <div :class="['feedback-msg', isLastCorrect ? 'correct' : 'wrong']">
          <template v-if="isLastCorrect">✅ 正确！</template>
          <template v-else>❌ 正确答案：{{ getAnswerText() }}</template>
        </div>
        <van-button class="next-btn" round @click="nextQuestion">
          {{ isLastQuestion ? '查看结果' : '下一题 ▶' }}
        </van-button>
      </div>
    </div>
    </template>

    <!-- 完成 -->
    <div class="complete-box" v-if="finished">
      <div class="result-card">
        <span class="emoji">{{ passed ? '🎉' : '😅' }}</span>
        <h3 v-if="isForcePractice">Day {{ dayNum }} 学习完成！</h3>
        <h3 v-else>{{ passed ? '恭喜通过！' : '还需努力' }}</h3>
        <p class="result-detail">正确率: {{ accuracy }}%</p>
        <p class="result-detail">得分: {{ score }}</p>
        <p class="result-detail">最大连击: {{ maxCombo }}</p>
        <p class="result-detail" v-if="stats">📊 英选中 {{ stats.e2c }} 题 · 中选英 {{ stats.c2e }} 题 · 听音 {{ stats.audio }} 题</p>
        <p class="result-hint" v-if="!passed">正确率不足80%，建议重新学习本日单词</p>
      </div>

      <div class="result-actions">
        <van-button class="btn-home" round @click="$router.push('/')">
          返回首页
        </van-button>
        <van-button v-if="!passed" class="btn-retry" round @click="$router.push(`/learn/${dayNum}`)">
          重新学习
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLearningStore, generateWordId } from '../stores/learning.js'
import { useSettingsStore } from '../stores/settings.js'

import { useTimer, formatTime } from '../composables/useTimer.js'

const props = defineProps({ day: { type: [String, Number], required: true } })
const router = useRouter()
const store = useLearningStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const dayNum = computed(() => Number(props.day))
const isForcePractice = computed(() => route.query.via === 'force')

const { elapsed } = useTimer()
const displayTime = computed(() => formatTime(elapsed.value))

const practicePercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
})

const letters = ['A', 'B', 'C', 'D']
const currentIndex = ref(0)
const score = ref(0)
const correctCount = ref(0)
const wrongCount = ref(0)
const combo = ref(0)
const comboAnimating = ref(false)

// 连击动画：combo 变化时触发弹跳效果
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
const maxCombo = ref(0)
const answered = ref(false)
const selectedIndex = ref(-1)
const isLastCorrect = ref(false)
const finished = ref(false)
const questions = ref([])
const stats = ref(null)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function speakWord(word) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}

function generateQuestions() {
  const dayWords = store.getDayWords(dayNum.value)
  const allWords = store.allWords
  const total = dayWords.length
  const e2cCount = Math.round(total * 0.4)
  const c2eCount = Math.round(total * 0.4)
  const audioCount = total - e2cCount - c2eCount

  const result = []
  let e2c = 0, c2e = 0, audio = 0

  shuffle(dayWords).forEach(w => {
    const others = allWords
      .filter(ow => ow.word !== w.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    let qType
    if (e2c < e2cCount) {
      qType = 'e2c'
      e2c++
    } else if (c2e < c2eCount) {
      qType = 'c2e'
      c2e++
    } else {
      qType = 'audio'
      audio++
    }

    if (qType === 'e2c') {
      const options = shuffle([w.meaning, ...others.map(o => o.meaning)])
      result.push({
        type: 'e2c',
        question: w.word,
        prompt: '请选择正确的中文释义',
        options,
        answer: options.indexOf(w.meaning),
        audioWord: w.word,
        answerMeaning: w.meaning
      })
    } else if (qType === 'c2e') {
      const wordOptions = shuffle([w.word, ...others.map(o => o.word)])
      result.push({
        type: 'c2e',
        question: w.meaning,
        prompt: '请选择对应的英文单词',
        options: wordOptions,
        answer: wordOptions.indexOf(w.word),
        audioWord: w.word,
        answerMeaning: w.meaning
      })
    } else {
      const wordOptions = shuffle([w.word, ...others.map(o => o.word)])
      result.push({
        type: 'audio',
        question: '',
        prompt: '请根据发音选择正确的单词',
        options: wordOptions,
        answer: wordOptions.indexOf(w.word),
        audioWord: w.word,
        answerMeaning: w.meaning
      })
    }
  })

  stats.value = { e2c, c2e, audio }
  return shuffle(result)
}

// 从最小种子数据重建题目（用于恢复练习进度，大幅减小导出文件）
function restoreQuestions(seeds) {
  const dayWords = store.getDayWords(dayNum.value)
  const allWords = store.allWords
  const result = []
  let e2c = 0, c2e = 0, audio = 0

  seeds.forEach(seed => {
    const w = dayWords.find(dw => dw.word === seed.audioWord)
    if (!w) return
    const qType = seed.type
    if (qType === 'e2c') e2c++
    else if (qType === 'c2e') c2e++
    else audio++

    const others = allWords
      .filter(ow => ow.word !== w.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    if (qType === 'e2c') {
      const options = shuffle([w.meaning, ...others.map(o => o.meaning)])
      result.push({ type: 'e2c', question: w.word, prompt: '请选择正确的中文释义', options, answer: options.indexOf(w.meaning), audioWord: w.word, answerMeaning: w.meaning })
    } else if (qType === 'c2e') {
      const wordOptions = shuffle([w.word, ...others.map(o => o.word)])
      result.push({ type: 'c2e', question: w.meaning, prompt: '请选择对应的英文单词', options: wordOptions, answer: wordOptions.indexOf(w.word), audioWord: w.word, answerMeaning: w.meaning })
    } else {
      const wordOptions = shuffle([w.word, ...others.map(o => o.word)])
      result.push({ type: 'audio', question: '', prompt: '请根据发音选择正确的单词', options: wordOptions, answer: wordOptions.indexOf(w.word), audioWord: w.word, answerMeaning: w.meaning })
    }
  })
  stats.value = { e2c, c2e, audio }
  return result
}

onMounted(() => {
  // 未完成的新天有待复习时，强制跳转到复习页
  const isCompleted = store.state.completedDays.includes(dayNum.value)
  if (!isCompleted && store.dueReviewCount > 0) {
    router.replace({ path: '/review', query: { redirectTo: route.fullPath } })
    return
  }
  // 优先恢复保存的题目（所有模式都支持进度恢复），否则首次生成
  const saved = store.state.dayProgress[dayNum.value]
  if (saved && saved.savedSeeds && saved.savedSeeds.length > 0) {
    questions.value = restoreQuestions(saved.savedSeeds)
    const practiceIdx = saved.practiceIndex || 0
    currentIndex.value = Math.min(practiceIdx, questions.value.length - 1)
    if (saved.practiceStats) {
      score.value = saved.practiceStats.score || 0
      correctCount.value = saved.practiceStats.correct || 0
      wrongCount.value = saved.practiceStats.wrong || 0
      combo.value = saved.practiceStats.combo || 0
      maxCombo.value = saved.practiceStats.maxCombo || 0
    }
  } else {
    questions.value = generateQuestions()
  }
  // 清除上一页残留的语音
  if ('speechSynthesis' in window) speechSynthesis.cancel()
  // 生成题目后触发首题发音
  autoPlayIfAudio()
})

// 切换题目时自动播放
watch(currentIndex, () => {
  autoPlayIfAudio()
})

function autoPlayIfAudio() {
  const q = questions.value[currentIndex.value]
  if (q && (q.type === 'audio' || q.type === 'e2c') && !answered.value) {
    setTimeout(() => speakWord(q.audioWord), 400)
  }
}

function playQuestionAudio() {
  if (currentQuestion.value) {
    speakWord(currentQuestion.value.audioWord)
  }
}

const currentQuestion = computed(() => questions.value[currentIndex.value])

const accuracy = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((correctCount.value / questions.value.length) * 100)
})

const passed = computed(() => accuracy.value >= 80)

function selectOption(idx) {
  if (answered.value) return
  selectedIndex.value = idx
  answered.value = true
  const correct = idx === currentQuestion.value.answer
  isLastCorrect.value = correct

  if (correct) {
    score.value += 10
    correctCount.value++
    combo.value++
    if (combo.value >= 3) score.value += 5
  } else {
    wrongCount.value++
    combo.value = 0
    // 答错：记入错题本
    const q = currentQuestion.value
    if (q && q.audioWord) {
      const wrongWord = store.allWords.find(w => w.word === q.audioWord && w.day === dayNum.value)
      if (wrongWord) {
        store.addWrongWord(generateWordId(wrongWord))
      }
    }
  }

  maxCombo.value = Math.max(maxCombo.value, combo.value)

  // 选择答案后保存练习进度（所有模式都保存）
  savePracticeProgress()

  // 答对且开启自动跳转
  if (correct && settingsStore.data.autoAdvance) {
    setTimeout(() => nextQuestion(), 600)
  }
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    answered.value = false
    selectedIndex.value = -1
  } else {
    finished.value = true
    // 强制练习模式：完成练习 = 当天完成
    if (isForcePractice.value) {
      store.completeDay(dayNum.value)
      store.setDayNeedsPractice(dayNum.value, false)
    }
    // 所有模式：练习完成后清零练习进度，保留 wordIndex（学习进度）
    const existing = store.state.dayProgress[dayNum.value]
    const wordIndex = typeof existing === 'object' ? (existing.wordIndex || 0) : (existing || 0)
    store.state.dayProgress[dayNum.value] = { wordIndex, practiceIndex: 0, savedSeeds: null, practiceStats: null }
    store.persist()
  }
}

function savePracticeProgress() {
  const existing = store.state.dayProgress[dayNum.value]
  // 只保存题目种子（audioWord + type），大幅减小数据量
  const seeds = questions.value.map(q => ({ audioWord: q.audioWord, type: q.type }))
  store.state.dayProgress[dayNum.value] = {
    ...(typeof existing === 'object' ? existing : { wordIndex: existing || 0 }),
    practiceIndex: currentIndex.value + 1,
    savedSeeds: seeds,
    practiceStats: {
      score: score.value,
      correct: correctCount.value,
      wrong: wrongCount.value,
      combo: combo.value,
      maxCombo: maxCombo.value
    }
  }
  store.persist()
}

const isLastQuestion = computed(() => currentIndex.value === questions.value.length - 1)

function getAnswerText() {
  if (!currentQuestion.value) return ''
  return currentQuestion.value.options[currentQuestion.value.answer]
}
</script>

<style scoped>
.practice-page {
  padding: 14px 16px 80px;
}

/* NavBar 与下方内容间距 */
.practice-page :deep(.van-nav-bar) {
  margin-bottom: 8px;
}

.nav-timer {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.day-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  margin: 16px auto 14px;
}

.progress-track {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: var(--border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--accent), #EC4899);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 44px;
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
}

@keyframes comboBounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.4); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
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
}

[data-theme="dark"] .stat-card.combo-fire {
  background: linear-gradient(135deg, #4A2E00, #78350F);
  border-color: #F59E0B;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.5);
}

@keyframes comboPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
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
  text-align: center;
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

.speak-btn:active {
  transform: scale(0.85);
}

.question-prompt {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 20px;
}

.audio-question {
  text-align: center;
  margin-bottom: 20px;
}

.audio-icon {
  font-size: 24px;
  cursor: pointer;
  display: inline-block;
  padding: 8px;
  border-radius: 50%;
  background: var(--accent-light);
  transition: transform 0.2s;
  user-select: none;
}

.audio-icon:active {
  transform: scale(0.9);
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

.option:active {
  transform: scale(0.98);
}

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

[data-theme="dark"] .option.correct {
  background: #064E3B;
}

.option.wrong {
  border-color: var(--danger);
  background: #FEF2F2;
  color: var(--danger);
}

[data-theme="dark"] .option.wrong {
  background: #7F1D1D;
}

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

.option-text {
  flex: 1;
}

.option-icon {
  color: var(--success);
  font-size: 18px;
}

.option-meaning {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 2px;
}

.feedback {
  margin-top: 16px;
  text-align: center;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
}

.feedback-msg {
  padding: 10px;
  border-radius: 10px;
  font-weight: 600;
  margin-bottom: 12px;
}

.feedback-msg.correct {
  background: var(--accent-light);
  color: var(--accent);
}

.feedback-msg.wrong {
  color: var(--danger);
}

.next-btn {
  width: 140px !important;
  height: 42px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  border-radius: 20px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 8px auto 0 !important;
  background: #10B981 !important;
  color: #fff !important;
  border: none !important;
}

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

.result-card .emoji {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
}

.result-card h3 {
  font-size: 22px;
  margin-bottom: 12px;
}

.result-detail {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.result-hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--warning);
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-home, .btn-retry {
  width: 120px !important;
  height: 42px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  border-radius: 20px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #fff !important;
  border: none !important;
}

.btn-home {
  background: #6B7280 !important;
}

.btn-retry {
  background: #F59E0B !important;
}
</style>
