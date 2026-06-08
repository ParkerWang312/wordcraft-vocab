<template>
  <van-action-sheet v-model:show="show" title="设置">
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
        <van-cell title="导出学习数据" center>
          <template #right-icon>
            <van-button size="small" round @click.stop="exportData">导出</van-button>
          </template>
        </van-cell>
        <van-cell title="导入学习数据" center>
          <template #right-icon>
            <van-button size="small" round @click.stop="triggerImport">导入</van-button>
          </template>
        </van-cell>
        <van-cell title="重置学习进度" center>
          <template #right-icon>
            <van-button type="danger" size="small" round @click.stop="confirmReset">重置</van-button>
          </template>
        </van-cell>
      </van-cell-group>
      <van-cell-group title="其它">
        <van-cell title="解锁全部天数" center v-if="isDev">
          <template #right-icon>
            <van-switch v-model="unlockAll" size="22" />
          </template>
        </van-cell>
        <van-cell title="创建测试数据" center v-if="isDev">
          <template #right-icon>
            <van-button size="small" round @click.stop="createTestData">创建</van-button>
          </template>
        </van-cell>
        <van-cell title="创建测试数据A(3天)" center v-if="isDev">
          <template #right-icon>
            <van-button size="small" round @click.stop="createTestDataA">创建</van-button>
          </template>
        </van-cell>
        <van-cell title="提交反馈" center>
          <template #right-icon>
            <van-button type="warning" size="small" round @click.stop="openFeedback">反馈</van-button>
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
        <textarea v-model="feedbackBody" class="feedback-textarea" rows="4" placeholder="例如：希望增加夜间模式开关..."></textarea>
      </div>
      <div class="feedback-dialog-field">
        <div class="feedback-dialog-label">使用设备</div>
        <div class="device-select">
          <span v-for="d in devices" :key="d.value" :class="['device-option', { active: feedbackDevice === d.value }]" @click="feedbackDevice = d.value">{{ d.label }}</span>
        </div>
      </div>
      <div class="feedback-dialog-field">
        <div class="feedback-dialog-label">昵称（选填）</div>
        <input v-model="feedbackNick" class="feedback-input" placeholder="怎么称呼你？" />
      </div>
      <div class="feedback-dialog-actions">
        <van-button class="feedback-submit-btn" round size="large" color="#F59E0B" @click="submitFeedback">发送建议</van-button>
        <van-button class="feedback-later-btn" round size="large" plain @click="showFeedback = false">稍后再说</van-button>
      </div>
    </div>
  </van-overlay>

  <input ref="importInput" type="file" accept=".json" style="display:none" @change="importData" />
</template>

<script setup>
import { ref, inject, computed } from 'vue'
import { useLearningStore, generateWordId } from '../stores/learning.js'
import { useSettingsStore } from '../stores/settings.js'
import { showDialog, showToast } from 'vant'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show'])

const store = useLearningStore()
const settingsStore = useSettingsStore()
const unlockAll = inject('unlockAll')
const isDev = new URLSearchParams(window.location.search).has('dev')

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
const importInput = ref(null)
const devices = [
  { label: '📱 手机', value: '手机' },
  { label: '📋 平板', value: '平板' },
  { label: '💻 电脑', value: '电脑' }
]

const show = computed({
  get: () => props.show,
  set: (v) => emit('update:show', v)
})

function exportData() {
  show.value = false
  const data = {
    wordcraft_vocab: localStorage.getItem('wordcraft_vocab'),
    wordcraft_settings: localStorage.getItem('wordcraft_settings'),
    wordcraft_theme: localStorage.getItem('wordcraft_theme'),
    wordcraft_review_progress: localStorage.getItem('wordcraft_review_progress'),
    exportedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wordcraft-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('导出成功')
}

function triggerImport() {
  show.value = false
  importInput.value?.click()
}

async function importData(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (data.wordcraft_vocab) localStorage.setItem('wordcraft_vocab', data.wordcraft_vocab)
    if (data.wordcraft_settings) localStorage.setItem('wordcraft_settings', data.wordcraft_settings)
    if (data.wordcraft_theme) localStorage.setItem('wordcraft_theme', data.wordcraft_theme)
    if (data.wordcraft_review_progress) localStorage.setItem('wordcraft_review_progress', data.wordcraft_review_progress)
    showDialog({ title: '✅ 导入成功', message: '数据已加载，即将刷新页面。' }).then(() => window.location.reload())
  } catch {
    showToast('文件格式不正确')
  }
  e.target.value = ''
}

