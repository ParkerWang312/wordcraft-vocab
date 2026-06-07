<template>
  <div class="page review-page">
    <van-nav-bar :title="isWordbookReview ? '生词本复习' : '复习模式'" :fixed="false" />

    <div class="review-header">
      <p class="review-subtitle">
        <template v-if="isWordbookReview">
          生词本复习: {{ reviewWords.length }} 词
        </template>
        <template v-else>
          待复习: {{ store.dueReviewCount }} 词
          <span v-if="store.wrongCount > 0" class="wrong-badge">· 🚩 错题 {{ store.wrongCount }}</span>
        </template>
      </p>
      <ProgressBar
        :current="reviewedCount"
        :total="reviewWords.length"
        label="复习进度"
      />
    </div>

    <!-- 无待复习 -->
    <div class="empty-state" v-if="reviewWords.length === 0">
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
import ProgressBar from '../components/ProgressBar.vue'

const router = useRouter()
const route = useRoute()
const store = useLearningStore()

const redirectTo = computed(() => route.query.redirectTo || '')
const isWordbookReview = computed(() => route.query.source === 'wordbook')

// 合并复习列表：错题优先，然后普通待复习
const reviewWords = computed(() => {
  // 生词本一键复习：遍历所有生词
  if (isWordbookReview.value) {
    return store.wordBookWords.map(w => {
      const wid = generateWordId(w)
      // 确保词有初始化状态（让 SM-2 能正常工作）
      store.initWordState(wid)
      return { ...w, wordId: wid, state: store.state.wordStates[wid] || {}, isWrong: false, isWordbook: true }
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

  const due = store.dueReviewWords.map(w => ({ ...w, isWrong: false }))

  return [...wrongWords, ...due]
})

const reviewedCount = ref(0)
const currentWordIndex = ref(0)
const finished = ref(false)
const cardFlipped = ref(false)

const currentReviewWord = computed(() => {
  if (finished.value) return null
  return reviewWords.value[currentWordIndex.value] || null
})

function onCardFlip() {
  cardFlipped.value = true
}

function rateQuality(quality) {
  const word = currentReviewWord.value
  if (!word) return
  store.reviewWord(generateWordId(word), quality)
  // 答对时清除错题
  if (quality >= 1 && word.isWrong) {
    store.removeWrongWord(generateWordId(word))
  }
  reviewedCount.value++

  if (currentWordIndex.value < reviewWords.value.length - 1) {
    currentWordIndex.value++
  } else {
    finished.value = true
  }
}

function toggleStar() {
  const word = currentReviewWord.value
  if (!word) return
  store.toggleWordBook(generateWordId(word))
}

function goBack() {
  if (isWordbookReview.value) {
    router.push('/wordbook')
  } else if (redirectTo.value) {
    router.push(redirectTo.value)
  } else {
    router.push('/')
  }
}

// 自动播放发音
watch(currentReviewWord, (word) => {
  cardFlipped.value = false
  if (word && 'speechSynthesis' in window) {
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }, 300)
  }
})
</script>

<style scoped>
.review-page {
  padding-bottom: 80px;
  padding-left: 8px;
  padding-right: 8px;
}

.review-header {
  margin-bottom: 20px;
}

.review-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 12px;
}

.wrong-badge {
  color: var(--danger);
  font-weight: 600;
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

.word-info {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
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
  margin-top: 20px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.review-actions .van-button {
  min-width: 80px;
  font-size: 14px;
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
