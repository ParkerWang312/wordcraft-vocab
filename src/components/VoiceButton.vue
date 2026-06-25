<template>
  <div class="voice-wrapper">
    <!-- 浏览器不支持时显示提示 -->
    <div class="voice-unsupported" v-if="!isSupported && !shownUnsupported">
      ⚠️ 当前浏览器不支持语音识别（请使用 Chrome/Edge）
      <span class="voice-dismiss" @click="shownUnsupported = true">✕</span>
    </div>
    <div class="voice-hint" v-if="showFlipHint">
      👆 点击卡片翻转
    </div>
    <div
      v-if="isSupported"
      :class="['voice-btn', statusClass]"
      @click="toggle"
    >
      <span class="voice-icon">{{ icon }}</span>
      <span class="voice-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useVoiceInput } from '../composables/useVoiceInput.js'

const props = defineProps({
  word: { type: String, required: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['correct', 'feedback'])

const voice = useVoiceInput()

const voiceActive = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const shownUnsupported = ref(false)
let errorTimer = null
let successTimer = null

// 当 correct 结果返回时，触发自动翻转
watch(() => voice.lastResult, (val) => {
  if (val === 'correct') {
    showSuccess.value = true
    emit('correct')
    voiceActive.value = false
    successTimer = setTimeout(() => { showSuccess.value = false }, 600)
  } else if (val === 'wrong') {
    showError.value = true
    emit('feedback', 'wrong')
    clearTimeout(errorTimer)
    errorTimer = setTimeout(() => { showError.value = false }, 600)
  }
})

const showFlipHint = computed(() => {
  return voiceActive.value && voice.retryCount >= 2
})

const statusClass = computed(() => {
  if (showSuccess.value) return 'success'
  if (showError.value) return 'error'
  if (voiceActive.value) return 'listening'
  return 'idle'
})

const icon = computed(() => {
  if (showSuccess.value) return '✅'
  if (showError.value) return '❌'
  if (voiceActive.value) return '🎤'
  return '🎤'
})

const label = computed(() => {
  if (showSuccess.value) return 'Good!'
  if (voiceActive.value) return '正在听... (点击结束)'
  return '点击录音'
})

function toggle() {
  if (props.disabled) return
  if (voiceActive.value) {
    voice.stop()
    voiceActive.value = false
  } else {
    voice.start(props.word)
    voiceActive.value = true
  }
}

// 单词变化时重置
watch(() => props.word, () => {
  if (voiceActive.value) {
    voice.stop()
  }
  voiceActive.value = false
  showSuccess.value = false
  showError.value = false
  clearTimeout(successTimer)
  clearTimeout(errorTimer)
})
</script>

<style scoped>
.voice-wrapper { text-align: center; margin: 10px 0; }
.voice-hint {
  font-size: 13px;
  color: #9CA3AF;
  margin-bottom: 6px;
  animation: fadeInUp 0.3s ease;
}
.voice-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 28px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  border: 2px solid #E5E7EB;
  background: #F9FAFB;
  color: #6B7280;
}
.voice-btn:active { transform: scale(0.96); }
.voice-btn.listening {
  border-color: #3B82F6;
  background: #EFF6FF;
  color: #3B82F6;
  animation: pulse 1.5s infinite;
}
.voice-btn.success {
  border-color: #10B981;
  background: #ECFDF5;
  color: #10B981;
}
.voice-btn.error {
  border-color: #EF4444;
  background: #FEF2F2;
  color: #EF4444;
}
.voice-icon { font-size: 20px; }
.voice-label { font-size: 14px; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.voice-unsupported {
  font-size: 12px;
  color: #9CA3AF;
  padding: 8px 12px;
  background: #F9FAFB;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.voice-dismiss {
  color: #6B7280;
  cursor: pointer;
  font-size: 14px;
}
</style>
