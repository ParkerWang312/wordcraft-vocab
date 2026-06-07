<template>
  <div class="word-card-wrapper">
    <div class="word-card" :class="{ flipped: isFlipped }" @click="flip">
      <div class="card-front">
        <div
          v-if="showStar"
          class="btn-star"
          :class="{ active: isStarred }"
          @click.stop="onStar"
        >
          {{ isStarred ? '⭐' : '☆' }}
        </div>
        <div class="card-inner">
          <div class="word-text">{{ word.word }}</div>
          <div class="phonetic-row" @click.stop="speak">
            <span class="phonetic-text">{{ word.phonetic || '' }}</span>
            <span class="speak-icon">🔊</span>
          </div>
          <div class="flip-hint">
            <span class="flip-icon">👆</span>
            <span class="flip-text">点我翻转查看释义</span>
          </div>
        </div>
      </div>
      <div class="card-back">
        <div
          v-if="showStar"
          class="btn-star btn-star-back"
          :class="{ active: isStarred }"
          @click.stop="onStar"
        >
          {{ isStarred ? '⭐' : '☆' }}
        </div>
        <div class="card-inner">
          <div class="back-word" v-if="settings.data.showWordOnBack">{{ word.word }}</div>
          <div class="pos-tag" v-if="word.pos">{{ word.pos }}</div>
          <div class="back-phonetic-row" v-if="settings.data.showPhoneticOnBack && word.phonetic" @click.stop="speak">
            <span class="back-phonetic-text">{{ word.phonetic }}</span>
            <span class="back-speak-icon">🔊</span>
          </div>
          <div class="meaning-text">{{ word.def || word.meaning }}</div>
        </div>
      </div>
    </div>
    <div class="card-actions" v-if="showActions && (!showKnown || hasBeenFlipped)">
      <van-button v-if="showKnown" class="btn-unknown" round size="large" type="warning" @click="$emit('unknown')">
        😕 不认识
      </van-button>
      <van-button v-if="showKnown" class="btn-known" round size="large" type="success" @click="$emit('known')">
        😊 认识
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from '../stores/settings.js'

const settings = useSettingsStore()

const props = defineProps({
  word: { type: Object, required: true },
  isStarred: { type: Boolean, default: false },
  showActions: { type: Boolean, default: true },
  showKnown: { type: Boolean, default: true },
  showStar: { type: Boolean, default: true }
})

const emit = defineEmits(['known', 'unknown', 'star', 'flip'])
const isFlipped = ref(false)
const hasBeenFlipped = ref(false)

// 切换单词时重置翻转状态
watch(() => props.word, () => {
  isFlipped.value = false
  hasBeenFlipped.value = false
})

function flip() {
  isFlipped.value = !isFlipped.value
  if (!hasBeenFlipped.value) {
    hasBeenFlipped.value = true
    emit('flip')
  }
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
}
</script>

<style scoped>
.word-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 16px 0;
  width: 100%;
}

.word-card {
  width: 100%;
  max-width: 440px;
  height: 240px;
  position: relative;
  cursor: pointer;
  perspective: 800px;
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border: none;
}

.word-card.flipped .card-front {
  transform: rotateY(180deg);
}

.word-card.flipped .card-back {
  transform: rotateY(0deg);
}

.card-inner {
  text-align: center;
  padding: 24px;
}

.word-text {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--text-primary);
  margin-bottom: 14px;
  word-break: normal;
  overflow-wrap: break-word;
}

.phonetic-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 5px 14px;
  border-radius: 10px;
  background: var(--accent-light);
  transition: background 0.2s;
  margin-bottom: 16px;
  user-select: none;
}

.phonetic-row:active {
  background: var(--accent);
}

.phonetic-row:active .phonetic-text,
.phonetic-row:active .speak-icon {
  color: #fff;
}

.phonetic-text {
  font-size: 16px;
  color: var(--accent);
  font-weight: 500;
}

.speak-icon {
  font-size: 16px;
}

.flip-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
}

.flip-icon {
  font-size: 20px;
  animation: tapFloat 1.2s ease-in-out infinite;
}

.flip-text {
  font-size: 13px;
  color: var(--accent);
  font-weight: 600;
  animation: textPulse 1.2s ease-in-out infinite;
}

@keyframes tapFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.15); }
}

@keyframes textPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.pos-tag {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 10px;
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
}

.back-word {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
  opacity: 0.9;
}

.meaning-text {
  font-size: 22px;
  color: #fff;
  font-weight: 600;
  line-height: 1.6;
}

.back-phonetic-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 10px;
  cursor: pointer;
  padding: 5px 14px;
  border-radius: 10px;
  background: rgba(255,255,255,0.2);
  user-select: none;
  transition: background 0.2s;
}

.back-phonetic-row:active {
  background: rgba(255,255,255,0.35);
}

.back-phonetic-text {
  font-size: 15px;
  color: #fff;
  font-weight: 500;
}

.back-speak-icon {
  font-size: 15px;
}

.card-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 440px;
}

.btn-unknown, .btn-known {
  width: 120px;
  padding: 0 !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  box-shadow: 0 3px 10px rgba(0,0,0,0.12);
  border-radius: 20px !important;
  height: 42px !important;
  line-height: 42px !important;
  text-align: center !important;
  color: #fff !important;
  border: none !important;
}

.btn-star {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s, background 0.2s;
  z-index: 5;
}

.btn-star-back {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.25);
}

.btn-star.active {
  background: #FFF3CD;
  border-color: #F59E0B;
}

.btn-star-back.active {
  background: rgba(255,220,50,0.25);
  border-color: rgba(255,220,50,0.5);
}

.btn-star:active {
  transform: scale(0.9);
}

.btn-unknown {
  background: #F59E0B !important;
}

.btn-known {
  background: #10B981 !important;
}
</style>

<style>
.btn-unknown {
  background: #F59E0B !important;
}

.btn-known {
  background: #10B981 !important;
}
</style>
