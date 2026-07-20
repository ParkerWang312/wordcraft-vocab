/**
 * Web Audio API 音效工具 — 百词斩风格
 * 无需任何外部音频文件
 */
let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // 恢复被浏览器暂停的 AudioContext
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(ctx, freq, start, duration, type = 'sine', gain = 0.4) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.01)
}

/** 答对 — 明亮三音上行琶音 ✨ */
export function playCorrectSound() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime

    // C5 → E5 → G5 (523→659→784) 大三和弦上行
    playTone(ctx, 523, now,        0.15, 'triangle', 0.7)
    playTone(ctx, 659, now + 0.08, 0.15, 'triangle', 0.7)
    playTone(ctx, 784, now + 0.16, 0.22, 'triangle', 0.75)

    // 叠加高音泛音增加清脆感
    playTone(ctx, 1047, now + 0.14, 0.18, 'sine', 0.25)

    // 顶部叮叮声
    playTone(ctx, 1319, now + 0.20, 0.12, 'sine', 0.18)
  } catch { /* ignore */ }
}

/** 答错 — 低沉闷音 ❌ */
export function playWrongSound() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime

    // 低频闷响 150Hz 方形波 + 200Hz 不和谐
    playTone(ctx, 150, now, 0.35, 'sawtooth', 0.45)
    playTone(ctx, 220, now, 0.35, 'square', 0.25)

    // 噪声垫底
    const bufferSize = ctx.sampleRate * 0.15
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.1, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    noise.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.25)
  } catch { /* ignore */ }
}
