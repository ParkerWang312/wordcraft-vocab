/**
 * 统一语音播报工具
 *
 * 优先使用 speechSynthesis（iOS/桌面），不支持时降级为 Google TTS Audio 流
 */

/** 语音引擎类型 */
const ENGINE = (() => {
  if (typeof speechSynthesis !== 'undefined') return 'native'
  if (typeof Audio !== 'undefined') return 'youdao-tts'
  return 'none'
})()

let _diagMsg = ENGINE === 'native'
  ? '✅ speechSynthesis（原生）'
  : ENGINE === 'youdao-tts'
    ? '🔊 有道 TTS（降级）'
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

// ===== 有道 TTS 降级方案（国内可访问） =====
let _audio = null
let _audioPlayable = false

function getAudio() {
  if (!_audio) {
    _audio = new Audio()
    _audio.preload = 'auto'
  }
  return _audio
}

function youdaoTtsSpeak(text) {
  const audio = getAudio()
  audio.pause()
  audio.currentTime = 0
  // 有道词典 TTS：level=2 美音，level=1 英音
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=0`
  audio.src = url
  const playPromise = audio.play()
  if (playPromise) {
    playPromise.catch((e) => {
      console.warn('[speech] 有道播放失败:', e.message)
      // 可能需要用户手势，标记重试
      if (e.name === 'NotAllowedError' && !_audioPlayable) {
        // 失败一次后，下次用户手势内应该能播放了
      }
    })
  }
}

// ===== 公开 API =====
export function speak(text, lang = 'en-US', rate = 0.8) {
  if (ENGINE === 'native') {
    nativeSpeak(text, rate)
  } else if (ENGINE === 'youdao-tts') {
    youdaoTtsSpeak(text)
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
  // 有道 TTS: 预热 Audio（首次播放需要用户手势）
  if (ENGINE === 'youdao-tts') {
    const audio = getAudio()
    audio.play().then(() => {
      _audioPlayable = true
      audio.pause()
      audio.currentTime = 0
    }).catch(() => {})
  }
}
