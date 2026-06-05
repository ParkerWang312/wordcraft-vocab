<template>
  <div class="page review-page">
    <van-nav-bar title="复习模式" :fixed="false" />

    <div class="review-header">
      <p class="review-subtitle">今日待复习: {{ store.dueReviewCount }} 词</p>
      <ProgressBar
        :current="reviewedCount"
        :total="reviewWords.length"
        label="复习进度"
      />
    </div>

    <!-- 无待复习 -->
    <div class="empty-state" v-if="reviewWords.length === 0">
      <span class="empty-emoji">🎉</span>
      <h3>暂无待复习单词</h3>
      <p>继续学习新单词吧！</p>
      <van-button type="primary" round size="large" @click="$router.push('/')">
        去学习
      </van-button>
    </div>

    <!-- 复习卡片 -->
    <div class="review-card-wrapper" v-if="currentReviewWord">
      <div class="word-info">
        <span class="day-badge">Day {{ currentReviewWord.day }}</span>
        <span class="review-count">第 {{ (currentReviewWord.state?.reviewCount || 0) + 1 }} 次复习</span>
      </div>

      <WordCard
        :word="currentReviewWord"
        :show-known="false"
        :show-star="true"
        :is-starred="currentReviewWord.state?.inWordBook"
        @star="toggleStar"
      />

      <div class="review-actions">
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
      <van-button type="primary" block round size="large" @click="$router.push('/')">
        返回首页
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLearningStore, generateWordId } from '../stores/learning.js'
import WordCard from '../components/WordCard.vue'
import ProgressBar from '../components/ProgressBar.vue'

const store = useLearningStore()

const reviewWords = computed(() => store.dueReviewWords)
const reviewedCount = ref(0)
const currentWordIndex = ref(0)
const finished = ref(false)

const currentReviewWord = computed(() => {
  if (finished.value) return null
  return reviewWords.value[currentWordIndex.value] || null
})

function rateQuality(quality) {
  const word = currentReviewWord.value
  if (!word) return
  store.reviewWord(generateWordId(word), quality)
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

// 自动播放发音
watch(currentReviewWord, (word) => {
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
}

.day-badge {
  background: var(--accent-light);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
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
