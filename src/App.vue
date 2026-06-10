<template>
  <div :class="['app-container', { dark: theme.isDark }]">
    <SettingsPanel v-model:show="showSettings" />
    <router-view />

    <van-tabbar route v-if="showTabbar" :class="{ dark: theme.isDark }">
      <van-tabbar-item to="/" icon="home-o" replace>首页</van-tabbar-item>
      <van-tabbar-item to="/review" icon="replay" replace :badge="store.dueReviewCount || ''">复习</van-tabbar-item>
      <van-tabbar-item to="/wordbook" icon="star-o" replace>生词本</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, provide, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLearningStore } from './stores/learning.js'
import { useThemeStore } from './stores/theme.js'
import SettingsPanel from './components/SettingsPanel.vue'
import { warmUpSpeech, diagnose, testSpeak } from './utils/speech.js'

// 暴露到全局方便 Android 远程调试
window.__speechDebug = { diagnose, testSpeak, warmUp: warmUpSpeech }

const store = useLearningStore()
const theme = useThemeStore()
const route = useRoute()
const showSettings = ref(false)

// Android 语音预热：首次触摸屏幕时激活 speechSynthesis
onMounted(() => {
  const handler = () => {
    warmUpSpeech()
    document.removeEventListener('touchstart', handler)
    document.removeEventListener('click', handler)
  }
  document.addEventListener('touchstart', handler, { once: false })
  document.addEventListener('click', handler)
})

const isDev = new URLSearchParams(window.location.search).has('dev')
const unlockAll = ref(false)
provide('unlockAll', unlockAll)
provide('openSettings', () => { showSettings.value = true })

const showTabbar = computed(() => ['/', '/review', '/wordbook'].includes(route.path))
</script>

<style>
:root {
  --bg-primary: #F5F7FA;
  --bg-card: #FFFFFF;
  --text-primary: #1A1A2E;
  --text-secondary: #6B7280;
  --accent: #4F46E5;
  --accent-light: #EEF2FF;
  --success: #10B981;
  --warning: #F59E0B;
  --danger: #EF4444;
  --border: #E5E7EB;
  --shadow: 0 2px 12px rgba(0,0,0,0.06);
}

[data-theme="dark"] {
  --bg-primary: #1A1A2E;
  --bg-card: #252540;
  --text-primary: #E5E7EB;
  --text-secondary: #9CA3AF;
  --accent: #818CF8;
  --accent-light: #1E1B4B;
  --success: #34D399;
  --warning: #FBBF24;
  --danger: #F87171;
  --border: #374151;
  --shadow: 0 2px 12px rgba(0,0,0,0.3);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary); color: var(--text-primary); -webkit-font-smoothing: antialiased;
}

.van-button { font-weight: 600 !important; letter-spacing: 0.5px; }
.van-button--large { height: 46px !important; font-size: 16px !important; }
.app-container { min-height: 100vh; padding-bottom: 55px; background: var(--bg-primary); transition: background 0.3s, color 0.3s; }

.van-tabbar { background: var(--bg-card) !important; border-top: none !important; box-shadow: 0 -2px 12px rgba(0,0,0,0.08); }
.van-tabbar-item { color: var(--text-secondary) !important; }
.van-tabbar-item--active { color: var(--accent) !important; background: var(--accent-light); border-radius: 12px; margin: 4px 8px; }
[data-theme="dark"] .van-tabbar-item--active { background: rgba(129,140,248,0.15); }
.van-tabbar.dark { --van-tabbar-background: var(--bg-card); }

.van-nav-bar { margin: 12px 12px 0; border-radius: 14px !important; background: var(--bg-card) !important; box-shadow: var(--shadow); overflow: hidden; }
.van-nav-bar::after { border-color: transparent !important; }
.van-nav-bar__title { color: var(--text-primary) !important; }
.van-nav-bar .van-icon { color: var(--accent) !important; }
[data-theme="dark"] .van-nav-bar { background: var(--bg-card) !important; }
[data-theme="dark"] .van-popup { background: var(--bg-card) !important; color: var(--text-primary) !important; }
[data-theme="dark"] .van-popup--bottom { background: var(--bg-card) !important; }
[data-theme="dark"] .van-action-sheet { background: var(--bg-card) !important; }
[data-theme="dark"] .van-action-sheet__header,
[data-theme="dark"] .van-action-sheet__content { background: var(--bg-card) !important; color: var(--text-primary) !important; }
[data-theme="dark"] .van-cell-group__title { color: var(--text-secondary) !important; }
[data-theme="dark"] .van-cell { background: var(--bg-card) !important; color: var(--text-primary) !important; }
[data-theme="dark"] .van-cell__title { color: var(--text-primary) !important; }
[data-theme="dark"] .van-cell__value { color: var(--text-secondary) !important; }
[data-theme="dark"] .van-field__label { color: var(--text-primary) !important; }
[data-theme="dark"] .van-field__control { color: var(--text-primary) !important; background: var(--bg-primary) !important; }
[data-theme="dark"] .van-dialog { background: var(--bg-card) !important; }
[data-theme="dark"] .van-dialog__header,
[data-theme="dark"] .van-dialog__message { color: var(--text-primary) !important; }
[data-theme="dark"] .van-button--plain.van-button--primary { color: var(--accent) !important; border-color: var(--accent) !important; background: transparent !important; }
[data-theme="dark"] .van-button--default.van-button--plain { color: var(--text-secondary) !important; border-color: var(--border) !important; }
.page { padding: 16px; max-width: 480px; margin: 0 auto; }

.top-buttons { position: fixed; top: 12px; right: 12px; z-index: 999; display: flex; gap: 8px; }
.theme-toggle { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border); box-shadow: var(--shadow); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s, background 0.3s; }
.theme-toggle:active { transform: scale(0.9); }
.theme-icon { font-size: 18px; line-height: 1; }
</style>
