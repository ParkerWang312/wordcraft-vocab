<template>
  <div class="page wordbook-page">
    <van-nav-bar title="生词本" :fixed="false" />

    <div class="wordbook-header">
      <p class="count-text">共 {{ store.wordBookWords.length }} 个生词</p>
      <van-button
        v-if="store.wordBookWords.length > 0"
        size="small"
        type="primary"
        round
        @click="startAllReview"
      >
        一键复习
      </van-button>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="store.wordBookWords.length === 0">
      <span class="empty-emoji">📖</span>
      <h3>生词本还是空的</h3>
      <p>学习时点击 ⭐ 收藏不认识的单词</p>
    </div>

    <!-- 生词列表 -->
    <div class="word-list">
      <van-swipe-cell v-for="(word, idx) in store.wordBookWords" :key="idx">
        <div class="word-item" @click="showDetail(word)">
          <div class="word-main">
            <span class="word-en">{{ word.word }}</span>
            <span class="word-phonetic">{{ word.phonetic }}</span>
          </div>
          <div class="word-cn">{{ word.meaning }}</div>
          <div class="word-meta">
            <span class="day-badge">Day {{ word.day }}</span>
            <span class="status-text" v-if="word.state?.status !== 'unknown'">
              {{ statusLabels[word.state?.status] || '' }}
            </span>
          </div>
        </div>
        <template #right>
          <van-button square type="danger" text="移除" @click="removeWord(word)" />
        </template>
      </van-swipe-cell>
    </div>

    <!-- 单词详情弹窗 -->
    <van-overlay :show="showOverlay" @click="showOverlay = false">
      <div class="detail-popup" @click.stop>
        <div class="detail-word" v-if="detailWord">{{ detailWord.word }}</div>
        <div class="detail-phonetic" v-if="detailWord">{{ detailWord.phonetic }}</div>
        <div class="detail-meaning" v-if="detailWord">{{ detailWord.meaning }}</div>
        <van-button
          round
          size="small"
          type="primary"
          @click="speakDetail"
          v-if="detailWord"
          style="margin-top:16px"
        >
          🔊 发音
        </van-button>
        <van-button
          v-if="detailWord"
          style="margin-left:8px; margin-top:16px"
          round
          size="small"
          type="danger"
          @click="removeDetailWord"
        >
          移除
        </van-button>
        <van-button
          style="margin-left:8px; margin-top:16px"
          round
          size="small"
          @click="showOverlay = false"
        >
          关闭
        </van-button>
      </div>
    </van-overlay>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore, generateWordId } from '../stores/learning.js'
import { showToast } from 'vant'

const store = useLearningStore()
const router = useRouter()

const statusLabels = {
  learning: '学习中',
  known: '已掌握',
  mastered: '熟练'
}

const showOverlay = ref(false)
const detailWord = ref(null)

function showDetail(word) {
  detailWord.value = word
  showOverlay.value = true
}

function speakDetail() {
  if (detailWord.value && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(detailWord.value.word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}

function removeWord(word) {
  store.toggleWordBook(generateWordId(word))
  showToast('已从生词本移除')
}

function removeDetailWord() {
  if (detailWord.value) {
    removeWord(detailWord.value)
    showOverlay.value = false
  }
}

function startAllReview() {
  router.push('/review?source=wordbook')
}
</script>

<style scoped>
.wordbook-page {
  padding-bottom: 80px;
}

.wordbook-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 8px;
}

.count-text {
  font-size: 14px;
  color: var(--text-secondary);
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
  font-size: 14px;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.word-item {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: transform 0.2s;
}

.word-item:active {
  transform: scale(0.98);
}

.word-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.word-en {
  font-size: 17px;
  font-weight: 700;
}

.word-phonetic {
  font-size: 12px;
  color: var(--text-secondary);
}

.word-cn {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.word-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.day-badge {
  background: var(--accent-light);
  color: var(--accent);
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.status-text {
  font-size: 11px;
  color: var(--success);
}

.detail-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-card);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  width: 280px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.detail-word {
  font-size: 32px;
  font-weight: 800;
}

.detail-phonetic {
  font-size: 15px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.detail-meaning {
  font-size: 18px;
  margin-top: 12px;
  color: var(--accent);
  font-weight: 600;
}
</style>
