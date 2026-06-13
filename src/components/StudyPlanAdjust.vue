<template>
  <van-dialog v-model:show="show" title="📝 调整学习计划" show-cancel-button @confirm="save">
    <div class="plan-body">
      <!-- 模式选择 -->
      <div class="mode-tabs">
        <div
          v-for="m in modes"
          :key="m.key"
          :class="['mode-tab', { active: selectedMode === m.key }]"
          @click="selectedMode = m.key"
        >
          {{ m.label }}
        </div>
      </div>

      <!-- 28天计划模式 -->
      <div v-if="selectedMode === '28days'" class="mode-detail">
        <div class="mode-icon">📅</div>
        <div class="mode-title">28天分类计划</div>
        <div class="mode-desc">每天学习一个主题分类，共 28 天完成全部单词</div>
        <div class="mode-stat">
          <span>总天数</span>
          <strong>28 天</strong>
        </div>
        <div class="mode-stat">
          <span>总单词</span>
          <strong>{{ totalWords }} 词</strong>
        </div>
      </div>

      <!-- 分类模式 -->
      <div v-if="selectedMode === 'categories'" class="mode-detail">
        <div class="mode-icon">📂</div>
        <div class="mode-title">按分类学习</div>
        <div class="mode-desc">每天学习一个小分类，共 {{ totalCategories }} 个分类</div>
        <div class="mode-stat">
          <span>总分类</span>
          <strong>{{ totalCategories }} 个</strong>
        </div>
        <div class="mode-stat">
          <span>总单词</span>
          <strong>{{ totalWords }} 词</strong>
        </div>
        <div class="mode-stat">
          <span>平均每分类</span>
          <strong>~{{ avgPerCategory }} 词</strong>
        </div>
      </div>

      <!-- 自定义模式 -->
      <div v-if="selectedMode === 'custom'" class="mode-detail">
        <div class="mode-icon">✏️</div>
        <div class="mode-title">自定义每日单词量</div>
        <div class="mode-desc">设置每天学习的单词数量</div>
        <div class="plan-chips">
          <span
            v-for="n in wordPresets"
            :key="n"
            :class="['plan-chip', { active: wordsPerDay === n }]"
            @click="wordsPerDay = n"
          >{{ n }} 词/天</span>
        </div>
        <div class="plan-input-row">
          <span>自定义</span>
          <input
            v-model.number="wordsPerDay"
            type="number"
            class="plan-input"
            min="1"
            max="200"
          />
          <span>词/天</span>
        </div>
        <div class="mode-stat">
          <span>预计总天数</span>
          <strong>{{ computedTotalDays }} 天</strong>
        </div>
        <div class="mode-stat">
          <span>总单词</span>
          <strong>{{ totalWords }} 词</strong>
        </div>
      </div>
    </div>
  </van-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLearningStore } from '../stores/learning.js'
import { useSettingsStore } from '../stores/settings.js'
import { showDialog } from 'vant'

const show = defineModel('show', { type: Boolean, default: false })
const emit = defineEmits(['saved'])

const store = useLearningStore()
const settingsStore = useSettingsStore()

const totalWords = computed(() => store.totalWords)
const totalCategories = computed(() => store.totalCategories || 0)
const avgPerCategory = computed(() => {
  if (!store.totalCategories) return 0
  return Math.round(store.totalWords / store.totalCategories)
})

const modes = [
  { key: '28days', label: '28天计划' },
  { key: 'categories', label: '按分类学' },
  { key: 'custom', label: '自定义' }
]

const selectedMode = ref(settingsStore.data.planMode || 'categories')
const wordsPerDay = ref(settingsStore.data.wordsPerDay || 30)
const wordPresets = [5, 10, 15, 20, 25, 30]

const computedTotalDays = computed(() => {
  const w = wordsPerDay.value || 1
  return Math.ceil(store.totalWords / w)
})

function save() {
  const newMode = selectedMode.value
  const oldMode = settingsStore.data.planMode || 'categories'
  const oldWpd = settingsStore.data.wordsPerDay || 30
  const wpd = wordsPerDay.value || 30

  // 检测变更（必须在 settingsStore 更新之前判断）
  const modeChanged = newMode !== oldMode
  const wordsChanged = newMode === 'custom' && wpd !== oldWpd

  settingsStore.data.planMode = newMode
  if (newMode === 'custom') {
    settingsStore.data.wordsPerDay = wpd
    settingsStore.data.dailyGoal = wpd
  }
  settingsStore.persistDirect()

  if ((modeChanged || wordsChanged) && store.state.completedUnits.length > 0) {
    showDialog({
      title: '🔄 调整学习计划',
      message: '将根据已学单词重新计算完成进度，已学单词不会丢失。',
      confirmButtonText: modeChanged ? '确认切换' : '确认调整',
      cancelButtonText: '取消',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5'
    }).then(() => {
      store.recalcCompletedUnits(newMode, wpd)
      window.location.reload()
    }).catch(() => {
      if (modeChanged) {
        settingsStore.data.planMode = oldMode
      }
      settingsStore.persistDirect()
    })
  }

  emit('saved')
  show.value = false
}
</script>

<style scoped>
.plan-body { padding: 12px 20px 20px; }

.mode-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 4px;
}
.mode-tab {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.mode-tab.active {
  background: var(--bg-card);
  color: var(--accent);
  font-weight: 700;
  box-shadow: var(--shadow);
}

.mode-detail { text-align: center; }
.mode-icon { font-size: 32px; margin-bottom: 6px; }
.mode-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.mode-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; }

.mode-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: var(--bg-primary);
  font-size: 13px;
}
.mode-stat span { color: var(--text-secondary); }
.mode-stat strong { color: var(--accent); font-size: 14px; }

.plan-input-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 15px;
  color: var(--text-primary);
}
.plan-input {
  width: 72px;
  padding: 8px 6px;
  border: 1px solid var(--border);
  border-radius: 10px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  background: var(--bg-primary);
  outline: none;
}
.plan-input:focus { border-color: var(--accent); }

.plan-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 14px;
}
.plan-chip {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.15s;
}
.plan-chip.active {
  border-color: var(--accent);
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 700;
}
</style>
