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
        <div class="cell-hint">所有单词未学、清除练习历史，重新从第1轮开始</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWordbookStore } from '../stores/wordbook.js'
import { showToast, showConfirmDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useWordbookStore()

const id = computed(() => route.params.id)
const book = computed(() => store.getBook(id.value))

const editName = ref('')
const wordsPerSession = ref(20)

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
    message: '将清除本单词本的练习进度和历史记录，重新从第1轮开始。不会影响其他单词本。',
    confirmButtonColor: '#EF4444'
  }).then(() => {
    store.resetAllLearned(id.value)
    store.clearPracticeHistory(id.value)
    showToast('已重置')
  }).catch(() => {})
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
</style>
