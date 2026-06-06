<template>
  <div class="page learn-page">
    <!-- 顶部导航 -->
    <van-nav-bar
      :title="'Day ' + dayNum + ' / 28'"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <div class="nav-practice-btn" v-if="allDone || dayCompleted" @click="goPractice">
          <van-icon name="play-circle-o" size="20" />
          <span>练习</span>
        </div>
      </template>
    </van-nav-bar>

    <div class="day-title">{{ dayTitle }}</div>

    <ProgressBar :current="currentIndex + 1" :total="words.length" label="学习进度" />

    <!-- 单词卡片 -->
    <WordCard
      v-if="currentWord && !allDone"
      :word="currentWord"
      :is-starred="isCurrentStarred"
      :show-known="true"
      @known="swipeWord(true)"
      @unknown="swipeWord(false)"
      @star="toggleStar"
    />

    <!-- 下一步提示 -->
    <div class="next-hint" v-if="allDone">
      <div class="complete-msg">
        <span class="emoji">🎉</span>
        <h3>Day {{ dayNum }} 学习完成！</h3>
        <p>已标记 {{ knownCount }} / {{ words.length }} 个单词为认识</p>
      </div>

      <div class="done-actions">
        <van-button class="btn-practice" type="success" round @click="goPractice">
          开始练习
        </van-button>
        <van-button class="btn-home" type="default" round @click="$router.push('/')">
          返回首页
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore, generateWordId } from '../stores/learning.js'
import WordCard from '../components/WordCard.vue'
import ProgressBar from '../components/ProgressBar.vue'
import { showToast } from 'vant'

const props = defineProps({ day: { type: [String, Number], required: true } })
const router = useRouter()
const store = useLearningStore()

const dayNum = computed(() => Number(props.day))
const dayTitle = computed(() => store.getDayTitle(dayNum.value))
const words = computed(() => store.getDayWords(dayNum.value))

// 从上次进度恢复
const savedIndex = store.getDayProgress(dayNum.value)
const currentIndex = ref(Math.min(savedIndex, Math.max(0, words.value.length - 1)))
const allDone = ref(false)
const knownCount = ref(0)

const currentWord = computed(() => words.value[currentIndex.value] || null)

const isCurrentStarred = computed(() => {
  if (!currentWord.value) return false
  const id = generateWordId(currentWord.value)
  return store.state.wordStates[id]?.inWordBook || false
})

function swipeWord(known) {
  if (!currentWord.value) return
  const id = generateWordId(currentWord.value)
  store.markWord(id, known)

  if (known) {
    knownCount.value++
  }

  // 保存进度到下一个单词
  const nextIndex = currentIndex.value + 1
  store.saveDayProgress(dayNum.value, nextIndex)

  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
  } else {
    allDone.value = true
    store.completeDay(dayNum.value)
    // 完成后清除该天进度
    store.saveDayProgress(dayNum.value, 0)
  }
}

function toggleStar() {
  if (!currentWord.value) return
  const id = generateWordId(currentWord.value)
  store.toggleWordBook(id)
}

function goPractice() {
  router.push(`/practice/${dayNum.value}`)
}

// 自动播放发音
watch(currentWord, (word) => {
  if (word && 'speechSynthesis' in window) {
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }, 300)
  }
})

const dayCompleted = computed(() => store.state.completedDays.includes(dayNum.value))
</script>

<style scoped>
.learn-page {
  padding-bottom: 80px;
}

.nav-practice-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  user-select: none;
}

.nav-practice-btn:active {
  opacity: 0.7;
}

.day-title {
  text-align: center;
  font-size: 16px;
  color: var(--text-secondary);
  margin: 12px 0 16px;
}

.complete-msg {
  text-align: center;
  padding: 30px 0;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  margin-bottom: 16px;
}

.complete-msg .emoji {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.complete-msg h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.complete-msg p {
  font-size: 14px;
  color: var(--text-secondary);
}

.done-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-practice, .btn-home {
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
  background: #10B981 !important;
}

.btn-home {
  background: #6B7280 !important;
}
</style>
