# WordCraft 词匠 — Code Graph

> 单一结构化索引，让 AI 代理可在 O(1) 时间内定位任何概念，无需全项目 grep。
> 所有断言均带 `file:line` 引用。路径全部为绝对路径。

**项目根**：`d:\WorkBuddy\vocab-learning-app`
**技术栈**：Vue 3 + Vite + Pinia + Vue Router (hash 模式) + Vant 4 + localStorage
**入口**：`d:/WorkBuddy/vocab-learning-app/src/main.js:1-47`

---

## 目录

1. [模块导出表 (Module Exports Map)](#1-模块导出表-module-exports-map)
2. [View → Store 依赖图](#2-view--store-依赖图)
3. [localStorage 键清单](#3-localstorage-键清单)
4. [路由表 (Router Table)](#4-路由表-router-table)
5. [组件 Props / Events](#5-组件-props--events)
6. [State 数据契约](#6-state-数据契约)
7. [关键业务规则](#7-关键业务规则)
8. [横切关注点 (Cross-Cutting Concerns)](#8-横切关注点-cross-cutting-concerns)

---

## 1. 模块导出表 (Module Exports Map)

### 1.1 `d:/WorkBuddy/vocab-learning-app/src/stores/learning.js`

| Export | 行号 | 类型 | 用途 |
|---|---|---|---|
| `getDefaultWrongState` | 7 | function | 返回空对象 `{}`，作为 `state.wrongWords` 默认值。形状 `{ wordId: { wrongCount, lastWrongAt } }` |
| `useLearningStore` | 11 | Pinia store (setup style) | 全局学习状态：进度、SM-2、错题本、生词本、复习池 |
| `state` (return) | 12 → 247 | ref\<Object\> | 持久化主状态（写入 `wordcraft_vocab`） |
| `persist` | 14 | function | `saveState(state.value)` 包装（行 14-16） |
| `allWords` | 29 | computed\<Array\> | 扁平化 `vocabularyData.days[].categories[].words[]`，附加 `day`/`title` 字段 |
| `totalWords` | 41 | computed\<Number\> | `allWords.value.length` |
| `getDayWords(day)` | 44 | function | 返回某 Day 的所有词，附加 `day`/`category` |
| `getDayTitle(day)` | 53 | function | 返回某 Day 的分类名拼接 `" / "` |
| `initWordState(wordId)` | 60 | function | 懒初始化 `state.wordStates[wordId]`（不存在则填默认） |
| `markWord(wordId, known)` | 68 | function | **核心**：学习反馈入口（详见 §7.2） |
| `reviewWord(wordId, quality)` | 106 | function | 复习反馈入口，调用 `calculateNextReview`，增 `totalReviewed`/`totalMastered` |
| `completeDay(day)` | 119 | function | 把 `day` 加入 `completedDays`，并把 `currentDay` 推到 `day+1` |
| `updateStreak` | 132 | function | 维护 `streakDays` / `lastStudyDate`（昨天→+1；其他→1） |
| `addWrongWord(wordId)` | 145 | function | 错题本 +1，更新 `lastWrongAt` |
| `removeWrongWord(wordId)` | 154 | function | 答对时清零 `wrongCount`（保留条目） |
| `wrongWordsList` | 161 | computed\<Array\> | 错题本反查全词表，按 `wrongCount` 降序 |
| `wrongCount` | 172 | computed\<Number\> | `wrongWordsList.value.length` |
| `dueReviewWords` | 175 | computed\<Array\> | 到期词（`nextReviewAt <= 今天 0点`） |
| `dueReviewCount` | 189 | computed\<Number\> | `dueReviewWords.value.length` |
| `toggleWordBook(wordId)` | 192 | function | 翻转 `inWordBook` |
| `wordBookWords` | 198 | computed\<Array\> | 收藏词列表 |
| `progress` | 209 | computed\<{completed,total,percentage}\> | 总进度（completedDays / totalDays） |
| `getDayProgress(day)` | 216 | function | 读取 `dayProgress[day]`，兼容旧 `number` 与新 `object` 形态，返回 `wordIndex` |
| `saveDayProgress(day, index)` | 223 | function | 保存 `wordIndex`（保留对象其他字段） |
| `setDayNeedsPractice(day, needs)` | 234 | function | 强制练习模式：把 `dayProgress[day] = { wordIndex, needsPractice }` |
| `getDayNeedsPractice(day)` | 241 | function | 读取 `dayProgress[day].needsPractice` |
| `vocabularyData` | 251 (return) | 原始 JSON | 暴露 `vocabulary.json` 供视图直接使用 |
| `generateWordId(word)` | 275 | function | **全局**：`d{day}_{word}`，非字母字符替换为 `_`（行 277） |


### 1.2 `d:/WorkBuddy/vocab-learning-app/src/stores/settings.js`

| Export | 行号 | 类型 | 用途 |
|---|---|---|---|
| `useSettingsStore` | 22 | Pinia store | 用户偏好设置（卡片展示/自动发音/强制练习） |
| `data` (return) | 23 | ref\<Object\> | 当前设置对象（详见 §6.2） |
| `persist` | 25 | function | 写入 `wordcraft_settings` |
| `toggleShowWordOnBack` | 29 | function | 翻转 `showWordOnBack` |
| `toggleShowPhoneticOnBack` | 34 | function | 翻转 `showPhoneticOnBack` |
| `persistDirect` | 39 | function | 立即保存（Switch 组件 `@change` 用） |

> **注**：`SETTINGS_KEY = 'wordcraft_settings'`（行 4），`defaults` 常量在行 6-12。
> **隐式使用**：通过 `settingsStore.data.*` 直接读取开关值（SettingsPanel.vue:7, 12, 17, 24, 29）。

### 1.3 `d:/WorkBuddy/vocab-learning-app/src/stores/theme.js`

| Export | 行号 | 类型 | 用途 |
|---|---|---|---|
| `useThemeStore` | 6 | Pinia store | 深色模式（持久化于 `wordcraft_theme`） |
| `isDark` (return) | 8 | ref\<Boolean\> | 当前是否为深色 |
| `toggle` | 10 | function | 翻转 + 写入 `wordcraft_theme` + `applyTheme` |
| `applyTheme` | 16 | function | 内部：设置 `<html data-theme="dark|light">` |
| **副作用** | 21 | — | 模块加载时立即调用 `applyTheme()` 一次 |

### 1.4 `d:/WorkBuddy/vocab-learning-app/src/composables/useTimer.js`

| Export | 行号 | 类型 | 用途 |
|---|---|---|---|
| `useTimer()` | 3 | composable | 返回 `{ elapsed: Ref<Number> }`；内部 `setInterval(1s)` + `onUnmounted(clearInterval)` |
| `formatTime(seconds)` | 18 | pure function | 秒数 → `"mm:ss"`（>1h 显示 `"h:mm:ss"`） |

### 1.5 `d:/WorkBuddy/vocab-learning-app/src/utils/memoryCurve.js`

| Export | 行号 | 类型 | 用途 |
|---|---|---|---|
| `getDefaultWordState(wordId)` | 5 | function | 返回 SM-2 单词状态默认值（详见 §6.1） |
| `calculateNextReview(state, quality)` | 18 | function | **核心 SM-2 算法**（详见 §7.1） |
| `getDueReviewWords(wordStates)` | 62 | function | 过滤到期词（无 store 依赖，pure helper） |
| `getTodayReviewCount(wordStates)` | 71 | function | `getDueReviewWords(...).length` |

> **未导出但内部使用**：`REVIEW_INTERVALS = [1, 3, 7, 15, 30]`（行 3）— 实际计算未使用，保留为参考。

### 1.6 `d:/WorkBuddy/vocab-learning-app/src/utils/storage.js`

| Export | 行号 | 类型 | 用途 |
|---|---|---|---|
| `loadState()` | 3 | function | 读 `wordcraft_vocab`；JSON.parse；自动修复 `currentDay === 1` 但有 `completedDays` 的情况（行 9-11） |
| `saveState(state)` | 18 | function | `JSON.stringify` 写入 `wordcraft_vocab`；失败 console.warn 静默降级 |
| `getDefaultState()` | 28 | function | 返回 `currentDay=1, completedDays=[], ...` 默认对象（详见 §6.1） |

> **内部常量**：`STORAGE_KEY = 'wordcraft_vocab'`（行 1）

---

## 2. View → Store 依赖图

| View | 路由 | Store / Composable 依赖 | 关键 import 行 |
|---|---|---|---|
| **Home.vue** | `/` | `useLearningStore` (dueReviewCount, progress, state, wrongCount, completedDays, currentDay) / `useThemeStore` (toggle, isDark) / `inject('unlockAll')` / `inject('openSettings')` / `showDialog` | Home.vue:103, 104 |
| **DayLearn.vue** | `/learn/:day` | `useLearningStore` (markWord, saveDayProgress, completeDay, setDayNeedsPractice, getDayProgress, getDayNeedsPractice, getDayWords, getDayTitle, state) / `useSettingsStore` (forcePractice) / `useTimer + formatTime` / `WordCard` / `showToast` | DayLearn.vue:62-66 |
| **Practice.vue** | `/practice/:day` | `useLearningStore` (getDayWords, allWords, state, addWrongWord, completeDay, setDayNeedsPractice, persist) / `useSettingsStore` (autoAdvance) / `useTimer + formatTime` | Practice.vue:120-123 |
| **Review.vue** | `/review` | `useLearningStore` (wrongWordsList, wordBookWords, dueReviewWords, initWordState, state, reviewWord, removeWrongWord, toggleWordBook) / `useTimer + formatTime` / `WordCard` | Review.vue:105, 107 |
| **WordBook.vue** | `/wordbook` | `useLearningStore` (wordBookWords, toggleWordBook) / `showToast` | WordBook.vue:89 |
| **App.vue** | (根布局) | `useLearningStore` (dueReviewCount) / `useThemeStore` (isDark) / `SettingsPanel` / `provide('unlockAll', 'openSettings')` / `useRoute` | App.vue:17, 18 |


### 2.1 路由跳转矩阵（`router.push`）

| 起点 | 终点 | 触发 | 位置 |
|---|---|---|---|
| Home | `/learn/{day}` | `startLearn()` / `goToDay()` | Home.vue:132, 151 |
| Home | `/review` | 待复习 stat 点击 | Home.vue:20 |
| Home | `/review?source=wrongwords` | 错题 stat 点击 | Home.vue:32 |
| DayLearn | `/practice/{day}?via=force` | 强制练习完成 | DayLearn.vue:88, 139 |
| DayLearn | `/practice/{day}` | 导航栏练习按钮 | DayLearn.vue:159 |
| DayLearn | `/review?redirectTo=...` | 未完成 + 有待复习 | DayLearn.vue:83 |
| DayLearn | `/` | 完成页"返回首页" | DayLearn.vue:51 |
| Practice | `/` | 结果页"返回首页" | Practice.vue:106 |
| Practice | `/learn/{day}` | 未通过时"重新学习" | Practice.vue:109 |
| Practice | `/review?redirectTo=...` | 守卫强制复习 | Practice.vue:304 |
| Review | `/`, `/wordbook`, `redirectTo` | 完成后"返回" | Review.vue:263, 271 |
| WordBook | `/review?source=wordbook` | "一键复习" | WordBook.vue:131 |

### 2.2 路由 query 参数语义

| 参数 | 取值 | 消费方 | 行为 |
|---|---|---|---|
| `via=force` | Review.vue, Practice.vue | Practice.vue:131 | 标记强制练习模式（结果页标题与完成逻辑） |
| `source=wrongwords` | Home.vue:32 | Review.vue:118 | 仅复习错题本（不恢复进度） |
| `source=wordbook` | WordBook.vue:131 | Review.vue:117 | 复习生词本（不恢复进度） |
| `redirectTo=...` | Home.vue:127, 145 / DayLearn.vue:83 / Practice.vue:304 | Review.vue:116 | 复习完成后跳转目标 |

---

## 3. localStorage 键清单

> 全部 4 个键在 SettingsPanel.vue 的导出/导入/重置中集中处理（SettingsPanel.vue:147-200）。

| Key | Owner File:Line | 写入/读取 | 数据形状（1-line） |
|---|---|---|---|
| `wordcraft_vocab` | `d:/WorkBuddy/vocab-learning-app/src/utils/storage.js:1, 5, 21` | 整体学习状态 | `{ currentDay, completedDays[], streakDays, lastStudyDate, wordStates{}, wrongWords{}, dayProgress{}, stats{...} }`（见 §6.1） |
| `wordcraft_settings` | `d:/WorkBuddy/vocab-learning-app/src/stores/settings.js:4, 16, 26` | 用户偏好 | `{ showWordOnBack, showPhoneticOnBack, autoAdvance, speakOnFlip, forcePractice }`（布尔；见 §6.2） |
| `wordcraft_theme` | `d:/WorkBuddy/vocab-learning-app/src/stores/theme.js:4, 7, 12` | 深色/浅色模式 | 字符串 `"dark"` 或 `"light"`（`=== 'dark'` 判 dark） |
| `wordcraft_review_progress` | `d:/WorkBuddy/vocab-learning-app/src/views/Review.vue:190, 195, 208, 221` | 主线复习进度 | `{ index: number, reviewed: number, reviewList: Word[] }`（仅主线复习写） |

### 3.1 写入操作分类

- **自动持久化**：`storage.js:21`（vocab）、`settings.js:26`（settings）、`theme.js:12`（theme）、`Review.vue:195`（progress）
- **导入/导出聚合读写**：SettingsPanel.vue:150-153（read）+ 177-180（write）
- **重置 remove**：SettingsPanel.vue:196-198（清 vocab/settings/review，**保留 theme**）
- **测试数据覆盖**（dev only，URL 需 `?dev`）：SettingsPanel.vue:234, 278, 312, 324
- **清空 review**：Review.vue:221（仅主线结束时）

---

## 4. 路由表 (Router Table)

> 定义于 `d:/WorkBuddy/vocab-learning-app/src/main.js:15-21`，模式 `createWebHashHistory()`（行 24）。

| Path | Component | Props | Meta / 备注 |
|---|---|---|---|
| `/` | `views/Home.vue` | — | 入口；显示 TabBar（App.vue:31） |
| `/learn/:day` | `views/DayLearn.vue` | `props: true` → 注入 `props.day` | `:day` 类型 `[String, Number]`（DayLearn.vue:68） |
| `/practice/:day` | `views/Practice.vue` | `props: true` → 注入 `props.day` | 支持 `?via=force`（Practice.vue:131） |
| `/review` | `views/Review.vue` | — | 支持 `?source=wrongwords\|wordbook` & `?redirectTo=...` |
| `/wordbook` | `views/WordBook.vue` | — | 跳复习时附加 `?source=wordbook`（WordBook.vue:131） |

### 4.1 路由守卫（应用层）

- **Tabbar 显隐**：App.vue:31 `showTabbar = ['/', '/review', '/wordbook'].includes(route.path)` — Learn / Practice 隐藏 Tabbar
- **未完成天 + 有待复习 → 强制复习**：DayLearn.vue:81-85、Practice.vue:301-306
- **强制练习完成 → 直跳 Practice**：DayLearn.vue:86-90、DayLearn.vue:136-147

### 4.2 Pinia / Vant 注册

`main.js:29-44` 注册 Vant 组件：`Button, NavBar, Tabbar, TabbarItem, Icon, ActionSheet, Cell, CellGroup, Overlay, Dialog, SwipeCell, Toast, Switch, Field, Popup, VanProgress`。
Pinia 在行 46 `app.use(createPinia())` 装载（**注意**：先 `app.use(router)` 再 `app.use(createPinia())`，顺序：行 45, 46）。

---


## 5. 组件 Props / Events

### 5.1 `d:/WorkBuddy/vocab-learning-app/src/components/WordCard.vue`

**Props**（行 64-71）：

| Prop | Type | Default | Required | 说明 |
|---|---|---|---|---|
| `word` | Object | — | yes | 单词数据 `{ word, phonetic, meaning/def, pos, day, ... }` |
| `isStarred` | Boolean | false | no | 是否在生词本（控制 ⭐ 状态） |
| `isWrong` | Boolean | false | no | 是否错题（显示 🚩） |
| `showActions` | Boolean | true | no | 是否显示底部"认识/不认识"按钮 |
| `showKnown` | Boolean | true | no | 是否显示底部"认识"按钮（用于复习场景关掉） |
| `showStar` | Boolean | true | no | 是否显示右上 ⭐ 按钮 |

**Emits**（行 73）：

| Event | Payload | 触发位置 | 行为 |
|---|---|---|---|
| `known` | — | 模板行 51 | 用户点"认识"按钮（`showKnown=true` 时才渲染） |
| `unknown` | — | 模板行 48 | 用户点"不认识"按钮 |
| `star` | — | `onStar()` 行 116-118 | 用户点 ⭐ |
| `flip` | — | `flip()` 行 96-105 | **首次**翻转卡片时发一次（`hasBeenFlipped` 锁） |

**内部状态**（行 74-75）：`isFlipped`, `hasBeenFlipped`。
**额外副作用**：`flip()` 若 `settings.data.speakOnFlip === true` 自动发音（行 102-104）。

### 5.2 `d:/WorkBuddy/vocab-learning-app/src/components/ProgressBar.vue`

**Props**（行 16-20）：

| Prop | Type | Default | 说明 |
|---|---|---|---|
| `current` | Number | 0 | 分子 |
| `total` | Number | 1 | 分母（避免除零） |
| `label` | String | '' | 左侧标签文本 |

**Emits**：无。
**内部 computed**（行 22）：`percentage = round((current/total)*100) || 0`。

### 5.3 `d:/WorkBuddy/vocab-learning-app/src/components/SettingsPanel.vue`

**Props**（行 115）：

| Prop | Type | 说明 |
|---|---|---|
| `show` | Boolean | ActionSheet 显隐（v-model:show） |

**Emits**（行 116）：

| Event | Payload | 行为 |
|---|---|---|
| `update:show` | Boolean | `show` 双向绑定（行 142-145） |

**内部状态**（行 123-140）：`showFeedback, feedbackBody, feedbackDevice, feedbackNick, importInput, devices[]`。
**injected**（行 120）：`unlockAll`（来自 App.vue:28）。
**远程写入的 localStorage 键**：详见 SettingsPanel.vue:150-180, 196-198, 234, 278, 312, 324。
**外部副作用**：导出/导入文件下载（行 156-163）、`fetch('https://wordcraft-feedback.ksjbm.com/')`（行 353-360）、重置 reload（行 199）、导入 reload（行 181）。

### 5.4 组件 import / 实例化位置

| 组件 | 被谁使用 | 关键行 |
|---|---|---|
| `WordCard` | DayLearn.vue:64, Review.vue:106 | DayLearn:29, Review:65 |
| `ProgressBar` | （当前**未被任何 view 实际使用**，仅定义） | — |
| `SettingsPanel` | App.vue:19 | App.vue:3 |

---

## 6. State 数据契约

### 6.1 `state` 在 `learning.js` 中（`useLearningStore` 的 `state` ref）

> 默认结构在 `getDefaultState()`（storage.js:28-43）。SM-2 单词状态由 `getDefaultWordState(wordId)`（memoryCurve.js:5-16）生成。

| 路径 | 类型 | 含义 |
|---|---|---|
| `state.currentDay` | Number | 当前学习天（1..28），完成时自动 +1 |
| `state.completedDays` | Number[] | 已完成天列表（去重） |
| `state.streakDays` | Number | 连续学习天数（断则重置为 1） |
| `state.lastStudyDate` | String\|null | `new Date().toDateString()` 形式 |
| `state.wordStates` | `{ [wordId]: WordState }` | 全部单词的 SM-2 状态 |
| `state.wordStates[id].wordId` | String | 同 key；冗余存 |
| `state.wordStates[id].status` | `'unknown'\|'learning'\|'known'\|'mastered'` | 状态机 |
| `state.wordStates[id].learnedAt` | String\|null | 首次学习 ISO 时间 |
| `state.wordStates[id].reviewCount` | Number | 已复习次数（≥4 → mastered） |
| `state.wordStates[id].nextReviewAt` | String\|null | 下次复习 ISO（与 today 0点 比较） |
| `state.wordStates[id].easeFactor` | Number | SM-2 简易度（最低 1.3，默认 2.5） |
| `state.wordStates[id].interval` | Number | 当前间隔（天） |
| `state.wordStates[id].inWordBook` | Boolean | 是否生词本收藏 |
| `state.wordStates[id].lastRelearnedAt` | String\|null | 已在管线的词重学时记录（learning.js:86） |
| `state.wrongWords` | `{ [wordId]: { wrongCount: Number, lastWrongAt: String } }` | 错题本（仅 `wrongCount > 0` 才参与 wrongWordsList） |
| `state.dayProgress` | `{ [day]: Number \| { wordIndex, needsPractice?, practiceIndex?, savedSeeds?, practiceStats? } }` | **形态演化**（详见 §7.3） |
| `state.stats.totalLearned` | Number | `markWord` 累计调用次数 |
| `state.stats.totalReviewed` | Number | `reviewWord` 累计次数 |
| `state.stats.totalMastered` | Number | 进入 mastered 状态次数 |

### 6.2 `data` 在 `settings.js` 中（`useSettingsStore` 的 `data` ref）

> 默认值在 settings.js:6-12；`load()`（行 14-20）做 `{...defaults, ...saved}` 合并。

| Key | Type | Default | 用途 |
|---|---|---|---|
| `data.showWordOnBack` | Boolean | true | 卡片背面是否显示单词（WordCard.vue:37） |
| `data.showPhoneticOnBack` | Boolean | false | 卡片背面是否显示音标（WordCard.vue:39） |
| `data.autoAdvance` | Boolean | false | 练习答对后 600ms 自动跳下一题（Practice.vue:387-389） |
| `data.speakOnFlip` | Boolean | true | 卡片翻转时自动发音（WordCard.vue:102） |
| `data.forcePractice` | Boolean | true | 学习完后强制进 Practice（DayLearn.vue:87, 137） |

### 6.3 Vue 注入（provide / inject）

| Key | Provider | Consumer | 类型 |
|---|---|---|---|
| `unlockAll` | App.vue:28 | Home.vue:110, SettingsPanel.vue:120 | Ref\<Boolean\>（dev 测试用） |
| `openSettings` | App.vue:29 | Home.vue:111 | Function：`(show=true) => void` |

---


## 7. 关键业务规则

### 7.1 SM-2 记忆曲线（`calculateNextReview`）

> 实现位置：`d:/WorkBuddy/vocab-learning-app/src/utils/memoryCurve.js:18-60`

- **入参**：`wordState`（对象），`quality`（`0`=忘记 / `1`=模糊 / `2`=记得）
- **quality === 0**（忘记，重置）：
  - `interval = 1`（行 23）
  - `reviewCount = 0`（行 24）
  - `status = 'unknown'`（行 25）
  - `easeFactor = max(1.3, easeFactor - 0.2)`（行 26）
- **quality ∈ {1, 2}**（记得或模糊）：
  - `delta = quality === 2 ? 0.1 : 0.05`（行 29；模糊也小幅奖励）
  - `easeFactor = max(1.3, easeFactor + delta)`（行 30）
  - 间隔阶梯（行 33-39）：
    - `reviewCount === 0` → `interval = quality===2 ? 3 : 1`
    - `reviewCount === 1` → `interval = quality===2 ? 7 : 3`
    - 否则 → `interval = round(interval * easeFactor)`
  - `reviewCount++`（行 41）
  - 状态机（行 44-50）：`reviewCount >= 4` → mastered；`>= 2` → known；否则 learning
- **共同**：下次复习时间 = `今天 + interval` 天，置 0 点（行 54-57）
- **返回**：新对象 `{...wordState, ...updates}`（行 19 + 59）

### 7.2 `markWord` 学习反馈（`stores/learning.js:68-103`）

> 关键标志：`inSchedule = !!ws.nextReviewAt`（行 73）— **判断单词是否已在 SM-2 管线中**

| 分支 | 条件 | 行为 |
|---|---|---|
| 已知 `known=true` | **首次**（`!inSchedule`） | `status='known'`，`nextReviewAt=明天0点`，`interval=1`（行 75-83） |
| 已知 `known=true` | **已在管线**（`inSchedule`） | **只** `lastRelearnedAt = now`，**不动 SM-2**（行 84-87） |
| 未知 `known=false` | **首次**（`!inSchedule`） | `status='learning'`，`nextReviewAt=明天0点`，`interval=0`（行 88-97） |
| 未知 `known=false` | **已在管线** | **只** `status='learning'`，**不动 SM-2**（行 98-99） |
| 公共 | — | `stats.totalLearned++`、`updateStreak`、`persist`（行 100-102） |

> **设计意图**：避免重复学习"复习中的词"破坏 SM-2 间隔曲线。

### 7.3 强制练习模式（Force Practice）流程

> 涉及文件：DayLearn.vue, Practice.vue, learning.js

```
DayLearn 末词
  ├─ settings.data.forcePractice = false  → store.completeDay(day) + saveDayProgress(day, 0)
  │                                       (DayLearn.vue:141-147)
  └─ settings.data.forcePractice = true   → store.setDayNeedsPractice(day, true)
                                          → router.replace(`/practice/${day}?via=force`)
                                          (DayLearn.vue:137-139)

  Practice 入口守卫：
  ├─ settings.data.forcePractice && store.getDayNeedsPractice(day)
  │   → router.replace(`/practice/${day}?via=force`)   (DayLearn.vue:86-90)
  └─ 未完成 + 有待复习 → 复习优先           (Practice.vue:301-306)

  Practice 完成末题（nextQuestion 行 392-410）：
  ├─ isForcePractice = (route.query.via === 'force')   (Practice.vue:131)
  ├─ forcePractice 模式：completeDay(day) + setDayNeedsPractice(day, false)
  │                                              (Practice.vue:400-403)
  └─ 任意模式：清 dayProgress[day] 的 practice 字段，保留 wordIndex
                                              (Practice.vue:404-408)
```

**`dayProgress[day]` 形态**（核心 state，learning.js:215-245）：
- **旧形态**：`Number`（仅 `wordIndex`）
- **新形态**：`{ wordIndex, needsPractice?, practiceIndex?, savedSeeds?, practiceStats? }`
- 兼容读取在 `getDayProgress()`（行 216-221）— `typeof === 'object'` 时取 `wordIndex`

### 7.4 练习题保存（**Saved Seeds**）

> 目的：导出文件最小化（Practice.vue:265-298 注释"大幅减小导出文件"）
> 实现位置：`Practice.vue:412-429`（`savePracticeProgress`）+ `Practice.vue:266-298`（`restoreQuestions`）

**保存内容**（行 415-427）：
```js
seeds = questions.map(q => ({ audioWord: q.word, type: q.type }))
// → 存为 dayProgress[day].savedSeeds
```

**恢复流程**（Practice.vue:300-322）：
1. `onMounted` 检查 `state.dayProgress[day].savedSeeds`
2. 若有 → `restoreQuestions(seeds)` 重建 `questions.value`
3. 同时恢复 `practiceIndex` 和 `practiceStats { score, correct, wrong, combo, maxCombo }`

**Question 对象字段**（Practice.vue:225-258）：
- `type`: `'e2c'`（英选中） / `'c2e'`（中选英） / `'audio'`（听音）
- `question`（e2c: word；c2e: meaning；audio: ''）
- `prompt`（中文提示）
- `options[4]`（正确项 + 3 随机干扰）
- `answer`（正确项在 options 的索引）
- `audioWord`（用于发音/种子）
- `answerMeaning`（揭示答案用）

**题型比例**（Practice.vue:199-202）：`e2c = 40%`, `c2e = 40%`, `audio = 20%`（向上取整后剩余归 audio）

### 7.5 Review 进度保存/加载

> 实现位置：`d:/WorkBuddy/vocab-learning-app/src/views/Review.vue`
> 存储 key：`'wordcraft_review_progress'`（行 190，常量 REVIEW_PROGRESS_KEY）

**保存**（行 192-200 `saveReviewProgress`）：
```js
if (isWrongReview || isWordbookReview) return  // 错题/生词本不保存
localStorage.setItem(REVIEW_PROGRESS_KEY, JSON.stringify({
  index, reviewed, reviewList
}))
```
调用时机：每答一题后（行 250）、完成时（行 253 `clearReviewProgress`）。

**加载**（行 202-217 `loadReviewProgress`）：
```js
const source = route.query.source  // 行 204: 路由参数守卫
if (source === 'wrongwords' || source === 'wordbook') return false
// ... 从 localStorage 恢复 reviewList/index/reviewed
```
**首次**（行 174）：`watch(reviewWords, ..., { immediate: true })` 触发 → 优先 `loadReviewProgress()`，否则快照 `reviewList = [...words]`。


### 7.6 错题本 / 生词本 / 复习合并列表

> 集中在 `d:/WorkBuddy/vocab-learning-app/src/views/Review.vue:124-162` 的 `reviewWords` computed

**三种模式**（由 `route.query.source` 决定，Review.vue:117-118）：

| 模式 | source | 列表来源 | 是否更新 SM-2 |
|---|---|---|---|
| 主线复习 | 无 | `wrongWords`（不在 due 中）+ `dueReviewWords` | **是**（行 237-239） |
| 错题复习 | `'wrongwords'` | `store.wrongWordsList` 全量 | 否（仅 `removeWrongWord`） |
| 生词本复习 | `'wordbook'` | `store.wordBookWords` 全量 | 否 |

**主线合表逻辑**（行 144-161）：
1. 错题本过滤掉"已在到期词列表中"的（避免重复）
2. 错题本置 `isWrong=true` 放最前
3. 跟 `dueReviewWords` 拼接（错题优先）
4. 错题同样打 `isWrong=true`

**生词本复习特殊处理**（行 135-142）：
- 对每个生词调用 `store.initWordState(wid)` 确保有状态
- 用 `wrongWordsList.some(...)` 判断它是否同时是错题

### 7.7 Review 质量反馈（`rateQuality` 行 233-255）

| Quality | 含义 | 按钮 |
|---|---|---|
| `0` | 忘记 😵 | type=danger |
| `1` | 模糊 😐 | type=warning |
| `2` | 记得 😊 | type=primary |

- **只在主线复习 + 非错题词**时调 `store.reviewWord()`（行 237-239）
- 答对（`quality >= 1`）+ `isWrong` → `store.removeWrongWord()`
- 末题答完 → `finished=true` + `clearReviewProgress()`

### 7.8 错题入库触发点

| 触发位置 | 行号 | 来源 |
|---|---|---|
| `Practice.vue:selectOption` 答错分支 | 376 | `audioWord` → `allWords.find` → `addWrongWord` |
| `Review.vue:rateQuality` 答对分支 | 242 | **从错题本移除**（不增） |

---

## 8. 横切关注点 (Cross-Cutting Concerns)

### 8.1 主题变量（CSS Custom Properties）

> **唯一定义位置**：`d:/WorkBuddy/vocab-learning-app/src/App.vue:35-61`（全局 `<style>`，非 scoped）

| 变量 | Light（`:root`） | Dark（`[data-theme="dark"]`） | 行号 |
|---|---|---|---|
| `--bg-primary` | `#F5F7FA` | `#1A1A2E` | App.vue:36, 50 |
| `--bg-card` | `#FFFFFF` | `#252540` | 37, 51 |
| `--text-primary` | `#1A1A2E` | `#E5E7EB` | 38, 52 |
| `--text-secondary` | `#6B7280` | `#9CA3AF` | 39, 53 |
| `--accent` | `#4F46E5` | `#818CF8` | 40, 54 |
| `--accent-light` | `#EEF2FF` | `#1E1B4B` | 41, 55 |
| `--success` | `#10B981` | `#34D399` | 42, 56 |
| `--warning` | `#F59E0B` | `#FBBF24` | 43, 57 |
| `--danger` | `#EF4444` | `#F87171` | 44, 58 |
| `--border` | `#E5E7EB` | `#374151` | 45, 59 |
| `--shadow` | `0 2px 12px rgba(0,0,0,0.06)` | `0 2px 12px rgba(0,0,0,0.3)` | 46, 60 |

**切换机制**：`theme.js:17` `document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')`。
**额外 Vant 集成**（App.vue:74-84）：
- `.van-tabbar` 背景色绑 `--bg-card`
- `.van-nav-bar` 同上
- 深色下 `.van-tabbar-item--active` 用 `rgba(129,140,248,0.15)`（行 77）

### 8.2 语音合成（`speechSynthesis`）

| 文件:行 | 函数 | 用途 |
|---|---|---|
| `d:/WorkBuddy/vocab-learning-app/src/components/WordCard.vue:107-114` | `speak()` | 翻转卡片自动发音（条件 `speakOnFlip`） |
| `d:/WorkBuddy/vocab-learning-app/src/views/DayLearn.vue:164-174` | `watch(currentWord)` | 切词后 300ms 自动发音（行 167-172） |
| `d:/WorkBuddy/vocab-learning-app/src/views/DayLearn.vue:178` | `onBeforeUnmount` | **离开时 cancel** |
| `d:/WorkBuddy/vocab-learning-app/src/views/Practice.vue:186-194` | `speakWord()` | 每次发音前 **先 cancel**（行 188） |
| `d:/WorkBuddy/vocab-learning-app/src/views/Practice.vue:324` | `onMounted` | 进入时清残留语音 |
| `d:/WorkBuddy/vocab-learning-app/src/views/Review.vue:284-294` | `watch(currentReviewWord)` | 切复习词后 300ms 自动发音 |
| `d:/WorkBuddy/vocab-learning-app/src/views/WordBook.vue:109-116` | `speakDetail()` | 详情弹窗发音按钮 |

**公共参数**（所有调用点一致）：`lang='en-US'`，`rate=0.8`。
**存在性检查**：均先 `'speechSynthesis' in window` 防御。
**cancel 用法**：仅在视图切换时清（DayLearn.vue:178, Practice.vue:188, 324）。

### 8.3 Vant 4 深色模式覆盖（`[data-theme="dark"]` 选择器）

> 主入口：`App.vue:49-61`（CSS 变量切换）
> 局部覆盖（除主变量外还需细调的场景）：

| 文件:行 | 选择器 | 覆盖内容 |
|---|---|---|
| App.vue:77 | `[data-theme="dark"] .van-tabbar-item--active` | `background: rgba(129,140,248,0.15)` |
| App.vue:84 | `[data-theme="dark"] .van-nav-bar` | 强制 `background: var(--bg-card)` |
| Practice.vue:508-510 | `.stat-card.danger` | 深色红 `#3B1212` |
| Practice.vue:546-549 | `.stat-card.combo-warm` | `#3B1F0A` + `#F59E0B` 边 |
| Practice.vue:557-560 | `.stat-card.combo-hot` | `#3B2E00` + 边 |
| Practice.vue:569-573 | `.stat-card.combo-fire` | 渐变 `#4A2E00 → #78350F` + 强阴影 |
| Practice.vue:681-683 | `.option.correct` | 绿底 `#064E3B` |
| Practice.vue:691-693 | `.option.wrong` | 红底 `#7F1D1D` |
| Review.vue:353-355 | `.stat-card.danger` | `#3B1212` |
| SettingsPanel.vue:393 | `.device-option.active` | 暗色琥珀 `#3B2A00 / #FBBF24 / #F59E0B` |

### 8.4 Vant 组件全局注册（main.js:29-44）

```
Button, NavBar, Tabbar, TabbarItem, Icon, ActionSheet, Cell, CellGroup,
Overlay, Dialog, SwipeCell, Toast, Switch, Field, Popup, VanProgress
```
**`Progress` 别名**为 `VanProgress`（main.js:7, 44）— 因为 `Progress` 与 Vant 内部命名冲突。


### 8.5 跨视图共享工具

| 工具 | 导出 | 共享给 |
|---|---|---|
| `generateWordId(word)` | learning.js:275 | DayLearn, Practice, Review, WordBook, SettingsPanel（test data） |
| `formatTime(seconds)` | useTimer.js:18 | DayLearn, Practice, Review |
| `useTimer()` | useTimer.js:3 | DayLearn, Practice, Review |
| `localStorage.*`（间接经 store） | 4 个 store | SettingsPanel（直接读写） |

### 8.6 开发模式（Dev Hooks）

| 触发 | 位置 | 效果 |
|---|---|---|
| `?dev` URL 参数 | App.vue:26, SettingsPanel.vue:121 | 暴露"解锁全部天数"开关和"创建测试数据"按钮 |
| "解锁全部天数"开关 | SettingsPanel.vue:51-55 | 通过 `inject('unlockAll')` 注入到 Home.vue，绕过 `day <= currentDay` 限制（Home.vue:150） |
| "创建测试数据" / A / B | SettingsPanel.vue:56-70 | 直接 `localStorage.setItem('wordcraft_vocab', ...)` 后 reload |

### 8.7 反馈上传（外部依赖）

> `SettingsPanel.vue:343-361` 异步 `POST https://wordcraft-feedback.ksjbm.com/`
> Payload：`{ body, device, nick, time }`
> 设备探测：行 126-131 正则 `iPad|Android(?!.*Mobile)` / `Mobile|Android`

### 8.8 构建/打包注意事项（静态观察）

- `main.js:5` `import 'vant/lib/index.css'` — Vant CSS 全量引入
- `App.vue:34` 是根 `<style>` 块（非 scoped），包含 `:root` 与 `[data-theme="dark"]` 全局变量
- `WordCard.vue:399-407` 含一个非 scoped 的 `<style>` 块用于强制 `!important` 颜色
- Pinia 顺序：`app.use(router)` → `app.use(createPinia())`（main.js:45, 46）— 注意：先 router 后 pinia

---

## 附录 A：词汇数据结构（`src/data/vocabulary.json`）

> 通过 `learning.js:5` 导入 `vocabularyData`，结构（由 `allWords` computed 推得）：

```jsonc
{
  "totalDays": 28,                                // learning.js:211
  "days": [
    {
      "day": 1,
      "categories": [
        { "name": "...", "words": [
            { "word": "...", "phonetic": "...", "meaning": "...", "pos": "n./v./..." }
        ]}
      ]
    }
  ]
}
```

派生字段（在 store 中附加）：
- `allWords[]` 中：附加 `day`, `title`（行 34）
- `getDayWords(day)` 中：附加 `day`, `category`（行 48）

---

## 附录 B：关键文件快速跳转

| 概念 | 文件:行 |
|---|---|
| 入口 | `d:/WorkBuddy/vocab-learning-app/src/main.js:1` |
| 根布局 | `d:/WorkBuddy/vocab-learning-app/src/App.vue:1` |
| SM-2 算法 | `d:/WorkBuddy/vocab-learning-app/src/utils/memoryCurve.js:18` |
| 主 store | `d:/WorkBuddy/vocab-learning-app/src/stores/learning.js:11` |
| 持久化 | `d:/WorkBuddy/vocab-learning-app/src/utils/storage.js:3, 18, 28` |
| 主题切换 | `d:/WorkBuddy/vocab-learning-app/src/stores/theme.js:10` |
| 路由表 | `d:/WorkBuddy/vocab-learning-app/src/main.js:15` |
| 强制练习跳转 | `d:/WorkBuddy/vocab-learning-app/src/views/DayLearn.vue:137-139` |
| 练习题生成 | `d:/WorkBuddy/vocab-learning-app/src/views/Practice.vue:196` |
| 练习题恢复 | `d:/WorkBuddy/vocab-learning-app/src/views/Practice.vue:266` |
| 复习合并列表 | `d:/WorkBuddy/vocab-learning-app/src/views/Review.vue:125` |
| 复习进度保存 | `d:/WorkBuddy/vocab-learning-app/src/views/Review.vue:192` |
| 复习进度加载 | `d:/WorkBuddy/vocab-learning-app/src/views/Review.vue:202` |
| 错题入库 | `d:/WorkBuddy/vocab-learning-app/src/views/Practice.vue:376` |
| 错题清出 | `d:/WorkBuddy/vocab-learning-app/src/views/Review.vue:242` |
| markWord 核心 | `d:/WorkBuddy/vocab-learning-app/src/stores/learning.js:68` |
| generateWordId | `d:/WorkBuddy/vocab-learning-app/src/stores/learning.js:275` |
| CSS 变量定义 | `d:/WorkBuddy/vocab-learning-app/src/App.vue:35, 49` |
| Vant 注册 | `d:/WorkBuddy/vocab-learning-app/src/main.js:29-44` |

---

**文档版本**：v1.0
**生成时间参考**：2026-06-10
**覆盖度**：所有要求 1-8 节 + 2 个附录
