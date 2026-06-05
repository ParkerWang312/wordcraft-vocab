<template>
  <div class="page learn-page">
    <!-- 顶部导航 -->
    <van-nav-bar
      :title="'Day ' + dayNum + ' / 28'"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <van-icon name="play-circle-o" size="24" @click="goPractice" />
      </template>
    </van-nav-bar>

    <div class="day-title">{{ dayTitle }}</div>

    <ProgressBar :current="currentIndex + 1" :total="words.length" label="学习进度" />

    <!-- 单词卡片 -->
    <WordCard
      v-if="currentWord"
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

      <van-button type="primary" block round size="large" @click="goPractice">
        开始练习
      </van-button>
      <van-button style="margin-top:10px" type="default" block round size="large" @click="$router.push('/')">
        返回首页
      </van-button>
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
const currentIndex = ref(0)
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

  if (knownCount.value < words.value.length) {
    knownCount.value++
  }

  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
  } else {
    // 全部学完
    allDone.value = true
    store.completeDay(dayNum.value)
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

// 如果该天已经完成，直接跳到练习
const dayCompleted = computed(() => store.state.completedDays.includes(dayNum.value))
</script>

<style scoped>
.learn-page {
  padding-bottom: 80px;
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
</style>
