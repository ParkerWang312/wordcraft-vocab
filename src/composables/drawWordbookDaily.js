/**
 * 生成单词本每日打卡报告分享图片（Canvas → PNG）
 * @param {object} report 报告数据
 * @param {string} bookName 单词本名称
 */
export function drawWordbookDailyReport(report, bookName = '') {
  const W = 750
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = W
  tmpCanvas.height = 1600
  const ctx = tmpCanvas.getContext('2d')

  const bg = '#F8FAFC'
  const card = '#FFFFFF'
  const text = '#1E293B'
  const sub = '#64748B'
  const accent = '#6366F1'

  // 背景
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, 1600)

  // 顶部渐变装饰
  const topGrad = ctx.createLinearGradient(0, 0, W, 180)
  topGrad.addColorStop(0, '#6366F1')
  topGrad.addColorStop(0.5, '#8B5CF6')
  topGrad.addColorStop(1, '#EC4899')
  ctx.fillStyle = topGrad
  fillRoundRect(ctx, 30, 30, W - 60, 160, 24)

  // Logo
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  fillRoundRect(ctx, 60, 65, 70, 70, 16)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '44px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('📚', 95, 110)

  // 标题
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 40px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('WordCraft 词匠', 150, 95)
  ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.globalAlpha = 0.9
  ctx.fillText(`${bookName} · 每日打卡`, 150, 130)
  ctx.globalAlpha = 1

  // 日期
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'right'
  ctx.globalAlpha = 0.85
  ctx.fillText(dateStr, W - 60, 130)
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'

  let y = 220

  // ===== 练习统计卡片 =====
  const cardY = y, cardH = 170
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, cardY + 2, W - 64, cardH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, cardY, W - 60, cardH, 18)

  const cx = W / 2
  ctx.textAlign = 'center'

  // 左边：正确
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = sub
  ctx.fillText('✅ 正确', cx / 2 + 70, cardY + 56)
  ctx.fillStyle = '#10B981'
  ctx.font = 'bold 64px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(String(report.totalCorrect), cx / 2 + 70, cardY + 135)
  ctx.fillStyle = sub
  ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('题', cx / 2 + 70 + String(report.totalCorrect).length * 30, cardY + 135)

  // 分隔线
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cardY + 30)
  ctx.lineTo(cx, cardY + cardH - 30)
  ctx.stroke()

  // 右边：错误
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = sub
  ctx.fillText('❌ 错误', cx + cx / 2 - 70, cardY + 56)
  ctx.fillStyle = '#EF4444'
  ctx.font = 'bold 64px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(String(report.totalWrong), cx + cx / 2 - 70, cardY + 135)
  ctx.fillStyle = sub
  ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('题', cx + cx / 2 - 70 + String(report.totalWrong).length * 30, cardY + 135)

  ctx.textAlign = 'left'

  // ===== 进度卡片 =====
  y = cardY + cardH + 24
  const progressH = 110
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, y + 2, W - 64, progressH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, progressH, 18)

  const learned = report.roundLearned || 0
  const unlearned = report.roundUnlearned || 0
  const totalWords = learned + unlearned || 1
  const learnPct = Math.round((learned / totalWords) * 100)

  ctx.fillStyle = text
  ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(`📊 第 ${report.currentRound + 1} 轮  ·  学习进度 ${learnPct}%（${learned}/${totalWords}）`, 50, y + 40)

  // 进度条
  const pbarX = 50, pbarY = y + 60, pbarW = W - 100, pbarH = 14
  ctx.fillStyle = '#E2E8F0'
  fillRoundRect(ctx, pbarX, pbarY, pbarW, pbarH, 7)
  const pfillW = (learnPct / 100) * pbarW
  if (pfillW > 0) {
    const pgrad = ctx.createLinearGradient(pbarX, 0, pbarX + pfillW, 0)
    pgrad.addColorStop(0, '#10B981')
    pgrad.addColorStop(1, '#3B82F6')
    ctx.fillStyle = pgrad
    fillRoundRect(ctx, pbarX, pbarY, pfillW, pbarH, 7)
  }

  // ===== 四格摘要卡片 =====
  y += progressH + 24
  const statsH = 130
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, y + 2, W - 64, statsH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, statsH, 18)

  const statItems = [
    { label: '练习次数', value: report.practiceCount, color: '#3B82F6' },
    { label: '正确率', value: report.accuracy + '%', color: '#10B981' },
    { label: '练习时长', value: formatDuration(report.totalDuration), color: '#8B5CF6' },
    { label: '总题数', value: report.totalCorrect + report.totalWrong, color: '#F59E0B' }
  ]
  const statW = 156, statGap = 14, statStartX = 34
  statItems.forEach((item, i) => {
    const sx = statStartX + (statW + statGap) * i
    ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = item.color
    ctx.fillText(String(item.value), sx + statW / 2, y + 60)
    ctx.fillStyle = sub
    ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(item.label, sx + statW / 2, y + 90)
  })
  ctx.textAlign = 'left'

  // ===== 错题卡片 =====
  y += statsH + 24
  const topWrong = report.topWrongWords || []
  const wrongLen = topWrong.length
  const wcardH = wrongLen === 0 ? 100 : 70 + Math.min(wrongLen, 5) * 64
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, y + 2, W - 64, wcardH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, wcardH, 18)

  ctx.fillStyle = text
  ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(`🔥 错题 TOP ${Math.min(wrongLen, 5)}`, 50, y + 40)

  if (wrongLen === 0) {
    ctx.fillStyle = '#10B981'
    ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText('🎉 暂无错题，继续保持！', 50, y + 78)
  } else {
    topWrong.slice(0, 5).forEach((w, i) => {
      const ry = y + 74 + i * 64
      const rankColors = ['#FEF3C7', '#F3F4F6', '#FED7AA']
      ctx.fillStyle = rankColors[i] || '#F1F5F9'
      ctx.beginPath()
      ctx.arc(50, ry + 14, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = i < 3 ? '#B45309' : sub
      ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(i + 1), 50, ry + 20)
      ctx.textAlign = 'left'

      ctx.fillStyle = text
      ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(w.word, 80, ry + 12)
      ctx.fillStyle = sub
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(w.meaning.length > 18 ? w.meaning.slice(0, 17) + '…' : w.meaning, 80, ry + 34)

      ctx.fillStyle = '#EF4444'
      ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${w.count}次`, W - 50, ry + 14)
      ctx.textAlign = 'left'
    })
  }

  // ===== 底部 =====
  y += wcardH + 16
  const brandH = 80
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, y + 2, W - 64, brandH, 16)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, brandH, 16)

  ctx.fillStyle = sub
  ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🏆 28 天主题分类 + 艾宾浩斯智能复习', W / 2, y + 38)
  ctx.fillStyle = accent
  ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('https://parkerwang312.github.io/wordcraft-vocab/', W / 2, y + 62)
  ctx.textAlign = 'left'

  // 裁剪画布
  const actualHeight = y + brandH + 30
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = actualHeight
  const finalCtx = canvas.getContext('2d')
  finalCtx.drawImage(tmpCanvas, 0, 0, W, actualHeight, 0, 0, W, actualHeight)

  return new Promise((resolve) => {
    canvas.toBlob(blob => resolve(blob), 'image/png', 0.95)
  })
}

function formatDuration(seconds) {
  if (!seconds) return '0分'
  const m = Math.floor(seconds / 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const rm = m % 60
    return `${h}时${rm}分`
  }
  const s = seconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
}
