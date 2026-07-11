/**
 * 单词本每日学习报告 Canvas 绘制
 * 输出 PNG 图片用于分享
 */

const W = 750

export function drawWordbookReport(data) {
  const {
    bookName = '单词本',
    totalSessions = 0,
    totalCorrect = 0,
    totalWrong = 0,
    accuracy = 0,
    totalDuration = 0,
    round = 0,
    topWrongWords = []
  } = data

  const total = totalCorrect + totalWrong
  const isEmpty = total === 0

  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = W
  tmpCanvas.height = 1400
  const ctx = tmpCanvas.getContext('2d')

  const bg = '#F8FAFC'
  const card = '#FFFFFF'
  const text = '#1E293B'
  const sub = '#64748B'
  const accent = '#6366F1'

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, 1400)

  // 顶部渐变
  const topGrad = ctx.createLinearGradient(0, 0, W, 160)
  topGrad.addColorStop(0, '#6366F1')
  topGrad.addColorStop(0.5, '#8B5CF6')
  topGrad.addColorStop(1, '#EC4899')
  ctx.fillStyle = topGrad
  fillRoundRect(ctx, 30, 30, W - 60, 140, 24)

  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  fillRoundRect(ctx, 60, 60, 60, 60, 14)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '38px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('📚', 90, 100)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`《${bookName}》`, 140, 85)
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('每日学习报告', 140, 125)

  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  ctx.textAlign = 'right'
  ctx.globalAlpha = 0.85
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(dateStr, W - 60, 80)
  ctx.globalAlpha = 1

  let y = 200

  if (isEmpty) {
    ctx.fillStyle = card
    fillRoundRect(ctx, 30, y, W - 60, 100, 18)
    ctx.fillStyle = sub
    ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('今日暂无练习记录', W / 2, y + 60)
    ctx.textAlign = 'left'
    y += 130
  } else {
    // 统计卡片
    const cardH = 180
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    fillRoundRect(ctx, 32, y + 2, W - 64, cardH, 18)
    ctx.fillStyle = card
    fillRoundRect(ctx, 30, y, W - 60, cardH, 18)

    // 3x2 网格统计
    const stats = [
      { label: '📖 练习次数', value: `${totalSessions} 次`, color: accent },
      { label: '✅ 正确题数', value: `${totalCorrect} 题`, color: '#10B981' },
      { label: '❌ 错误题数', value: `${totalWrong} 题`, color: '#EF4444' },
      { label: '🎯 正确率', value: `${accuracy}%`, color: '#F59E0B' },
      { label: '⏱️ 练习时长', value: formatDuration(totalDuration), color: '#8B5CF6' },
      { label: '🔄 当前轮次', value: `第 ${round} 轮`, color: '#EC4899' }
    ]

    const cols = 3
    const cellW = (W - 60) / cols
    const cellH = cardH / 2

    stats.forEach((s, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = 30 + col * cellW
      const cy = y + row * cellH

      ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = sub
      ctx.textAlign = 'center'
      ctx.fillText(s.label, cx + cellW / 2, cy + 38)

      ctx.font = 'bold 30px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = s.color
      ctx.fillText(s.value, cx + cellW / 2, cy + 82)
    })
    ctx.textAlign = 'left'

    y += cardH + 24

    // 错误单词 TOP5
    if (topWrongWords.length > 0) {
      const wrongH = 70 + Math.min(topWrongWords.length, 5) * 48
      ctx.fillStyle = 'rgba(0,0,0,0.05)'
      fillRoundRect(ctx, 32, y + 2, W - 64, wrongH, 18)
      ctx.fillStyle = card
      fillRoundRect(ctx, 30, y, W - 60, wrongH, 18)

      ctx.fillStyle = text
      ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(`❌ 易错单词 TOP ${Math.min(topWrongWords.length, 5)}`, 50, y + 38)

      topWrongWords.slice(0, 5).forEach((w, i) => {
        const wy = y + 70 + i * 48
        ctx.fillStyle = text
        ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.fillText(`${i + 1}.`, 50, wy + 17)
        ctx.fillText(w.word, 80, wy + 17)
        ctx.fillStyle = sub
        ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
        const meaningShort = w.meaning?.length > 16 ? w.meaning.slice(0, 15) + '…' : (w.meaning || '')
        ctx.fillText(meaningShort, 260, wy + 17)
        ctx.fillStyle = '#EF4444'
        ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.fillText(`×${w.count}`, 440, wy + 17)
      })

      y += wrongH + 24
    }
  }

  // 底部
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, 60, 16)
  ctx.fillStyle = sub
  ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('WordCraft 词匠 · 单词本学习', W / 2, y + 38)
  ctx.textAlign = 'left'

  y += 80

  // 裁剪
  const actualH = y + 30
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = actualH
  const finalCtx = canvas.getContext('2d')
  finalCtx.drawImage(tmpCanvas, 0, 0, W, actualH, 0, 0, W, actualH)

  return new Promise((resolve) => {
    canvas.toBlob(blob => resolve(blob), 'image/png', 0.95)
  })
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

function formatDuration(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}分${sec}秒`
  return `${sec}秒`
}
