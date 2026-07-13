/**
 * 生成单词本学习报告分享图片（Canvas → PNG）
 * @param {object} report 报告数据
 * @param {string} bookName 单词本名称
 */
export function drawWordbookShareImage(report, bookName = '') {
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

  // Logo 图标
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
  ctx.fillText(`${bookName} · 学习报告`, 150, 130)
  ctx.globalAlpha = 1

  // 生成日期
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'right'
  ctx.globalAlpha = 0.85
  ctx.fillText(dateStr, W - 60, 130)
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'

  // 四格摘要卡片
  const cardY = 220
  const cardW = 155
  const cardGap = 14
  const cardStartX = 34
  const summaryItems = [
    { icon: '📝', value: report.practiceCount, label: '练习次数', color: '#3B82F6' },
    { icon: '🔄', value: report.currentRound + 1, label: '当前轮次', color: '#8B5CF6' },
    { icon: '🕐', value: formatTime(report.totalDuration), label: '练习时长', color: '#10B981' },
    { icon: '🎯', value: report.accuracy + '%', label: '正确率', color: '#F59E0B' }
  ]
  summaryItems.forEach((item, i) => {
    const x = cardStartX + (cardW + cardGap) * i
    ctx.fillStyle = 'rgba(0,0,0,0.06)'
    fillRoundRect(ctx, x + 2, cardY + 2, cardW, 130, 16)
    ctx.fillStyle = card
    fillRoundRect(ctx, x, cardY, cardW, 130, 16)
    ctx.font = '32px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(item.icon, x + cardW / 2, cardY + 46)
    ctx.fillStyle = item.color
    ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(String(item.value), x + cardW / 2, cardY + 84)
    ctx.fillStyle = sub
    ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(item.label, x + cardW / 2, cardY + 112)
  })

  // ===== 答题统计卡片（环形图） =====
  const y1 = 385
  const mx1 = 30, my1 = y1, mw1 = W - 60

  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, mx1 + 2, my1 + 2, mw1, 420, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, mx1, my1, mw1, 420, 18)

  ctx.fillStyle = text
  ctx.font = 'bold 26px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🥧 答题统计', mx1 + 20, my1 + 46)

  // 绘制环形图
  const cx = mx1 + mw1 / 2
  const ringY = my1 + 200
  const r = 90
  const ringW = 24
  const total = report.totalCorrect + report.totalWrong || 1

  // 背景环
  ctx.beginPath()
  ctx.arc(cx, ringY, r, 0, Math.PI * 2)
  ctx.lineWidth = ringW
  ctx.strokeStyle = '#E2E8F0'
  ctx.stroke()

  // 正确段（绿色）
  if (report.totalCorrect > 0) {
    const angle = (report.totalCorrect / total) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, ringY, r, -Math.PI / 2, -Math.PI / 2 + angle)
    ctx.lineWidth = ringW
    ctx.strokeStyle = '#10B981'
    ctx.stroke()
  }

  // 错误段（红色）
  if (report.totalWrong > 0) {
    const correctAngle = (report.totalCorrect / total) * Math.PI * 2
    const wrongAngle = (report.totalWrong / total) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, ringY, r, -Math.PI / 2 + correctAngle, -Math.PI / 2 + correctAngle + wrongAngle)
    ctx.lineWidth = ringW
    ctx.strokeStyle = '#EF4444'
    ctx.stroke()
  }

  // 中心文字
  ctx.fillStyle = text
  ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(total), cx, ringY + 14)
  ctx.fillStyle = sub
  ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('总题数', cx, ringY + 38)
  ctx.textAlign = 'left'

  // 四个标注
  const legendY = my1 + 330
  const labels = [
    { label: '正确题数', val: report.totalCorrect, color: '#10B981' },
    { label: '错误题数', val: report.totalWrong, color: '#EF4444' },
    { label: '本轮已学', val: report.roundLearned, color: '#3B82F6' },
    { label: '本轮未学', val: report.roundUnlearned, color: '#9CA3AF' }
  ]
  labels.forEach((l, i) => {
    const lx = mx1 + 30 + (i % 2) * 340
    const ly = legendY + Math.floor(i / 2) * 36
    ctx.fillStyle = l.color
    ctx.fillRect(lx, ly + 2, 14, 14)
    ctx.fillStyle = text
    ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(l.label, lx + 22, ly + 14)
    ctx.fillStyle = sub
    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(String(l.val), lx + 150, ly + 14)
  })

  // ===== 错题 TOP 5 卡片 =====
  const topWrong = report.topWrongWords || []
  const topCount = Math.min(topWrong.length, 5)
  const mcH = topCount === 0 ? 120 : 80 + topCount * 64
  const y2 = my1 + 440
  const mx2 = 30, my2 = y2, mw2 = W - 60

  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, mx2 + 2, my2 + 2, mw2, mcH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, mx2, my2, mw2, mcH, 18)

  ctx.fillStyle = text
  ctx.font = 'bold 26px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('🔥 错题 TOP 5', mx2 + 20, my2 + 46)

  if (topWrong.length === 0) {
    ctx.fillStyle = '#10B981'
    ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText('🎉 暂无错题，继续保持！', mx2 + 20, my2 + 82)
  } else {
    topWrong.slice(0, 5).forEach((w, i) => {
      const ry = my2 + 74 + i * 64

      const rankColors = ['#FEF3C7', '#F3F4F6', '#FED7AA']
      ctx.fillStyle = rankColors[i] || '#F1F5F9'
      ctx.beginPath()
      ctx.arc(mx2 + 40, ry + 14, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = i < 3 ? '#B45309' : sub
      ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(i + 1), mx2 + 40, ry + 20)
      ctx.textAlign = 'left'

      ctx.fillStyle = text
      ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(w.word, mx2 + 70, ry + 12)
      ctx.fillStyle = sub
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(w.meaning.length > 18 ? w.meaning.slice(0, 17) + '…' : w.meaning, mx2 + 70, ry + 34)

      ctx.fillStyle = '#EF4444'
      ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${w.count}次`, mw2 + 10, ry + 14)
      ctx.textAlign = 'left'

      const pbY = ry + 42
      const pbMaxW = mw2 - 40
      const pbW = (w.percent / 100) * pbMaxW
      ctx.fillStyle = '#E2E8F0'
      fillRoundRect(ctx, mx2 + 20, pbY, pbMaxW, 5, 2.5)
      if (pbW > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.35 + w.percent / 180})`
        fillRoundRect(ctx, mx2 + 20, pbY, pbW, 5, 2.5)
      }
    })
  }

  const y3 = my2 + mcH + 24

  // 底部
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y3, W - 60, 100, 16)
  ctx.fillStyle = sub
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🏆 28 天主题分类 + 艾宾浩斯智能复习', W / 2, y3 + 44)
  ctx.fillStyle = accent
  ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('https://parkerwang312.github.io/wordcraft-vocab/', W / 2, y3 + 74)
  ctx.textAlign = 'left'

  // 裁剪到实际内容高度
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = y3 + 130
  const finalCtx = canvas.getContext('2d')
  finalCtx.drawImage(tmpCanvas, 0, 0, W, y3 + 130, 0, 0, W, y3 + 130)

  return new Promise((resolve) => {
    canvas.toBlob(blob => resolve(blob), 'image/png', 0.95)
  })
}

function formatTime(seconds) {
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
