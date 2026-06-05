<template>
  <div class="page practice-page">
    <van-nav-bar
      title="练习模式"
      left-arrow
      @click-left="$router.back()"
      :fixed="false"
    />

    <ProgressBar :current="currentIndex + 1" :total="questions.length" label="练习进度" />

    <!-- 分数 -->
    <div class="score-bar">
      <span class="score">得分: {{ score }}</span>
      <span class="combo" v-if="combo > 1">{{ combo }}连击!</span>
    </div>

    <!-- 题目 -->
    <div class="question-box" v-if="currentQuestion">
      <div class="question-word">{{ currentQuestion.question }}</div>
      <div class="question-prompt">{{ currentQuestion.prompt }}</div>

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
        </div>
      </div>

      <div class="feedback" v-if="answered">
        <div :class="['feedback-msg', isLastCorrect ? 'correct' : 'wrong']">
          {{ isLastCorrect ? '✅ 正确！' : '❌ 正确答案：' + getAnswerText() }}
        </div>
      </div>
    </div>

    <!-- 完成 -->
    <div class="complete-box" v-if="finished">
      <div class="result-card">
        <span class="emoji">{{ passed ? '🎉' : '😅' }}</span>
        <h3>{{ passed ? '恭喜通过！' : '还需努力' }}</h3>
        <p class="result-detail">正确率: {{ accuracy }}%</p>
        <p class="result-detail">得分: {{ score }}</p>
        <p class="result-detail">最大连击: {{ maxCombo }}</p>
        <p class="result-hint" v-if="!passed">正确率不足80%，建议重新学习本日单词</p>
      </div>

      <van-button type="primary" block round size="large" @click="$router.push('/')">
        返回首页
      </van-button>
      <van-button
        v-if="!passed"
        style="margin-top:10px"
        type="default"
        block
        round
        size="large"
        @click="$router.push(`/learn/${dayNum}`)"
      >
        重新学习
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore, generateWordId } from '../stores/learning.js'
import ProgressBar from '../components/ProgressBar.vue'

const props = defineProps({ day: { type: [String, Number], required: true } })
const router = useRouter()
const store = useLearningStore()
const dayNum = computed(() => Number(props.day))

const letters = ['A', 'B', 'C', 'D']
const currentIndex = ref(0)
const score = ref(0)
const combo = ref(0)
const maxCombo = ref(0)
const answered = ref(false)
const selectedIndex = ref(-1)
const isLastCorrect = ref(false)
const finished = ref(false)

let questions = ref([])

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateQuestions() {
  const dayWords = store.getDayWords(dayNum.value)
  const allWords = store.allWords

  return dayWords.map(w => {
    const isEnToCn = Math.random() > 0.5
    // 选3个干扰项
    const others = allWords
      .filter(ow => ow.word !== w.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    if (isEnToCn) {
      const options = shuffle([w.meaning, ...others.map(o => o.meaning)])
      const answer = options.indexOf(w.meaning)
      return {
        question: w.word,
        prompt: '请选择正确的中文释义',
        options,
        answer
      }
    } else {
      const options = shuffle([w.meaning, ...others.map(o => o.meaning)])
      const answer = options.indexOf(w.meaning)
      return {
        question: w.meaning,
        prompt: '请选择对应的英文单词',
        options: shuffle([w.word, ...others.map(o => o.word)]),
        answer: shuffle([w.word, ...others.map(o => o.word)]).indexOf(w.word)
      }
    }
  })
}

onMounted(() => {
  questions.value = generateQuestions()
})

const currentQuestion = computed(() => questions.value[currentIndex.value])

const accuracy = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((score.value / (questions.value.length * 10)) * 100)
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
    combo.value++
    if (combo.value >= 3) score.value += 5 // 连击奖励
  } else {
    combo.value = 0
  }

  maxCombo.value = Math.max(maxCombo.value, combo.value)

  setTimeout(() => {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
      answered.value = false
      selectedIndex.value = -1
    } else {
      finished.value = true
    }
  }, 1200)
}

function getAnswerText() {
  if (!currentQuestion.value) return ''
  return currentQuestion.value.options[currentQuestion.value.answer]
}
</script>

<style scoped>
.practice-page {
  padding-bottom: 80px;
}

.score-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.score {
  font-weight: 700;
  font-size: 16px;
  color: var(--accent);
}

.combo {
  color: var(--warning);
  font-weight: 600;
  font-size: 14px;
  animation: pulse 0.4s ease;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.question-box {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.question-word {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
}

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

.feedback {
  margin-top: 16px;
  text-align: center;
}

.feedback-msg {
  padding: 10px;
  border-radius: 10px;
  font-weight: 600;
}

.feedback-msg.correct {
  background: var(--accent-light);
  color: var(--accent);
}

.feedback-msg.wrong {
  color: var(--danger);
}

.complete-box {
  margin-top: 20px;
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
</style>
