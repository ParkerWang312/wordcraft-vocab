/**
 * 统一语音播报工具
 *
 * 优先使用 speechSynthesis（iOS/桌面），不支持时降级为 Google TTS Audio 流
 */

/** 语音引擎类型 */
const ENGINE = (() => {
  if (typeof speechSynthesis !== 'undefined') return 'native'
  if (typeof Audio !== 'undefined') return 'google-tts'
  return 'none'
})()

/** 诊断信息 */
let _diagMsg = ENGINE === 'native'
  ? '✅ speechSynthesis（原生）'
  : ENGINE === 'google-tts'
    ? '🔊 Google TTS（降级）'
    : '❌ 无可用语音引擎'

// ===== 原生 speechSynthesis =====
let cachedVoices = null

function getVoices() {
  if (cachedVoices?.length) return cachedVoices
  cachedVoices = speechSynthesis?.getVoices?.() || []
  return cachedVoices
}

if (ENGINE === 'native') {
  speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoices = speechSynthesis.getVoices()
    _diagMsg = diagnose()
  })
  // 首次加载延迟获取 voices
  setTimeout(() => { if (!cachedVoices?.length) cachedVoices = speechSynthesis.getVoices() }, 500)
}

function findEnglishVoice() {
  const voices = getVoices()
  if (!voices.length) return null
  return voices.find(v => v.lang === 'en-US')
    || voices.find(v => v.lang.startsWith('en'))
    || null
}

function nativeSpeak(text, rate) {
  const voice = findEnglishVoice()
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate
  if (voice) { u.voice = voice; u.lang = voice.lang }
  else u.lang = 'en-US'
  speechSynthesis.speak(u)
  if (speechSynthesis.paused) speechSynthesis.resume()
}

// ===== Google TTS 降级方案 =====
let _audio = null
const _audioQueue = []

function getAudio() {
  if (!_audio) _audio = new Audio()
  return _audio
}

function googleTtsSpeak(text) {
  // 防止高频调用导致请求堆积
  _audioQueue.length = 0
  const audio = getAudio()
  audio.pause()
  audio.currentTime = 0
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`
  audio.src = url
  audio.play().catch(() => {
    // 某些浏览器需用户手势，标记为"需交互后重试"
  })
}

// ===== 公开 API =====
export function speak(text, lang = 'en-US', rate = 0.8) {
  if (ENGINE === 'native') {
    nativeSpeak(text, rate)
  } else if (ENGINE === 'google-tts') {
    googleTtsSpeak(text)
  }
}

export function diagnose() {
  if (ENGINE === 'native') {
    const voices = getVoices()
    const enVoices = voices.filter(v => v.lang.startsWith('en'))
    const parts = [
      `📢 voices: ${voices.length}`,
      enVoices.length ? `英文: ${enVoices.map(v => v.name).join(', ')}` : '⚠ 无英文！',
      `speaking: ${speechSynthesis.speaking}`
    ]
    return parts.join(' | ')
  }
  return _diagMsg
}

export function testSpeak() {
  speak('hello world')
  return diagnose()
}

export function warmUpSpeech() {
  if (ENGINE === 'native') {
    getVoices()
    speechSynthesis?.cancel()
    const tmp = new SpeechSynthesisUtterance('hello')
    tmp.volume = 0
    speechSynthesis?.speak(tmp)
  }
  // Google TTS 不需要预热
}
