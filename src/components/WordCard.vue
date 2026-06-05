<template>
  <div class="word-card-wrapper">
    <div class="word-card" :class="{ flipped: isFlipped }" @click="flip">
      <div class="card-front">
        <div class="word-text">{{ word.word }}</div>
        <div class="phonetic" @click.stop="speak">{{ word.phonetic }} 🔊</div>
      </div>
      <div class="card-back">
        <div class="meaning-text">{{ word.meaning }}</div>
      </div>
    </div>
    <div class="card-actions" v-if="showActions">
      <van-button
        v-if="showStar"
        :icon="isStarred ? 'star' : 'star-o'"
        round
        size="small"
        :type="isStarred ? 'warning' : 'default'"
        @click="onStar"
      />
      <van-button v-if="showKnown" round size="small" type="danger" @click="$emit('unknown')">
        👎 不认识
      </van-button>
      <van-button v-if="showKnown" round size="small" type="primary" @click="$emit('known')">
        👍 认识
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  word: { type: Object, required: true },
  isStarred: { type: Boolean, default: false },
  showActions: { type: Boolean, default: true },
  showKnown: { type: Boolean, default: true },
  showStar: { type: Boolean, default: true }
})

const emit = defineEmits(['known', 'unknown', 'star'])
const isFlipped = ref(false)

function flip() {
  isFlipped.value = !isFlipped.value
}

function speak() {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(props.word.word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}

function onStar() {
  emit('star')
  if (!props.isStarred) {
    // 简短提示后自动翻转回来
    setTimeout(() => { isFlipped.value = false }, 400)
  }
}
</script>

<style scoped>
.word-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 16px 0;
}

.word-card {
  width: 100%;
  max-width: 320px;
  height: 200px;
  position: relative;
  cursor: pointer;
  perspective: 800px;
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--bg-card);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  transition: transform 0.5s;
}

.card-front {
  transform: rotateY(0deg);
}

.card-back {
  transform: rotateY(180deg);
  background: var(--accent);
  color: white;
  border: none;
}

.word-card.flipped .card-front {
  transform: rotateY(180deg);
}

.word-card.flipped .card-back {
  transform: rotateY(0deg);
}

.word-text {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
}

.phonetic {
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.phonetic:hover {
  background: var(--accent-light);
}

.card-back .meaning-text {
  font-size: 22px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
