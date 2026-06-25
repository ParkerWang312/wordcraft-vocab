import { ref, readonly } from 'vue'

/**
 * 语音输入 composable
 *
 * 双模式：
 * - Chrome/Edge: Web Speech API
 * - iOS Safari: hidden input + keyboard dictation
 *
 * 匹配逻辑：忽略大小写和特殊字符，纯字母比较
 */

function getRecognition() {
  if (typeof window === 'undefined') return null
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  try {
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = true
    return r
  } catch { return null }
}

const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

export function useVoiceInput() {
  const recognition = getRecognition()
  const isWebSpeech = !!recognition
  const isSupported = isWebSpeech || !!iOS

  const isListening = ref(false)
  const lastResult = ref('idle')
  const retryCount = ref(0)
  const transcript = ref('')

  let targetWord = ''
  let dictInput = null
  let inputHandler = null

  // ===== Web Speech API mode =====
  if (recognition) {
    recognition.continuous = false

    recognition.onresult = (event) => {
      const last = event.results.length - 1
      transcript.value = event.results[last][0].transcript.trim()
    }

    recognition.onend = () => {
      if (transcript.value && targetWord) {
        const spoken = transcript.value.toLowerCase().replace(/[^a-z]/g, '')
        const target = targetWord.toLowerCase().replace(/[^a-z]/g, '')
        if (spoken === target && target.length > 0) {
          lastResult.value = 'correct'
          isListening.value = false
          retryCount.value = 0
          return
        }
        const count = retryCount.value + 1
        retryCount.value = count
        lastResult.value = 'wrong'
      }

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
      stop()
    }
  }

  // ===== Match helper =====
  function checkText(text) {
    if (!text || !targetWord) return
    const spoken = text.toLowerCase().replace(/[^a-z]/g, '')
    const target = targetWord.toLowerCase().replace(/[^a-z]/g, '')
    transcript.value = text
    if (spoken === target && target.length > 0) {
      lastResult.value = 'correct'
      isListening.value = false
      retryCount.value = 0
      cleanupDict()
    } else {
      const count = retryCount.value + 1
      retryCount.value = count
      lastResult.value = 'wrong'
      // 清空输入框准备下次
      if (dictInput) dictInput.value = ''
    }
  }

  // ===== iOS dictation mode =====
  function createDictInput() {
    if (dictInput) return
    dictInput = document.createElement('input')
    dictInput.type = 'text'
    dictInput.lang = 'en-US'
    dictInput.autocapitalize = 'off'
    dictInput.autocorrect = 'off'
    dictInput.style.cssText = 'position:fixed;top:-100px;left:0;width:1px;height:1px;opacity:0;'
    document.body.appendChild(dictInput)

    inputHandler = () => {
      const val = dictInput.value.trim()
      if (val) checkText(val)
    }
    dictInput.addEventListener('input', inputHandler)
  }

  function cleanupDict() {
    if (dictInput) {
      dictInput.removeEventListener('input', inputHandler)
      dictInput.remove()
      dictInput = null
      inputHandler = null
    }
  }

  // ===== Public API =====
  function start(word) {
    targetWord = word
    isListening.value = true
    lastResult.value = 'idle'
    retryCount.value = 0
    transcript.value = ''

    if (recognition) {
      try { recognition.start() } catch {}
    } else if (iOS) {
      createDictInput()
      dictInput.value = ''
      // 设置输入模式为英文，键盘仍会显示 📣 按钮（iOS 16+）
      if (dictInput.setAttribute) {
        dictInput.setAttribute('enterkeyhint', 'done')
      }
      dictInput.focus()
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
    cleanupDict()
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