function confirmReset() {
  show.value = false
  showDialog({
    title: '⚠️ 重置进度',
    message: '确认清除所有学习记录、复习进度和错题本？此操作不可撤销。',
    confirmButtonText: '取消', cancelButtonText: '确认重置',
    cancelButtonColor: '#EF4444', showCancelButton: true
  }).catch(() => {
    localStorage.removeItem('wordcraft_vocab')
    localStorage.removeItem('wordcraft_settings')
    localStorage.removeItem('wordcraft_review_progress')
    window.location.reload()
  })
}

function createTestData() {
  show.value = false
  const day1Words = store.getDayWords(1)
  const wordStates = {}
  const wrongWords = {}
  const idCount = {}
  const indices = day1Words.map((_, i) => i)
  const shuffled = [...indices].sort(() => Math.random() - 0.5)
  const wrongSet = new Set(shuffled.slice(0, 10))
  const bookSet = new Set(shuffled.slice(5, 13))
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0)
  day1Words.forEach((w, i) => {
    let id = generateWordId(w)
    idCount[id] = (idCount[id] || 0) + 1
    if (idCount[id] > 1) id = id + '_' + idCount[id]
    const isWrong = wrongSet.has(i)
    wordStates[id] = {
      wordId: id, status: isWrong ? 'learning' : 'known',
      learnedAt: yesterday.toISOString(), reviewCount: 0,
      nextReviewAt: yesterday.toISOString(), easeFactor: 2.5,
      interval: isWrong ? 0 : 1, inWordBook: bookSet.has(i)
    }
    if (isWrong) wrongWords[id] = { wrongCount: 1, lastWrongAt: yesterday.toISOString() }
  })
  const testState = {
    currentDay: 2, completedDays: [1], streakDays: 1, lastStudyDate: yesterday.toDateString(),
    wordStates, wrongWords, dayProgress: {},
    stats: { totalLearned: 58, totalReviewed: 0, totalMastered: 0 }
  }
  localStorage.setItem('wordcraft_vocab', JSON.stringify(testState))
  window.location.reload()
}

