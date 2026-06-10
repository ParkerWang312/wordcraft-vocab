<template>
  <div class="page learn-page">
    <!-- 顶部导航 -->
    <van-nav-bar
      :title="'Day ' + dayNum + ' / 28'"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <span class="nav-timer">{{ displayTime }}</span>
        <div class="nav-practice-btn" v-if="allDone || dayCompleted" @click="goPractice">
          <van-icon name="play-circle-o" size="20" />
          <span>练习</span>
        </div>
      </template>
    </van-nav-bar>

    <div class="day-header">
      <div class="category-badge" v-if="currentCategory">{{ currentCategory }}</div>
      <div class="day-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ words.length }}</span>
      </div>
    </div>

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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLearningStore, generateWordId } from '../stores/learning.js'
import { useSettingsStore } from '../stores/settings.js'
import WordCard from '../components/WordCard.vue'
import { showToast } from 'vant'
import { useTimer, formatTime } from '../composables/useTimer.js'
import { speak } from '../utils/speech.js'

const props = defineProps({ day: { type: [String, Number], required: true } })
const router = useRouter()
const route = useRoute()
const store = useLearningStore()
const settings = useSettingsStore()

const { elapsed } = useTimer()
const displayTime = computed(() => formatTime(elapsed.value))

const dayNum = computed(() => Number(props.day))
const isCompleted = computed(() => store.state.completedDays.includes(dayNum.value))

// 如果未完成的新天有待复习任务，强制跳转到复习页
onMounted(() => {
  if (!isCompleted.value && store.dueReviewCount > 0) {
    router.replace({ path: '/review', query: { redirectTo: route.fullPath } })
    return
  }
  // 强制练习模式：已学完但未练习，直接跳到练习
  if (settings.data.forcePractice && store.getDayNeedsPractice(dayNum.value)) {
    router.replace(`/practice/${dayNum.value}?via=force`)
    return
  }
})

const dayTitle = computed(() => store.getDayTitle(dayNum.value))
const words = computed(() => store.getDayWords(dayNum.value))

const currentCategory = computed(() => {
  return currentWord.value?.category || ''
})

const progressPercent = computed(() => {
  if (words.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / words.value.length) * 100)
})

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
    // 下一个单词发音（同步调用，Android 需求）
    if (currentWord.value) speak(currentWord.value.word)
  } else {
    allDone.value = true
    // 强制练习模式：不标记完成，直接跳转到练习
    if (settings.data.forcePractice) {
      store.setDayNeedsPractice(dayNum.value, true)
      router.replace(`/practice/${dayNum.value}?via=force`)
    } else {
      store.completeDay(dayNum.value)
      // 非强制练习模式：当天完成，清零进度
      // 强制练习模式：保留进度对象，避免清空练习进度
      if (!settings.data.forcePractice) {
        store.saveDayProgress(dayNum.value, 0)
      }
    }
  }
}

function toggleStar() {
  if (!currentWord.value) return
  const id = generateWordId(currentWord.value)
  store.toggleWordBook(id)
}

function goPractice() {
  const query = settings.data.forcePractice ? '?via=force' : ''
  router.push(`/practice/${dayNum.value}${query}`)
}

const dayCompleted = computed(() => store.state.completedDays.includes(dayNum.value))
</script>

<style scoped>
.learn-page {
  padding-bottom: 80px;
}

.nav-timer {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 8px;
  font-variant-numeric: tabular-nums;
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

.day-header {
  text-align: center;
  padding: 12px 16px 8px;
}

.category-badge {
  display: inline-block;
  padding: 5px 18px;
  border-radius: 20px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 14px;
}

.day-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  margin: 0 auto;
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
  text-align: right;
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
