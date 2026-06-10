/**
 * 统一语音播报工具，处理 Android Chrome 兼容性问题
 */

/** 是否已预热 speechSynthesis（Android 需要用户手势触发首次播放） */
let warmedUp = false

/**
 * Android 预热：必须在用户交互（touchstart/click）中调用一次
 * 不预热的话 speechSynthesis.speak() 会被浏览器静默丢弃
 */
export function warmUpSpeech() {
  if (warmedUp || !('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const tmp = new SpeechSynthesisUtterance('')
  tmp.volume = 0
  tmp.onstart = () => { warmedUp = true }
  tmp.onerror = () => { warmedUp = false }
  speechSynthesis.speak(tmp)
}

/**
 * 朗读单词
 * @param {string} text  要朗读的文字
 * @param {string} lang  语言代码，默认 'en-US'
 * @param {number} rate  语速，默认 0.8
 */
export function speak(text, lang = 'en-US', rate = 0.8) {
  if (!('speechSynthesis' in window)) return

  // 如果未预热，尝试预热（非交互触发可能无效，但值得试）
  if (!warmedUp) warmUpSpeech()

  speechSynthesis.cancel()

  // Android 某些版本会进入暂停状态，强制恢复
  if (speechSynthesis.paused) {
    speechSynthesis.resume()
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  utterance.onerror = (e) => {
    // Android: not-allowed 错误很常见，尝试 resume 后重试
    if (e.error === 'not-allowed') {
      speechSynthesis.resume()
      setTimeout(() => {
        speechSynthesis.speak(utterance)
      }, 100)
    }
  }

  speechSynthesis.speak(utterance)
}
