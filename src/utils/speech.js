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
  if (typeof speechSynthesis === 'undefined') {
    console.warn('[speech] speechSynthesis 不可用')
    return
  }

  const voice = findEnglishVoice()
  console.log(`[speech] 朗读: "${text}"`, { voice: voice?.name, lang: voice?.lang }, 'platform:', navigator.platform)

  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.onstart = () => console.log('[speech] ✓ 开始播放')
  utterance.onend = () => console.log('[speech] ✓ 播放完成')
  utterance.onerror = (e) => console.warn('[speech] ✗ 错误:', e.error)

  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  } else {
    utterance.lang = lang
  }

  // 直接 speak（在用户手势内调用）
  speechSynthesis.speak(utterance)

  // Android 可能进入暂停状态
  if (speechSynthesis.paused) {
    speechSynthesis.resume()
  }
}

/**
 * 诊断：返回 speechSynthesis 状态字符串
 */
export function diagnose() {
  if (typeof speechSynthesis === 'undefined') {
    return '❌ speechSynthesis 不可用'
  }
  const voices = speechSynthesis.getVoices()
  const enVoices = voices.filter(v => v.lang.startsWith('en'))
  const parts = [
    `📢 voices: ${voices.length} 个`,
    enVoices.length > 0 ? `英文: ${enVoices.map(v => v.name).join(', ')}` : '⚠ 无英文语音！',
    `speaking: ${speechSynthesis.speaking}`,
    `paused: ${speechSynthesis.paused}`,
    `pending: ${speechSynthesis.pending}`,
    navigator.userAgent.includes('Android') ? '📱 Android' : ''
  ]
  return parts.join(' | ')
}

/**
 * 测试按钮：直接朗读 test word，用于调试
 */
export function testSpeak() {
  console.log(diagnose())
  speak('hello world')
  return diagnose()
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
