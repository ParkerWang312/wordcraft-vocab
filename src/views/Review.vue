<template>
  <div class="page review-page">
    <van-nav-bar :title="isWrongReview ? '错题复习' : isWordbookReview ? '生词本复习' : '复习模式'" left-arrow @click-left="goHome" :fixed="false">
      <template #right>
        <span class="nav-timer">{{ displayTime }}</span>
      </template>
    </van-nav-bar>

    <div class="review-header">
      <div class="review-stats" v-if="isWrongReview">
        <div class="stat-card danger">
          <span class="stat-card-num">{{ reviewList.length - wrongCleared }}</span>
          <span class="stat-card-label">🚩 错题</span>
        </div>
      </div>
      <div class="review-stats" v-else-if="!isWordbookReview">
        <div class="stat-card">
          <span class="stat-card-num">{{ store.dueReviewCount }}</span>
          <span class="stat-card-label">待复习</span>
        </div>
        <div class="stat-card danger" v-if="store.wrongCount > 0">
          <span class="stat-card-num">{{ store.wrongCount }}</span>
          <span class="stat-card-label">🚩 错题</span>
        </div>
      </div>
      <div class="review-stats" v-else>
        <div class="stat-card">
          <span class="stat-card-num">{{ reviewList.length }}</span>
          <span class="stat-card-label">生词本复习</span>
        </div>
        <div class="stat-card danger" v-if="wordbookWrongCount > 0">
          <span class="stat-card-num">{{ wordbookWrongCount - bookWrongCleared }}</span>
          <span class="stat-card-label">🚩 错题</span>
        </div>
      </div>
      <div class="day-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: reviewPercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ reviewedCount }} / {{ reviewList.length }}</span>
      </div>
    </div>

    <!-- 无待复习 -->
    <div class="empty-state" v-if="reviewList.length === 0">
      <span class="empty-emoji">🎉</span>
      <h3 v-if="isWordbookReview">生词本还是空的</h3>
      <h3 v-else>暂无待复习单词</h3>
      <p v-if="isWordbookReview">学习时点击 ⭐ 收藏单词吧</p>
      <p v-else>继续学习新单词吧！</p>
      <van-button type="primary" round size="large" @click="goBack">
        {{ isWordbookReview ? '回生词本' : '去学习' }}
      </van-button>
    </div>

    <!-- 复习卡片 -->
    <div class="review-card-wrapper" v-if="currentReviewWord">
      <div class="word-info">
        <span class="day-badge">Day {{ currentReviewWord.day }}</span>
        <span class="wordbook-tag" v-if="currentReviewWord.isWordbook">📖 生词本</span>
        <span class="wrong-tag" v-if="currentReviewWord.isWrong">🚩 错题</span>
        <span class="review-count">第 {{ (currentReviewWord.state?.reviewCount || 0) + 1 }} 次复习</span>
      </div>

      <WordCard
        :word="currentReviewWord"
        :show-known="false"
        :show-star="true"
        :is-starred="currentReviewWord.state?.inWordBook"
        :is-wrong="currentReviewWord.isWrong"
        @star="toggleStar"
        @flip="onCardFlip"
      />

      <div class="review-actions" v-if="cardFlipped">
        <van-button round size="large" type="danger" @click="rateQuality(0)">
          😵 忘记
        </van-button>
        <van-button round size="large" type="warning" @click="rateQuality(1)">
          😐 模糊
        </van-button>
        <van-button round size="large" type="primary" @click="rateQuality(2)">
          😊 记得
        </van-button>
      </div>
    </div>

    <!-- 完成 -->
    <div class="complete-box" v-if="finished">
      <div class="result-card">
        <span class="emoji">🎉</span>
        <h3>复习完成！</h3>
        <p>今天复习了 {{ reviewedCount }} 个单词</p>
      </div>
      <van-button type="primary" block round size="large" @click="goBack">
        {{ isWordbookReview ? '回生词本' : (redirectTo ? '开始学习' : '返回首页') }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLearningStore, generateWordId } from '../stores/learning.js'
import WordCard from '../components/WordCard.vue'
import { useTimer, formatTime } from '../composables/useTimer.js'
import { speak } from '../utils/speech.js'

const router = useRouter()
const route = useRoute()
const store = useLearningStore()

const { elapsed } = useTimer()
const displayTime = computed(() => formatTime(elapsed.value))

const redirectTo = computed(() => route.query.redirectTo || '')
const isWordbookReview = computed(() => route.query.source === 'wordbook')
const isWrongReview = computed(() => route.query.source === 'wrongwords')

const wordbookWrongCount = computed(() => {
  return reviewList.value.filter(w => w.isWrong).length
})

// 合并复习列表：错题优先，然后普通待复习
const reviewWords = computed(() => {
  // 错题本复习
  if (isWrongReview.value) {
    return store.wrongWordsList.map(w => {
      const wid = generateWordId(w)
      return { ...w, wordId: wid, state: store.state.wordStates[wid] || {}, isWrong: true }
    })
  }

  // 生词本一键复习：遍历所有生词
  if (isWordbookReview.value) {
    return store.wordBookWords.map(w => {
      const wid = generateWordId(w)
      store.initWordState(wid)
      const isWrong = store.wrongWordsList.some(ww => generateWordId(ww) === wid)
      return { ...w, wordId: wid, state: store.state.wordStates[wid] || {}, isWrong, isWordbook: true }
    })
  }

  const wrongWords = store.wrongWordsList
    .filter(ww => {
      const wid = generateWordId(ww)
      const inDue = store.dueReviewWords.find(d => d.wordId === wid)
      return !inDue
    })
    .map(ww => {
      const wid = generateWordId(ww)
      return { ...ww, wordId: wid, state: store.state.wordStates[wid] || {}, isWrong: true }
    })

  const due = store.dueReviewWords.map(w => {
    const wid = generateWordId(w)
    const isWrong = store.wrongWordsList.some(ww => generateWordId(ww) === wid)
    return { ...w, isWrong }
  })

  return [...wrongWords, ...due]
})

