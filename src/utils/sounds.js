/**
 * Web Audio API 音效工具
 * 无需任何外部音频文件
 */
let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

/** 答对 — 清脆双音上行 */
export function playCorrectSound() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime

    // 第一音：880Hz 持续 80ms
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.08)

    // 第二音：1100Hz 持续 100ms
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1100, now + 0.06)
    gain2.gain.setValueAtTime(0.3, now + 0.06)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.18)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.06)
    osc2.stop(now + 0.18)
  } catch {
    // AudioContext not supported, silently ignore
  }
}

/** 答错 — 低沉闷音 */
export function playWrongSound() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2)
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.2)
  } catch {
    // silently ignore
  }
}
