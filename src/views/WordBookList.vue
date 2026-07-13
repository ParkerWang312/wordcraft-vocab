<template>
  <div class="page wordbook-list-page">
    <van-nav-bar title="单词本" :fixed="false">
      <template #right>
        <van-icon name="plus" size="22" @click="showCreateDialog" />
      </template>
    </van-nav-bar>

    <div class="list-container">
      <!-- 系统单词本 -->
      <div class="section-label" v-if="store.systemBooks.length > 0">系统单词本</div>
      <div
        class="book-card"
        v-for="book in store.systemBooks"
        :key="book.id"
        @click="goDetail(book.id)"
      >
        <div class="book-cover" :style="{ background: book.coverColor }">
          <span class="cover-letter">{{ book.coverLetter || book.name.charAt(0) }}</span>
        </div>
        <div class="book-info">
          <div class="book-name-row">
            <span class="book-name">{{ book.name }}</span>
            <span class="book-tag system-tag">系统</span>
          </div>
          <span class="book-desc">{{ book.description }}</span>
          <span class="book-count">{{ getWordCount(book.id) }} 词</span>
        </div>
        <van-icon name="arrow" color="#9CA3AF" />
      </div>

      <!-- 用户单词本 -->
      <div class="section-label" v-if="store.userBooks.length > 0">我的单词本</div>
      <div
        class="book-card"
        v-for="book in store.userBooks"
        :key="book.id"
        @click="goDetail(book.id)"
      >
        <div class="book-cover" :style="{ background: book.coverColor }">
          <span class="cover-letter">{{ book.coverLetter || book.name.charAt(0) }}</span>
        </div>
        <div class="book-info">
          <div class="book-name-row">
            <span class="book-name">{{ book.name }}</span>
          </div>
          <span class="book-desc">{{ book.description || '自定义单词本' }}</span>
          <span class="book-count">{{ getWordCount(book.id) }} 词</span>
        </div>
        <van-icon name="delete-o" color="#EF4444" class="delete-btn" @click.stop="confirmDelete(book)" />
        <van-icon name="arrow" color="#9CA3AF" style="margin-left:4px" />
      </div>

      <!-- 空状态 -->
      <van-empty
        v-if="store.userBooks.length === 0"
        description="还没有自定义单词本"
        image="search"
      >
        <van-button round type="primary" size="small" @click="showCreateDialog">创建单词本</van-button>
      </van-empty>
    </div>

    <!-- 创建弹窗 -->
    <van-dialog
      v-model:show="createShow"
      title="新建单词本"
      :show-confirm-button="false"
      :show-cancel-button="false"
    >
      <div class="dialog-body">
        <van-field v-model="newName" label="名称" placeholder="输入单词本名称" maxlength="20" />
        <van-field v-model="newDesc" label="描述" placeholder="选填描述" maxlength="30" />
        <div class="dialog-actions">
          <van-button round plain size="small" @click="createShow = false">取消</van-button>
          <van-button round type="primary" size="small" :disabled="!newName.trim()" @click="doCreate">创建</van-button>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWordbookStore } from '../stores/wordbook.js'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const store = useWordbookStore()

const createShow = ref(false)
const newName = ref('')
const newDesc = ref('')

function getWordCount(id) {
  return store.getWordsByBookId(id).length
}

function showCreateDialog() {
  newName.value = ''
  newDesc.value = ''
  createShow.value = true
}

function doCreate() {
  if (!newName.value.trim()) return
  const book = store.createWordBook(newName.value.trim(), newDesc.value.trim())
  createShow.value = false
  showToast('创建成功')
  router.push(`/wordbook/${book.id}`)
}

function confirmDelete(book) {
  showConfirmDialog({
    title: '删除单词本',
    message: `确定删除「${book.name}」吗？\n共 ${getWordCount(book.id)} 个单词将被删除。`,
    confirmButtonColor: '#EF4444'
  }).then(() => {
    store.deleteWordBook(book.id)
    showToast('已删除')
  }).catch(() => {})
}

function goDetail(id) {
  router.push(`/wordbook/${id}`)
}
</script>

<style scoped>
.wordbook-list-page {
  padding-bottom: 80px;
}

.list-container {
  padding: 0 16px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 16px 0 10px;
  padding-left: 4px;
}

.book-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: transform 0.15s;
}

.book-card:active {
  transform: scale(0.98);
}

.book-cover {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-letter {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

.book-info {
  flex: 1;
  min-width: 0;
}

.book-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.book-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.book-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}

.system-tag {
  background: var(--accent-light);
  color: var(--accent);
}

.book-desc {
  font-size: 12px;
  color: var(--text-secondary);
  display: block;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-count {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
  margin-top: 4px;
  display: inline-block;
}

.delete-btn {
  flex-shrink: 0;
  padding: 4px;
}

.dialog-body {
  padding: 16px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
}
</style>
