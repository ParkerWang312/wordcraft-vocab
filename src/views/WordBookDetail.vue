<template>
  <div class="page wb-detail-page">
    <van-nav-bar
      :title="book?.name || '单词本'"
      left-arrow
      @click-left="$router.back()"
      :fixed="false"
    >
      <template #right>
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
        <span class="stat-num c-orange">{{ book.practiceRound || 0 }}</span>
        <span class="stat-label">已到第N轮</span>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar" v-if="words.length > 0">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-row">
      <van-button
        type="primary"
        round
        size="large"
        block
        :disabled="words.length === 0"
        @click="goPractice"
      >
        开始练习
      </van-button>
    </div>
    <div class="action-row sub-row">
      <van-button round plain size="small" @click="showAddDialog">+ 添加单词</van-button>
      <van-button round plain size="small" @click="showBatchDialog">+ 批量导入</van-button>
    </div>

    <!-- 单词列表 -->
    <div class="word-list" v-if="words.length > 0">
      <van-swipe-cell v-for="entry in words" :key="entry.id">
        <div class="word-item" @click="speakWord(entry.word)">
          <div class="word-main">
            <span class="word-en">{{ entry.word }}</span>
            <span class="word-phonetic" v-if="entry.phonetic">{{ entry.phonetic }}</span>
            <span class="word-speak-btn">🔊</span>
            <span class="word-learned" v-if="entry.learned">✓</span>
          </div>
          <div class="word-cn">{{ entry.meaning }}</div>
        </div>
        <template #right>
          <van-button square type="danger" text="删除" @click="doDelete(entry.id)" />
        </template>
      </van-swipe-cell>
    </div>

    <!-- 空状态 -->
    <van-empty
      v-if="words.length === 0"
      description="还没有单词"
      image="search"
    >
      <van-button round type="primary" size="small" @click="showAddDialog">添加第一个单词</van-button>
    </van-empty>

    <!-- 添加单词弹窗 -->
    <van-dialog
      v-model:show="addShow"
      title="添加单词"
      :show-confirm-button="false"
      :show-cancel-button="false"
    >
      <div class="dialog-body">
        <van-field v-model="newWord" label="英文" placeholder="输入英文单词" maxlength="50" />
        <div class="dialog-actions">
          <van-button round plain size="small" @click="addShow = false" :loading="translating">取消</van-button>
          <van-button
            round
            type="primary"
            size="small"
            :disabled="!newWord.trim()"
            :loading="translating"
            @click="doAddWord"
          >添加</van-button>
        </div>
      </div>
    </van-dialog>

    <!-- 批量导入弹窗 -->
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
            @click="doBatchImport"
          >导入</van-button>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWordbookStore } from '../stores/wordbook.js'
import { translateWord } from '../utils/translate.js'
import { speak } from '../utils/speech.js'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useWordbookStore()

const id = computed(() => route.params.id)
const book = computed(() => store.getBook(id.value))

const addShow = ref(false)
const batchShow = ref(false)
const newWord = ref('')
const batchInput = ref('')
const translating = ref(false)
const batchLoading = ref(false)

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

// 添加单词（自动翻译）
async function doAddWord() {
  const raw = newWord.value.trim()
  if (!raw) return
  translating.value = true
  try {
    const result = await translateWord(raw)
    store.addWord(id.value, result.word, result.meaning, result.phonetic)
    newWord.value = ''
    addShow.value = false
    showToast('已添加')
  } catch (e) {
    showToast(e.message || '翻译失败')
  } finally {
    translating.value = false
  }
}

// 批量导入
async function doBatchImport() {
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
  let successCount = 0
  let failCount = 0

  for (const w of wordList) {
    try {
      const result = await translateWord(w)
      if (result.meaning) {
        store.addWord(id.value, result.word, result.meaning, result.phonetic)
        successCount++
      } else {
        failCount++
      }
    } catch {
      failCount++
    }
  }

  batchLoading.value = false
  batchInput.value = ''
  batchShow.value = false
  showToast(`导入 ${successCount} 个${failCount > 0 ? `，${failCount} 个失败` : ''}`)
}

function doDelete(entryId) {
  store.deleteWord(entryId)
  showToast('已删除')
}

function goPractice() {
  router.push(`/wordbook/${id.value}/practice`)
}

function goSettings() {
  router.push(`/wordbook/${id.value}/settings`)
}

function showAddDialog() {
  newWord.value = ''
  addShow.value = true
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

.sub-row {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding-top: 8px;
}

.word-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.word-item {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
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
</style>
