<template>
  <div class="page wb-detail-page">
    <van-nav-bar
      :title="book?.name || '单词本'"
      left-arrow
      @click-left="$router.push('/wordbooks')"
      :fixed="false"
    >
      <template #right>
        <van-icon v-if="book?.type === 'user'" name="plus" size="20" style="margin-right:16px" @click="showBatchDialog" />
        <van-icon name="chart-trending-o" size="20" style="margin-right:16px" @click="showDashboard = true" />
        <van-icon name="setting-o" size="20" @click="goSettings" />
      </template>
    </van-nav-bar>

    <!-- 统计栏 -->
    <div class="stat-bar" v-if="book">
      <div class="stat-item">
        <span class="stat-num">{{ words.length }}</span>
        <span class="stat-label">总词数</span>
      </div>
      <div class="stat-item">
        <span class="stat-num c-green">{{ learnedCount }}</span>
        <span class="stat-label">本轮已学</span>
      </div>
      <div class="stat-item">
        <span class="stat-num c-orange">{{ (book.practiceRound || 0) + 1 }}</span>
        <span class="stat-label">当前轮次</span>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar" v-if="words.length > 0">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-row" :class="{ 'action-row-double': book?.settings?.dictationEnabled }">
      <van-button
        type="primary"
        round
        size="large"
        :block="!book?.settings?.dictationEnabled"
        :disabled="words.length === 0"
        @click="goPractice"
      >
        开始练习
      </van-button>
      <van-button
        v-if="book?.settings?.dictationEnabled"
        type="warning"
        round
        size="large"
        :disabled="!dictationAvailable"
        @click="goDictation"
      >
        {{ dictationAvailable ? '开始默写' : '练习完再默写' }}
      </van-button>
    </div>

    <!-- 单词列表 -->
    <div class="word-list" v-if="words.length > 0">
      <div class="word-card" v-for="entry in words" :key="entry.id">
        <div class="word-card-content" @click="speakWord(entry.word)">
          <div class="word-main">
            <span class="word-en">{{ entry.word }}</span>
            <span class="word-phonetic" v-if="entry.phonetic">{{ entry.phonetic }}</span>
            <span class="word-speak-btn">🔊</span>
            <span class="word-learned" v-if="entry.learned">✓</span>
          </div>
          <div class="word-cn">{{ entry.meaning }}</div>
        </div>
        <van-icon
          v-if="book?.type === 'user'"
          name="delete-o"
          class="word-delete-icon"
          @click="confirmDeleteWord(entry)"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <van-empty
      v-if="words.length === 0"
      :description="book?.type === 'user' ? '还没有单词，点击右上角 + 批量导入' : '系统单词本，暂不支持导入'"
      image="search"
    />

    <!-- 批量导入 - 输入弹窗 -->
    <van-dialog
      v-model:show="batchShow"
      title="批量导入"
      :show-confirm-button="false"
      :show-cancel-button="false"
    >
      <div class="dialog-body">
        <div class="batch-hint">用逗号分隔多个英文单词</div>
        <van-field
          v-model="batchInput"
          type="textarea"
          rows="4"
          placeholder="例如：apple, banana, cat, dog"
        />
        <div class="dialog-actions">
          <van-button round plain size="small" @click="batchShow = false" :loading="batchLoading">取消</van-button>
          <van-button
            round
            type="primary"
            size="small"
            :disabled="!batchInput.trim()"
            :loading="batchLoading"
            @click="doBatchRecognize"
          >识别</van-button>
        </div>
      </div>
    </van-dialog>

    <!-- 批量导入 - 识别结果预览弹窗 -->
    <van-dialog
      v-model:show="batchPreviewShow"
      title="识别结果"
      :show-confirm-button="false"
      :show-cancel-button="false"
    >
      <div class="dialog-body">
        <div class="preview-hint">共识别 {{ batchPreviewList.length }} 个单词，可删除不需要的</div>
        <div class="preview-list">
          <div
            class="preview-item"
            v-for="(item, idx) in batchPreviewList"
            :key="idx"
          >
            <div class="preview-word">
              <span class="preview-en">{{ item.word }}</span>
              <span class="preview-cn">{{ item.meaning }}</span>
            </div>
            <van-icon name="cross" size="16" color="#EF4444" class="preview-delete" @click="removePreviewItem(idx)" />
          </div>
        </div>
        <div class="dialog-actions">
          <van-button round plain size="small" @click="backToInput">返回修改</van-button>
          <van-button
            round
            type="primary"
            size="small"
            :disabled="batchPreviewList.length === 0"
            @click="confirmBatchImport"
          >确认导入 ({{ batchPreviewList.length }})</van-button>
        </div>
      </div>
    </van-dialog>

    <!-- 学习报告弹窗 -->
    <WordBookDashboard v-model:show="showDashboard" :book-id="id" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWordbookStore } from '../stores/wordbook.js'
