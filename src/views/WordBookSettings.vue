<template>
  <div class="page wb-settings-page">
    <van-nav-bar
      :title="book?.name || '设置'"
      left-arrow
      @click-left="$router.back()"
      :fixed="false"
    />

    <div class="section" v-if="book">
      <!-- 名称（仅用户单词本） -->
      <van-cell-group title="基本信息" v-if="book.type === 'user'">
        <van-field
          v-model="editName"
          label="名称"
          :placeholder="book.name"
          maxlength="20"
          @blur="saveName"
        />
      </van-cell-group>

      <!-- 练习设置 -->
      <van-cell-group title="练习设置">
        <div class="stepper-cell">
          <span class="stepper-label">每次练习单词数</span>
          <van-stepper
            v-model="wordsPerSession"
            :min="5"
            :max="50"
            :step="5"
            @change="saveWordsPerSession"
          />
        </div>
      </van-cell-group>

      <!-- 每日学习报告 -->
      <van-cell-group title="学习报告">
        <van-cell
          title="📊 生成今日学习报告"
          is-link
          @click="generateReport"
        />
        <div class="cell-hint">基于今日练习数据生成可分享的报告图片</div>
      </van-cell-group>

      <!-- 数据管理 -->
      <van-cell-group title="数据管理">
        <van-cell
          title="📥 导出单词本"
          is-link
          @click="exportBook"
        />
        <div class="cell-hint">导出为 JSON 文件，可用于备份或迁移</div>
      </van-cell-group>

      <!-- 删除（仅用户单词本） -->
      <div class="danger-section" v-if="book.type === 'user'">
        <van-button round block type="danger" @click="confirmDelete">
          删除整个单词本
        </van-button>
        <div class="cell-hint">此操作不可恢复，所有单词将被删除</div>
      </div>

      <!-- 重置学习（所有单词本） -->
      <div class="danger-section">
        <van-button round block plain type="danger" @click="confirmReset">
          重置学习进度
        </van-button>
        <div class="cell-hint">将所有单词设为未学，重新从第1轮开始</div>
      </div>
    </div>

    <!-- 报告弹窗 -->
    <van-dialog
      v-model:show="reportShow"
      :title="reportTitle"
      :show-cancel-button="reportData && !reportData.isEmpty"
      :cancel-button-text="'关闭'"
      :confirm-button-text="reportData && !reportData.isEmpty ? '分享' : '关闭'"
      :show-confirm-button="true"
      @confirm="shareReport"
    >
      <div class="report-preview" v-if="reportData">
        <div class="report-empty" v-if="reportData.isEmpty">
          <p>今日暂无练习记录</p>
          <p class="report-hint">完成一次练习后再来生成报告吧</p>
        </div>
        <div class="report-content" v-else>
          <div class="report-stat">
            <span class="report-val">{{ reportData.totalSessions }}</span>
            <span class="report-lab">练习次数</span>
          </div>
          <div class="report-stat">
            <span class="report-val c-green">{{ reportData.accuracy }}%</span>
            <span class="report-lab">正确率</span>
          </div>
          <div class="report-stat">
            <span class="report-val">{{ reportData.totalCorrect }}</span>
            <span class="report-lab">正确题数</span>
          </div>
          <div class="report-stat">
            <span class="report-val c-red">{{ reportData.totalWrong }}</span>
            <span class="report-lab">错误题数</span>
          </div>
          <div class="report-stat">
            <span class="report-val">{{ formatDuration(reportData.totalDuration) }}</span>
            <span class="report-lab">练习时长</span>
          </div>
          <div class="report-stat">
            <span class="report-val c-orange">{{ reportData.round }}</span>
            <span class="report-lab">当前轮次</span>
          </div>

          <div class="report-wrong-words" v-if="reportData.topWrongWords.length > 0">
            <div class="rw-title">❌ 易错单词 TOP 5</div>
            <div class="rw-item" v-for="(w, i) in reportData.topWrongWords" :key="i">
              <span class="rw-idx">{{ i + 1 }}</span>
              <span class="rw-word">{{ w.word }}</span>
              <span class="rw-meaning">{{ w.meaning }}</span>
              <span class="rw-count">×{{ w.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWordbookStore } from '../stores/wordbook.js'
import { drawWordbookReport } from '../composables/useWordbookReport.js'
import { showToast, showConfirmDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useWordbookStore()

const id = computed(() => route.params.id)
const book = computed(() => store.getBook(id.value))

const editName = ref('')
const wordsPerSession = ref(20)
const reportShow = ref(false)
const reportData = ref(null)
const reportTitle = ref('')

// 初始化设置值
if (book.value) {
  editName.value = book.value.name || ''
  wordsPerSession.value = book.value.settings?.wordsPerSession || 20
}

function saveName() {
  if (!book.value || book.value.type !== 'user') return
  const trimmed = editName.value.trim()
  if (trimmed && trimmed !== book.value.name) {
    store.updateWordBook(id.value, { name: trimmed })
    showToast('已保存')
  }
}

function saveWordsPerSession() {
  store.updateSettings(id.value, { wordsPerSession: wordsPerSession.value })
  showToast(`已设为 ${wordsPerSession.value} 词/次`)
}

function generateReport() {
  reportTitle.value = `《${book.value?.name}》每日报告`
  reportData.value = store.generateReportData(id.value)
  reportShow.value = true
}

async function shareReport() {
  if (!reportData.value || reportData.value.isEmpty) {
    reportShow.value = false
    return
  }

  try {
    const blob = await drawWordbookReport(reportData.value)
    const file = new File([blob], `${reportData.value.bookName}-每日报告.png`, { type: 'image/png' })

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `${reportData.value.bookName} 每日学习报告`,
        files: [file]
      })
    } else {
      // Fallback: download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportData.value.bookName}-每日报告.png`
      a.click()
      URL.revokeObjectURL(url)
      showToast('已保存到下载')
    }
  } catch {
    // 分享失败，降级为下载
    try {
      const blob = await drawWordbookReport(reportData.value)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportData.value.bookName}-每日报告.png`
      a.click()
      URL.revokeObjectURL(url)
      showToast('已保存到下载')
    } catch {
      showToast('生成报告失败')
    }
  }
  reportShow.value = false
}

function exportBook() {
  const words = store.getWordsByBookId(id.value)
  const data = {
    book: book.value,
    words: words.map(w => ({
      word: w.word,
      meaning: w.meaning,
      phonetic: w.phonetic
    }))
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${book.value?.name || '单词本'}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('导出成功')
}

function confirmDelete() {
  const bookName = book.value?.name || ''
  showConfirmDialog({
    title: '删除单词本',
    message: `确定删除「${bookName}」吗？\n所有单词将被永久删除。`,
    confirmButtonColor: '#EF4444'
  }).then(() => {
    store.deleteWordBook(id.value)
    showToast('已删除')
    router.replace('/wordbooks')
  }).catch(() => {})
}

function confirmReset() {
  showConfirmDialog({
    title: '重置学习进度',
    message: '所有单词将标记为未学，重新从第1轮开始。',
    confirmButtonColor: '#EF4444'
  }).then(() => {
    store.resetAllLearned(id.value)
    showToast('已重置')
  }).catch(() => {})
}

function formatDuration(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}分${sec}秒`
  return `${sec}秒`
}
</script>

<style scoped>
.wb-settings-page {
  padding-bottom: 80px;
}

.section {
  margin-bottom: 8px;
}

.stepper-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-card);
}

.stepper-label {
  font-size: 14px;
  color: var(--text-primary);
}

.cell-hint {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 16px 12px;
}

.danger-section {
  padding: 20px 16px;
  text-align: center;
}

.report-preview {
  padding: 16px 20px;
}

.report-empty {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}

.report-hint {
  font-size: 13px;
  margin-top: 8px;
  color: var(--text-secondary);
}

.report-content {
  display: flex;
  flex-wrap: wrap;
}

.report-stat {
  width: 33.33%;
  text-align: center;
  padding: 8px 0;
}

.report-val {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
}

.report-val.c-green { color: #10B981; }
.report-val.c-red { color: #EF4444; }
.report-val.c-orange { color: #F59E0B; }

.report-lab {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.report-wrong-words {
  width: 100%;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.rw-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.rw-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
}

.rw-idx {
  width: 20px;
  color: var(--text-secondary);
  font-weight: 600;
}

.rw-word {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 80px;
}

.rw-meaning {
  flex: 1;
  color: var(--text-secondary);
}

.rw-count {
  color: #EF4444;
  font-weight: 600;
}
</style>
