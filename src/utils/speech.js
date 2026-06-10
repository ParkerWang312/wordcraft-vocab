/**
 * 统一语音播报工具，处理 Android Chrome 兼容性问题
 *
 * Android Chrome 的 speechSynthesis 有以下坑：
 * 1. 首次 speak() 必须在用户手势内触发，否则被静默丢弃
 * 2. 需要先 cancel() 再 speak()，否则队列堆积不读
 * 3. 某些设备默认不含英文语音引擎，需安装 Google TTS
 * 4. voices 异步加载，getVoices() 首次返回空
 */

/** 已经加载的语音列表 */
let cachedVoices = null

/** 确保 voices 已加载 */
function getVoices() {
  if (cachedVoices?.length) return cachedVoices
  cachedVoices = speechSynthesis.getVoices()
  return cachedVoices
}

// 监听 voices 变化（首次加载后会触发）
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoices = speechSynthesis.getVoices()
  })
}

/**
 * 查找最佳英文语音
 * 优先精确匹配 en-US，其次 en，最后取第一个可用语音
 */
function findEnglishVoice() {
  const voices = getVoices()
  if (!voices.length) return null
  let v = voices.find(v => v.lang === 'en-US')
  if (!v) v = voices.find(v => v.lang.startsWith('en'))
  return v || null
}

/**
 * 朗读单词
 */
export function speak(text, lang = 'en-US', rate = 0.8) {
  if (typeof speechSynthesis === 'undefined') return

  // 必须每次先 cancel，Android 上不 cancel 后续 speak 会失效
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate

  // 指定英文语音（Android 默认引擎可能不支持 en-US）
  const voice = findEnglishVoice()
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  }

  // Android 防卡死：延迟一小段时间确保 cancel 完全生效
  setTimeout(() => {
    speechSynthesis.speak(utterance)

    // Android 某些版本 speak 后立即进入 paused 状态，需要 resume
    setTimeout(() => {
      if (speechSynthesis.paused) {
        speechSynthesis.resume()
      }
      // 如果还没开始播放，可能是被静默丢弃，再试一次
      if (!speechSynthesis.speaking) {
        speechSynthesis.speak(utterance)
      }
    }, 50)
  }, 20)
}

/**
 * 预热：必须在用户手势（touchstart/click）中调用一次
 * Android 首次 speak 需要用户激活
 */
export function warmUpSpeech() {
  if (typeof speechSynthesis === 'undefined') return
  // 确保 voices 已加载
  getVoices()
  // 发送一个静默音激活 speechSynthesis
  speechSynthesis.cancel()
  const tmp = new SpeechSynthesisUtterance('hello')
  tmp.volume = 0
  tmp.rate = 2
  speechSynthesis.speak(tmp)
}
