import { ref, readonly } from 'vue'

/**
 * 语音输入 composable
 * 封装 Web Speech API (SpeechRecognition)，用户主动控制开始/结束
 *
 * 匹配逻辑：忽略大小写和特殊字符，纯字母比较
 */

function getRecognition() {
  if (typeof window === 'undefined') return null
  // Edge/Chrome 支持 webkitSpeechRecognition
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  try {
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = true
    return r
  } catch { return null }
}

export function useVoiceInput() {
  const recognition = getRecognition()
  const isSupported = !!recognition

  const isListening = ref(false)
  const lastResult = ref('idle')   // 'idle' | 'correct' | 'wrong'
  const retryCount = ref(0)
  const transcript = ref('')

  let targetWord = ''
  let continuousStarted = false

  if (recognition) {
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false  // 单次识别

    recognition.onresult = (event) => {
      const last = event.results.length - 1
      transcript.value = event.results[last][0].transcript.trim()
    }

    recognition.onend = () => {
      // 检查匹配
      if (transcript.value && targetWord) {
        const spoken = transcript.value.toLowerCase().replace(/[^a-z]/g, '')
        const target = targetWord.toLowerCase().replace(/[^a-z]/g, '')
        if (spoken === target && target.length > 0) {
          lastResult.value = 'correct'
          isListening.value = false
          retryCount.value = 0
          return
        }
        // 不匹配，记录错误
        const count = retryCount.value + 1
        retryCount.value = count
        lastResult.value = 'wrong'
      }

      // 如果仍在监听状态（非 correct），继续重启识别
      if (isListening.value && lastResult.value !== 'correct') {
        setTimeout(() => {
          if (isListening.value) {
            try { recognition.start() } catch {}
          }
        }, 200)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // 无语音输入，静默继续（用户可能没说话，保持监听）
        if (isListening.value) {
          setTimeout(() => {
            if (isListening.value) {
              try { recognition.start() } catch {}
            }
          }, 200)
        }
        return
      }
      if (event.error === 'aborted') return
      console.warn('[voice] Error:', event.error)
      stop()
    }
  }

  function start(word) {
    if (!recognition) return
    targetWord = word
    isListening.value = true
    lastResult.value = 'idle'
    retryCount.value = 0
    transcript.value = ''
    try {
      recognition.start()
    } catch {
      // 可能已经在运行
    }
  }

  function stop() {
    isListening.value = false
    lastResult.value = 'idle'
    retryCount.value = 0
    transcript.value = ''
    targetWord = ''
    if (recognition) {
      try { recognition.abort() } catch {}
    }
  }

  function resetRetry() {
    retryCount.value = 0
    lastResult.value = 'idle'
  }

  return {
    isListening: readonly(isListening),
    lastResult: readonly(lastResult),
    retryCount: readonly(retryCount),
    transcript: readonly(transcript),
    isSupported,
    start,
    stop,
    resetRetry
  }
}
