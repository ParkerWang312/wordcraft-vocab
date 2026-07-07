/**
 * 生成每日打卡报告分享图片（Canvas → PNG）
 * @param {object} params
 * @param {string} params.nickname    用户昵称
 * @param {number} params.streakDays  连续天数
 * @param {number} params.learned     今日学习数
 * @param {number} params.reviewed    今日复习数
 * @param {number} params.currentDay  当前天数
 * @param {number} params.totalDays   总天数(28)
 * @param {number} params.percentage  学习进度
 * @param {array}  params.wrongWords  今日错词 [{word, meaning}]
 * @param {number} params.wrongRate   错词率(%)
 * @param {number} params.masteryRate 掌握率(%)
 * @param {number} params.totalLearned  累计学习
 * @param {string} params.dayTheme    当日主题
 */
export function drawDailyReport(params) {
  const {
    nickname = '',
    streakDays = 0,
    learned = 0,
    reviewed = 0,
    currentDay = 1,
    totalDays = 28,
    percentage = 0,
    masteryData = [],
  wrongWords = [],
    wrongRate = 0,
    masteryRate = 0,
    totalLearned = 0,
    dayTheme = ''
  } = params

  const W = 750
  // 先画到临时大画布，再裁剪到实际高度（避免 canvas.height= 触发清屏）
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

  // ===== 1. 渐变顶栏 =====
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
  const title = nickname ? `${nickname}的每日打卡` : '我的每日打卡'
  ctx.fillText('WordCraft 词匠', 150, 95)
  ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.globalAlpha = 0.9
  ctx.fillText(title, 150, 130)
  ctx.globalAlpha = 1

  // 日期
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  // 连续天数（>=2 天才显示）
  if (streakDays >= 2) {
    ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'right'
    ctx.globalAlpha = 0.85
    ctx.fillText(`${dateStr}  🔥 连续第${streakDays}天`, W - 60, 130)
  } else {
    ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'right'
    ctx.globalAlpha = 0.85
    ctx.fillText(dateStr, W - 60, 130)
  }
  ctx.globalAlpha = 1
  let y = 220
  const cardY = y, cardH = 170
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, cardY + 2, W - 64, cardH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, cardY, W - 60, cardH, 18)

  // 学习 · 复习 双栏
  const cx = W / 2
  ctx.textAlign = 'center'

  // 左边：新学
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = sub
  ctx.fillText('📖 新学', cx / 2 + 70, cardY + 56)
  ctx.fillStyle = '#3B82F6'
  ctx.font = 'bold 64px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(String(learned), cx / 2 + 70, cardY + 135)
  ctx.fillStyle = sub
  ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('词', cx / 2 + 70 + String(learned).length * 30, cardY + 135)

  // 分隔线
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cardY + 30)
  ctx.lineTo(cx, cardY + cardH - 30)
  ctx.stroke()

  // 右边：复习
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = sub
  ctx.fillText('🔄 复习', cx + cx / 2 - 70, cardY + 56)
  ctx.fillStyle = '#10B981'
  ctx.font = 'bold 64px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(String(reviewed), cx + cx / 2 - 70, cardY + 135)
  ctx.fillStyle = sub
  ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('词', cx + cx / 2 - 70 + String(reviewed).length * 30, cardY + 135)

  ctx.textAlign = 'left'

  // ===== 3. 进度卡片 =====
  y = cardY + cardH + 24
  const progressH = 110
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, y + 2, W - 64, progressH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, progressH, 18)

  ctx.fillStyle = text
  ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(`📊 ${currentDay} / ${totalDays}  ·  学习进度 ${percentage}%`, 50, y + 40)

  // 进度条
  const pbarX = 50, pbarY = y + 60, pbarW = W - 100, pbarH = 14
  ctx.fillStyle = '#E2E8F0'
  fillRoundRect(ctx, pbarX, pbarY, pbarW, pbarH, 7)
  const pfillW = (percentage / 100) * pbarW
  if (pfillW > 0) {
    const pgrad = ctx.createLinearGradient(pbarX, 0, pbarX + pfillW, 0)
    pgrad.addColorStop(0, '#6366F1')
    pgrad.addColorStop(1, '#EC4899')
    ctx.fillStyle = pgrad
    fillRoundRect(ctx, pbarX, pbarY, pfillW, pbarH, 7)
  }

  // ===== 3.5 单词掌握分布环形图 =====
  y += progressH + 24
  const totalWords = masteryData.reduce((s, x) => s + (x.count || 0), 0) || 800
  const pieH = 200
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, y + 2, W - 64, pieH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, pieH, 18)

  ctx.fillStyle = text
  ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('🥧 单词掌握分布', 50, y + 36)

  // 环形图
  const pieCx = y + 120
  const ringR = 56, ringW = 14
  let startAngle = -Math.PI / 2

  masteryData.forEach(seg => {
    if (!seg.count) return
    const angle = (seg.count / totalWords) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(120, pieCx, ringR, startAngle, startAngle + angle)
    ctx.lineWidth = ringW
    ctx.strokeStyle = seg.color
    ctx.stroke()
    startAngle += angle
  })

  // 中心文字
  ctx.fillStyle = text
  ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(totalWords), 120, pieCx + 8)
  ctx.fillStyle = sub
  ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('总词数', 120, pieCx + 26)
  ctx.textAlign = 'left'

  // 图例 2x2
  const legendX = 200
  masteryData.forEach((seg, i) => {
    const lx = legendX + (i % 2) * 260
    const ly = y + 83 + Math.floor(i / 2) * 50
    ctx.fillStyle = seg.color
    ctx.fillRect(lx, ly, 16, 16)
    ctx.fillStyle = text
    ctx.font = '19px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(seg.label, lx + 24, ly + 14)
    const pct = totalWords > 0 ? Math.round((seg.count / totalWords) * 100) : 0
    ctx.fillStyle = sub
    ctx.font = '17px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(`${seg.count} (${pct}%)`, lx + 140, ly + 14)
  })

  // ===== 4. 错词卡片 =====
  y += pieH + 24
  const wrongLen = wrongWords.length
  const wcardH = wrongLen === 0 ? 100 : 70 + Math.min(wrongLen, 8) * 46
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  fillRoundRect(ctx, 32, y + 2, W - 64, wcardH, 18)
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, wcardH, 18)

  ctx.fillStyle = text
  ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(`❌ 今日错词 (${wrongLen}个 · 错率${wrongRate}%)`, 50, y + 40)

  if (wrongLen === 0) {
    ctx.fillStyle = '#10B981'
    ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText('🎉 今天全对，太棒了！', 50, y + 78)
  } else {
    wrongWords.slice(0, 8).forEach((w, i) => {
      const wy = y + 74 + i * 46
      ctx.fillStyle = text
      ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(`${i + 1}.`, 50, wy + 18)
      ctx.fillStyle = text
      ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(w.word, 80, wy + 18)
      ctx.fillStyle = sub
      ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
      const meaningShort = w.meaning?.length > 22 ? w.meaning.slice(0, 21) + '…' : (w.meaning || '')
      ctx.fillText(meaningShort, 250, wy + 18)
    })
    if (wrongLen > 8) {
      ctx.fillStyle = sub
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(`... 及其他 ${wrongLen - 8} 个错词`, 50, y + 74 + 8 * 46 + 8)
    }
  }

  // ===== 5. 底部 =====
  y += wcardH + 16
  const themeH = 60
  ctx.fillStyle = card
  fillRoundRect(ctx, 30, y, W - 60, themeH, 16)

  // 今日主题
  ctx.fillStyle = text
  ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  const themeText = `📖 今日主题：${dayTheme}`
  const themeMaxW = W - 120
  let displayTheme = themeText
  if (ctx.measureText(themeText).width > themeMaxW) {
    while (displayTheme.length > 10 && ctx.measureText(displayTheme + '...').width > themeMaxW) {
      displayTheme = displayTheme.slice(0, -1)
    }
    displayTheme += '...'
  }
  ctx.fillText(displayTheme, 50, y + 40)

  // 底部品牌卡片
  y += themeH + 16
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

  // 裁剪画布到实际内容高度
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
