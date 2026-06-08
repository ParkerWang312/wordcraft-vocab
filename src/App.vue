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
          <van-cell title="提交反馈" center>
            <template #right-icon>
              <van-button type="warning" size="small" round @click.stop="openFeedback">反馈</van-button>
            </template>
          </van-cell>
          <van-cell title="重置学习进度" center>
            <template #right-icon>
              <van-button type="danger" size="small" round @click.stop="confirmReset">重置</van-button>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-action-sheet>

    <!-- 反馈弹窗 -->
    <van-overlay :show="showFeedback" @click="showFeedback = false">
      <div class="feedback-dialog" @click.stop>
        <div class="feedback-dialog-title">建议反馈</div>
        <div class="feedback-dialog-subtitle">把你的想法直接发给我</div>
        <div class="feedback-dialog-field">
          <div class="feedback-dialog-label">你的想法</div>
          <textarea
            v-model="feedbackBody"
            class="feedback-textarea"
            rows="4"
            placeholder="例如：希望增加夜间模式开关..."
          ></textarea>
        </div>
        <div class="feedback-dialog-field">
          <div class="feedback-dialog-label">使用设备</div>
          <div class="device-select">
            <span
              v-for="d in devices"
              :key="d.value"
              :class="['device-option', { active: feedbackDevice === d.value }]"
              @click="feedbackDevice = d.value"
            >{{ d.label }}</span>
          </div>
        </div>
        <div class="feedback-dialog-field">
          <div class="feedback-dialog-label">昵称（选填）</div>
          <input
            v-model="feedbackNick"
            class="feedback-input"
            placeholder="怎么称呼你？"
          />
        </div>
        <div class="feedback-dialog-actions">
          <van-button class="feedback-submit-btn" round size="large" color="#F59E0B" @click="submitFeedback">发送建议</van-button>
          <van-button class="feedback-later-btn" round size="large" plain @click="showFeedback = false">稍后再说</van-button>
        </div>
      </div>
    </van-overlay>
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
import { showDialog, showToast } from 'vant'

const store = useLearningStore()
const theme = useThemeStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const showSettings = ref(false)
const showFeedback = ref(false)
const feedbackBody = ref('')

function detectDevice() {
  const ua = navigator.userAgent
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return '平板'
  if (/Mobile|Android/i.test(ua)) return '手机'
  return '电脑'
}

const feedbackDevice = ref(detectDevice())
const feedbackNick = ref('')
const devices = [
  { label: '📱 手机', value: '手机' },
  { label: '📋 平板', value: '平板' },
  { label: '💻 电脑', value: '电脑' }
]

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

function openFeedback() {
  showSettings.value = false
  setTimeout(() => { showFeedback.value = true }, 200)
}

async function submitFeedback() {
  if (!feedbackBody.value.trim()) {
    showToast('请填写反馈内容')
    return
  }
  try {
    const payload = {
      body: feedbackBody.value,
      device: feedbackDevice.value,
      nick: feedbackNick.value.trim() || '匿名用户',
      time: new Date().toLocaleString('zh-CN')
    }
    const res = await fetch('https://wordcraft-feedback.ksjbm.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      showFeedback.value = false
      showToast('感谢反馈！')
      feedbackBody.value = ''
      feedbackNick.value = ''
      feedbackDevice.value = detectDevice()
    } else {
      showToast('提交失败，请稍后再试')
    }
  } catch {
    showToast('网络错误，请稍后再试')
  }
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
  border-top: none !important;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
}

.van-tabbar-item {
  color: var(--text-secondary) !important;
}

.van-tabbar-item--active {
  color: var(--accent) !important;
  background: var(--accent-light);
  border-radius: 12px;
  margin: 4px 8px;
}

[data-theme="dark"] .van-tabbar-item--active {
  background: rgba(129,140,248,0.15);
}

.van-tabbar.dark {
  --van-tabbar-background: var(--bg-card);
}

.feedback-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 88vw;
  max-width: 380px;
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px 20px 20px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
}

.feedback-dialog-title {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.feedback-dialog-subtitle {
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.feedback-dialog-field {
  margin-bottom: 14px;
}

.feedback-dialog-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.feedback-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.feedback-textarea:focus {
  border-color: var(--accent);
}

.feedback-input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.feedback-input:focus {
  border-color: var(--accent);
}

.device-select {
  display: flex;
  gap: 8px;
}

.device-option {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 12px;
  cursor: pointer;
  color: var(--text-secondary);
  background: var(--bg-primary);
  transition: all 0.2s;
}

.device-option.active {
  border-color: #F59E0B;
  background: #FFF8E7;
  color: #B45309;
  font-weight: 600;
}

[data-theme="dark"] .device-option.active {
  background: #3B2A00;
  color: #FBBF24;
  border-color: #F59E0B;
}

.feedback-dialog-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.feedback-submit-btn {
  flex: 3;
}

.feedback-later-btn {
  flex: 2;
  color: var(--text-secondary) !important;
  border-color: var(--border) !important;
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
