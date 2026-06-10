import { defineStore } from 'pinia'
import { ref } from 'vue'

const SETTINGS_KEY = 'wordcraft_settings'

const defaults = {
  showWordOnBack: true,
  showPhoneticOnBack: false,
  autoAdvance: false,
  speakOnFlip: true,
  forcePractice: true,
  nickname: ''
}

function load() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) return { ...defaults, ...JSON.parse(saved) }
  } catch {}
  return { ...defaults }
}

export const useSettingsStore = defineStore('settings', () => {
  const data = ref(load())

  function persist() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.value))
  }

  function toggleShowWordOnBack() {
    data.value.showWordOnBack = !data.value.showWordOnBack
    persist()
  }

  function toggleShowPhoneticOnBack() {
    data.value.showPhoneticOnBack = !data.value.showPhoneticOnBack
    persist()
  }

  function persistDirect() {
    persist()
  }

  return { data, toggleShowWordOnBack, toggleShowPhoneticOnBack, persistDirect }
})
