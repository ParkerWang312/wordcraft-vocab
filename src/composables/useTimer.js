import { ref, onUnmounted } from 'vue'

export function useTimer() {
  const elapsed = ref(0)
  let timer = null

  timer = setInterval(() => {
    elapsed.value++
  }, 1000)

  onUnmounted(() => {
    clearInterval(timer)
  })

  return { elapsed }
}

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}