import { speak } from '../utils/speech.js'
import { showToast, showConfirmDialog } from 'vant'
import { translateWord } from '../utils/translate.js'
import WordBookDashboard from '../components/WordBookDashboard.vue'

const route = useRoute()
const router = useRouter()
const store = useWordbookStore()

const id = computed(() => route.params.id)
const book = computed(() => store.getBook(id.value))

const batchShow = ref(false)
const batchInput = ref('')
const batchLoading = ref(false)
const batchPreviewShow = ref(false)
const batchPreviewList = ref([])
const showDashboard = ref(false)

const words = computed(() => {
  if (!route.params.id) return []
  return store.getWordsByBookId(route.params.id)
})

const learnedCount = computed(() =>
  words.value.filter(e => e.learned).length
)

const progressPct = computed(() => {
  if (words.value.length === 0) return 0
  return Math.round((learnedCount.value / words.value.length) * 100)
})

function speakWord(word) {
  speak(word)
}

// 批量识别：输入单词 → 翻译 → 弹出预览列表
async function doBatchRecognize() {
  const raw = batchInput.value.trim()
  if (!raw) return

  const wordList = raw
    .split(/[,，\s]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w && /^[a-zA-Z]+$/.test(w))

  if (wordList.length === 0) {
    showToast('未识别到有效英文单词')
    return
  }

  batchLoading.value = true
  const results = []
  let failCount = 0

  for (const w of wordList) {
    try {
      const result = await translateWord(w)
      if (result.meaning) {
        results.push(result)
      } else {
        failCount++
      }
    } catch {
      failCount++
    }
  }

  batchLoading.value = false

  if (results.length === 0) {
    showToast('未能识别任何单词，请检查输入')
    return
  }

  batchPreviewList.value = results
  batchShow.value = false
  batchPreviewShow.value = true
}

// 从预览列表删除单个单词
function removePreviewItem(idx) {
  batchPreviewList.value.splice(idx, 1)
}

// 返回输入弹窗
function backToInput() {
  batchPreviewShow.value = false
  batchShow.value = true
}

// 确认导入：把预览列表导入到单词本
function confirmBatchImport() {
  const list = batchPreviewList.value
  if (list.length === 0) return

  let successCount = 0
  list.forEach(item => {
    store.addWord(id.value, item.word, item.meaning, item.phonetic)
    successCount++
  })

  batchPreviewShow.value = false
  batchInput.value = ''
  batchPreviewList.value = []
  showToast(`成功导入 ${successCount} 个单词`)
}

function confirmDeleteWord(entry) {
  showConfirmDialog({
    title: '删除单词',
    message: `确定删除「${entry.word}」吗？`,
    confirmButtonColor: '#EF4444'
  }).then(() => {
    store.deleteWord(entry.id)
    showToast('已删除')
  }).catch(() => {})
}

function goPractice() {
  router.push(`/wordbook/${id.value}/practice`)
}

const dictationAvailable = computed(() => {
  return book.value && (book.value.practiceRound || 0) > 0
})

function goDictation() {
  router.push(`/wordbook/${id.value}/dictation`)
}

function goSettings() {
  router.push(`/wordbook/${id.value}/settings`)
}

function showBatchDialog() {
  batchInput.value = ''
  batchShow.value = true
}
</script>

<style scoped>
.wb-detail-page {
  padding-bottom: 80px;
}

.stat-bar {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  margin: 0 16px;
  background: var(--bg-card);
  border-radius: 14px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
  display: block;
}

.stat-num.c-green { color: #10B981; }
.stat-num.c-orange { color: #F59E0B; }

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.progress-bar {
  padding: 10px 16px 0;
  margin: 0 16px;
}

.progress-track {
  height: 4px;
  border-radius: 2px;
  background: var(--border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent), #10B981);
  transition: width 0.3s ease;
}

.action-row {
  padding: 12px 16px 0;
}

.action-row-double {
  display: flex;
  gap: 10px;
}

.action-row-double .van-button {
  flex: 1;
  font-size: 14px;
}

.word-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.word-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 12px 12px 12px 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.word-card-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.word-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.word-en {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.word-phonetic {
  font-size: 12px;
  color: var(--text-secondary);
}

.word-speak-btn {
  font-size: 14px;
  cursor: pointer;
  opacity: 0.6;
}

.word-learned {
  font-size: 14px;
  color: #10B981;
  font-weight: 700;
  margin-left: auto;
}

.word-delete-icon {
  font-size: 20px;
  color: #EF4444;
  padding: 6px;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.2s;
  opacity: 0.7;
}

.word-delete-icon:active { opacity: 1; }

.word-cn {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.dialog-body {
  padding: 16px;
}

.batch-hint {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 8px 16px 4px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
}

.preview-hint {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 16px 8px;
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 16px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
}

.preview-word {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.preview-en {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-cn {
  font-size: 13px;
  color: var(--text-secondary);
}

.preview-delete {
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}
</style>