function createTestDataA() {
  show.value = false
  const day1Words = store.getDayWords(1)
  const day2Words = store.getDayWords(2)
  const day3Words = store.getDayWords(3)
  const wordStates = {}, wrongWords = {}, idCount = {}
  const today = new Date()
  const d1 = new Date(today); d1.setDate(d1.getDate()-3); d1.setHours(0,0,0,0)
  const d2 = new Date(today); d2.setDate(d2.getDate()-2); d2.setHours(0,0,0,0)
  const dY = new Date(today); dY.setDate(dY.getDate()-1); dY.setHours(0,0,0,0)
  const dT = new Date(today); dT.setHours(0,0,0,0)
  // Day1: 15 错题（与到期词重叠），8 生词本
  const sh1 = day1Words.map((_,i)=>i).sort(()=>Math.random()-0.5)
  const wrongSet = new Set(sh1.slice(0,15)); const bookSet = new Set(sh1.slice(5,13))
  day1Words.forEach((w,i) => {
    let id = generateWordId(w)
    idCount[id] = (idCount[id]||0)+1
    if (idCount[id]>1) id = id+'_'+idCount[id]
    const isW = wrongSet.has(i)
    wordStates[id] = {
      wordId: id, learnedAt: d1.toISOString(), reviewCount: 1, easeFactor: 2.5, inWordBook: bookSet.has(i),
      ...(isW ? { status:'learning', interval:0, nextReviewAt:d1.toISOString() }
        : i<30 ? { status:'known', interval:3, nextReviewAt:dT.toISOString() }
        : { status:'known', interval:1, nextReviewAt:dY.toISOString() })
    }
    if (isW) wrongWords[id] = { wrongCount:1, lastWrongAt:d1.toISOString() }
  })
  // Day2: 全部到期
  const idCount2 = {}
  day2Words.forEach((w,i) => {
    let id = generateWordId(w)
    idCount2[id] = (idCount2[id]||0)+1
    if (idCount2[id]>1) id = id+'_'+idCount2[id]
    wordStates[id] = { wordId:id, status:'known', learnedAt:d2.toISOString(), reviewCount:0, easeFactor:2.5, interval:1, nextReviewAt:dY.toISOString(), inWordBook: i<8 }
  })
  // Day3: 15 错题（未学习，无 SM-2 状态 → 不在到期词列表 → 主线复习中排最前面）
  day3Words.slice(0, 15).forEach(w => {
    const id = generateWordId(w)
    wrongWords[id] = { wrongCount:1, lastWrongAt:dY.toISOString() }
  })
  localStorage.setItem('wordcraft_vocab', JSON.stringify({
    currentDay:3, completedDays:[1,2], streakDays:3, lastStudyDate:today.toDateString(),
    wordStates, wrongWords, dayProgress:{}, stats:{ totalLearned:116, totalReviewed:58, totalMastered:0 }
  }))
  window.location.reload()
}

function openFeedback() {
  show.value = false
  setTimeout(() => { showFeedback.value = true }, 200)
}

async function submitFeedback() {
  if (!feedbackBody.value.trim()) {
    showToast('请填写反馈内容'); return
  }
  try {
    const payload = {
      body: feedbackBody.value, device: feedbackDevice.value,
      nick: feedbackNick.value.trim() || '匿名用户',
      time: new Date().toLocaleString('zh-CN')
    }
    const res = await fetch('https://wordcraft-feedback.ksjbm.com/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    if (res.ok) {
      showFeedback.value = false; showToast('感谢反馈！')
      feedbackBody.value = ''; feedbackNick.value = ''; feedbackDevice.value = detectDevice()
    } else { showToast('提交失败，请稍后再试') }
  } catch { showToast('网络错误，请稍后再试') }
}
</script>

<style scoped>
.settings-content { padding: 8px 0 16px; }

.feedback-dialog {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 88vw; max-width: 380px; background: var(--bg-card); border-radius: 16px;
  padding: 24px 20px 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.2);
}
.feedback-dialog-title { text-align: center; font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.feedback-dialog-subtitle { text-align: center; font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; }
.feedback-dialog-field { margin-bottom: 14px; }
.feedback-dialog-label { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.feedback-textarea {
  width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg-primary); color: var(--text-primary); font-size: 14px;
  font-family: inherit; resize: vertical; outline: none;
}
.feedback-textarea:focus { border-color: var(--accent); }
.feedback-input {
  width: 100%; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg-primary); color: var(--text-primary); font-size: 14px; font-family: inherit; outline: none;
}
.feedback-input:focus { border-color: var(--accent); }
.device-select { display: flex; gap: 8px; }
.device-option {
  flex: 1; text-align: center; padding: 8px 4px; border-radius: 10px; border: 1px solid var(--border);
  font-size: 12px; cursor: pointer; color: var(--text-secondary); background: var(--bg-primary); transition: all 0.2s;
}
.device-option.active { border-color: #F59E0B; background: #FFF8E7; color: #B45309; font-weight: 600; }
[data-theme="dark"] .device-option.active { background: #3B2A00; color: #FBBF24; border-color: #F59E0B; }
.feedback-dialog-actions { display: flex; gap: 10px; margin-top: 18px; }
.feedback-submit-btn { flex: 3; }
.feedback-later-btn { flex: 2; color: var(--text-secondary) !important; border-color: var(--border) !important; }
</style>