const reviewedCount = ref(0)
const currentWordIndex = ref(0)
const reviewList = ref([])
const wrongCleared = ref(0)
const bookWrongCleared = ref(0)

// 取一次快照，避免复习过程中列表因响应式缩小
// 优先从进度恢复，否则从当前 reviewWords 取快照
watch(reviewWords, (words) => {
  if (reviewList.value.length === 0 && words.length > 0) {
    if (!loadReviewProgress()) {
      reviewList.value = [...words]
      // 非主线复习：确保进度从零开始
      currentWordIndex.value = 0
      reviewedCount.value = 0
    }
  }
}, { immediate: true })
const finished = ref(false)
const cardFlipped = ref(false)

const reviewPercent = computed(() => {
  if (reviewList.value.length === 0) return 0
  return Math.round((reviewedCount.value / reviewList.value.length) * 100)
})

const REVIEW_PROGRESS_KEY = 'wordcraft_review_progress'

function saveReviewProgress() {
  // 只有主线复习保存进度，错题和生词本每次都重新开始
  if (isWrongReview.value || isWordbookReview.value) return
  localStorage.setItem(REVIEW_PROGRESS_KEY, JSON.stringify({
    index: currentWordIndex.value,
    reviewed: reviewedCount.value,
    reviewList: reviewList.value
  }))
}

function loadReviewProgress() {
  // 直接读取路由参数，确保获取最新值
  const source = route.query.source
  // 错题/生词本每次都重新开始，不恢复进度
  if (source === 'wrongwords' || source === 'wordbook') return false
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEW_PROGRESS_KEY))
    if (!saved) return false
    if (!saved.reviewList || saved.reviewList.length === 0) return false
    reviewList.value = saved.reviewList
    currentWordIndex.value = Math.min(saved.index, reviewList.value.length - 1)
    reviewedCount.value = saved.reviewed
    return true
  } catch {}
  return false
}

function clearReviewProgress() {
  if (isWrongReview.value || isWordbookReview.value) return
  localStorage.removeItem(REVIEW_PROGRESS_KEY)
}

const currentReviewWord = computed(() => {
  if (finished.value) return null
  return reviewList.value[currentWordIndex.value] || null
})

function onCardFlip() {
  cardFlipped.value = true
}

function rateQuality(quality) {
  const word = currentReviewWord.value
  if (!word) return
  // 只有主线到期词才更新SM-2，错词仅清除不影响曲线
  if (!isWordbookReview.value && !isWrongReview.value && !word.isWrong) {
    store.reviewWord(generateWordId(word), quality)
  }
  // 错题本操作：记得扣1 / 忘记加1 / 模糊不变
  if (word.isWrong) {
    if (quality === 2) {
      store.acknowledgeWrongWord(generateWordId(word))
      if (isWrongReview.value) wrongCleared.value++
      if (isWordbookReview.value) bookWrongCleared.value++
    } else if (quality === 0) {
      store.addWrongWord(generateWordId(word))
    }
  }
  reviewedCount.value++

  if (currentWordIndex.value < reviewList.value.length - 1) {
    currentWordIndex.value++
    saveReviewProgress()
    // 下一个单词自动发音
    if (currentReviewWord.value) {
      setTimeout(() => speak(currentReviewWord.value.word), 200)
    }
  } else {
    finished.value = true
    clearReviewProgress()
  }
}

function toggleStar() {
  const word = currentReviewWord.value
  if (!word) return
  store.toggleWordBook(generateWordId(word))
}

function goHome() {
  if (isWordbookReview.value) {
    router.push('/wordbook')
  } else {
    router.push('/')
  }
}

function goBack() {
  if (isWrongReview.value) {
    router.push('/')
  } else if (isWordbookReview.value) {
    router.push('/wordbook')
  } else if (redirectTo.value) {
    router.push(redirectTo.value)
  } else {
    router.push('/')
  }
}

</script>

<style scoped>
.review-page {
  padding-bottom: 80px;
  padding-left: 8px;
  padding-right: 8px;
}

.nav-timer {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.nav-home-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  user-select: none;
}

.nav-home-btn:active {
  opacity: 0.7;
}

.review-header {
  padding: 8px 8px 0;
  margin-bottom: 12px;
}

.review-stats {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 12px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.review-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 复习模式下缩小单词卡片间距 */
.review-card-wrapper :deep(.word-card-wrapper) {
  padding: 8px 0;
  gap: 12px;
}

.word-info {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 13px;
  align-items: center;
}

.day-badge {
  background: var(--accent-light);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
}

.wrong-tag {
  color: var(--danger);
  font-weight: 700;
  font-size: 12px;
}

.wordbook-tag {
  color: var(--accent);
  font-weight: 600;
  font-size: 12px;
}

.review-count {
  color: var(--text-secondary);
}

.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.review-actions .van-button {
  min-width: 80px;
  font-size: 14px;
  height: 42px !important;
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
  margin-bottom: 8px;
}

.result-card p {
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
