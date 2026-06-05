# WordCraft 词匠

**28天英语词汇记忆训练营** — 基于分类记忆 + 艾宾浩斯遗忘曲线的移动端词汇学习应用。

## 功能

- 📚 **28天分类学习** — 每天一个主题，循序渐进
- ✍️ **练习模式** — 选择题型，含连击计分，正确率≥80%通关
- 🔄 **智能复习** — SM-2记忆曲线算法，自动安排6轮间隔复习
- ⭐ **生词本** — 收藏不认识的单词，集中攻克
- 🔊 **发音播放** — Web Speech API，即点即读
- 🌓 **主题切换** — 明亮/暗黑模式
- 💾 **离线可用** — localStorage 存储全部学习数据

## 技术栈

Vue 3 + Vite + Vant 4 + Pinia

## 部署

推送到 GitHub 仓库后，GitHub Actions 自动构建并部署到 GitHub Pages。

访问地址：`https://<username>.github.io/wordcraft-vocab/`

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
# 输出到 dist/ 目录
```
