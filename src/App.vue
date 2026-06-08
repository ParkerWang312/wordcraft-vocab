<template>
  <div :class="['app-container', { dark: theme.isDark }]">
    <!-- 主题切换浮钮（仅首页显示） -->
    <div class="top-buttons" v-if="showTopButtons">
      <div class="theme-toggle" @click="theme.toggle">
        <span class="theme-icon">{{ theme.isDark ? '☀️' : '🌙' }}</span>
      </div>
      <div class="theme-toggle" @click="showSettings = true">
        <span class="theme-icon">⚙️</span>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <van-action-sheet v-model:show="showSettings" title="设置">
      <div class="settings-content">
        <van-cell-group title="单词卡片">
          <van-cell title="翻转卡片显示单词" center>
            <template #right-icon>
              <van-switch v-model="settingsStore.data.showWordOnBack" @change="settingsStore.persistDirect" size="22" />
            </template>
          </van-cell>
          <van-cell title="翻转卡片显示音标和读音" center>
            <template #right-icon>
              <van-switch v-model="settingsStore.data.showPhoneticOnBack" @change="settingsStore.persistDirect" size="22" />
            </template>
          </van-cell>
          <van-cell title="翻转卡片自动发音" center>
            <template #right-icon>
              <van-switch v-model="settingsStore.data.speakOnFlip" @change="settingsStore.persistDirect" size="22" />
            </template>
          </van-cell>
        </van-cell-group>
        <van-cell-group title="练习模式">
          <van-cell title="答对自动跳下一题" center>
            <template #right-icon>
              <van-switch v-model="settingsStore.data.autoAdvance" @change="settingsStore.persistDirect" size="22" />
            </template>
          </van-cell>
        </van-cell-group>
        <van-cell-group title="通用">
          <van-cell title="重置学习进度" center>
            <template #right-icon>
              <van-button type="danger" size="small" round @click.stop="confirmReset">重置</van-button>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-action-sheet>
    <router-view />
    <van-tabbar route v-if="showTabbar" :class="{ dark: theme.isDark }">
      <van-tabbar-item to="/" icon="home-o" replace>首页</van-tabbar-item>
      <van-tabbar-item to="/review" icon="replay" replace :badge="store.dueReviewCount || ''">复习</van-tabbar-item>
      <van-tabbar-item to="/wordbook" icon="star-o" replace>生词本</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLearningStore } from './stores/learning.js'
import { useThemeStore } from './stores/theme.js'
import { useSettingsStore } from './stores/settings.js'
import { showDialog } from 'vant'

const store = useLearningStore()
const theme = useThemeStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const showSettings = ref(false)

const showTabbar = computed(() => {
  return ['/', '/review', '/wordbook'].includes(route.path)
})

const showTopButtons = computed(() => route.path === '/')

function confirmReset() {
  showSettings.value = false
  showDialog({
    title: '⚠️ 重置进度',
    message: '确认清除所有学习记录、复习进度和错题本？此操作不可撤销。',
    confirmButtonText: '取消',
    cancelButtonText: '确认重置',
    cancelButtonColor: '#EF4444',
    showCancelButton: true
  }).catch(() => {
    localStorage.removeItem('wordcraft_vocab')
    localStorage.removeItem('wordcraft_settings')
    window.location.reload()
  })
}
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

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

.van-button {
  font-weight: 600 !important;
  letter-spacing: 0.5px;
}

.van-button--large {
  height: 46px !important;
  font-size: 16px !important;
}

.app-container {
  min-height: 100vh;
  padding-bottom: 55px;
  background: var(--bg-primary);
  transition: background 0.3s, color 0.3s;
}

.van-tabbar {
  background: var(--bg-card) !important;
  border-top: 1px solid var(--border) !important;
}

.van-tabbar-item {
  color: var(--text-secondary) !important;
}

.van-tabbar-item--active {
  color: var(--accent) !important;
}

.van-tabbar.dark {
  --van-tabbar-background: var(--bg-card);
}

.van-nav-bar {
  margin: 12px 12px 0;
  border-radius: 14px !important;
  background: var(--bg-card) !important;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.van-nav-bar::after {
  border-color: transparent !important;
}

.van-nav-bar__title {
  color: var(--text-primary) !important;
}

.van-nav-bar .van-icon {
  color: var(--accent) !important;
}

[data-theme="dark"] .van-nav-bar {
  background: var(--bg-card) !important;
}

.page {
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

.top-buttons {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 999;
  display: flex;
  gap: 8px;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, background 0.3s;
}

.theme-toggle:active {
  transform: scale(0.9);
}

.theme-icon {
  font-size: 18px;
  line-height: 1;
}

.settings-content {
  padding: 8px 0 16px;
}
</style>
