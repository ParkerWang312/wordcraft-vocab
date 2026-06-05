import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_KEY = 'wordcraft_theme'

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem(THEME_KEY)
  const isDark = ref(saved === 'dark')

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  }

  // 初始应用
  applyTheme()

  return { isDark, toggle }
})
