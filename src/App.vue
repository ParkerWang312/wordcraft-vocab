<template>
  <div :class="['app-container', { dark: theme.isDark }]">
    <!-- 主题切换浮钮 -->
    <div class="theme-toggle" @click="theme.toggle">
      <span class="theme-icon">{{ theme.isDark ? '☀️' : '🌙' }}</span>
    </div>
    <router-view />
    <van-tabbar route v-if="showTabbar" :class="{ dark: theme.isDark }">
      <van-tabbar-item to="/" icon="home-o" replace>首页</van-tabbar-item>
      <van-tabbar-item to="/review" icon="replay" replace :badge="store.dueReviewCount || ''">复习</van-tabbar-item>
      <van-tabbar-item to="/wordbook" icon="star-o" replace>生词本</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLearningStore } from './stores/learning.js'
import { useThemeStore } from './stores/theme.js'

const store = useLearningStore()
const theme = useThemeStore()
const route = useRoute()

const showTabbar = computed(() => {
  return ['/', '/review', '/wordbook'].includes(route.path)
})
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

.van-tabbar.dark {
  --van-tabbar-background: var(--bg-card);
}

.page {
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

.theme-toggle {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 999;
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
</style>
