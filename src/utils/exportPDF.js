/**
 * 单词本 PDF 导出工具
 * 格式严格参考 Classic Vocabulary List 双栏排版
 */
import { jsPDF } from 'jspdf'

// 字体来源（本地优先，CDN 兜底）
const FONT_URLS = [
  '/fonts/NotoSansSC-Variable.ttf',
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf'
]

let fontCache = null

/**
 * 尝试从多个 CDN 加载字体
 */
async function tryFetch(url, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    xhr.timeout = 120000

    xhr.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) resolve(xhr.response)
      else reject(new Error(`HTTP ${xhr.status}`))
    }

    xhr.onerror = () => reject(new Error('网络错误'))
    xhr.ontimeout = () => reject(new Error('加载超时'))
    xhr.send()
  })
}

/**
 * 加载 NotoSansSC 字体（仅首次导出时下载，后续从缓存取）
 */
async function loadFont(onProgress) {
  if (fontCache) return fontCache

  for (const url of FONT_URLS) {
    try {
      const data = await tryFetch(url, onProgress)
      fontCache = data
      return fontCache
    } catch (e) {
      console.warn(`字体 CDN 加载失败 (${url}): ${e.message}`)
    }
  }

  throw new Error('所有字体 CDN 加载失败，请检查网络连接')
}

/**
 * 截断长文本
 */
function truncate(text, maxLen) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text
}

/**
 * ArrayBuffer 转 base64 字符串
 */
function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * 导出单词本为 PDF
 */
export async function exportWordbookPDF(bookName, words, onProgress) {
  onProgress?.({ stage: 'font', progress: 0 })
  const fontData = await loadFont((p) =>
    onProgress?.({ stage: 'font', progress: p })
  )

  onProgress?.({ stage: 'generate', progress: 0 })

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // 注册中文字体（jsPDF 需要 base64 字符串格式）
  const base64 = arrayBufferToBase64(fontData)
  const fontName = 'NotoSansSC'
  doc.addFileToVFS(fontName, base64)
  doc.addFont(fontName, fontName, 'normal')
  doc.setFont(fontName, 'normal')

  // ============= 布局（按参考 PDF） =============
  const marginX = 12
  const colGap = 6
  const colW = (pageW - marginX * 2 - colGap) / 2
  const rowsPerCol = 21
  const wordsPerPage = rowsPerCol * 2

  // 颜色
  const colorTitle = [40, 40, 40]
  const colorSubtitle = [80, 80, 80]
  const colorTableHead = [50, 50, 50]
  const colorContent = [50, 50, 50]
  const colorFooter = [150, 150, 150]
  const colorTableHeadBg = [220, 220, 220]
  const colorBorder = [170, 170, 170]

  // 高度
  const titleY = 18
  const subtitleY = titleY + 12
  const tableHeadY = subtitleY + 7
  const tableHeadH = 7
  const rowStartY = tableHeadY + tableHeadH + 1
  const footerY = pageH - 7
  const rowH = (footerY - rowStartY) / rowsPerCol  // ≈12mm

  // 列内分栏：No. 9 / Word 20 / Meaning 其余
  const colNo = 9
  const colWord = 20

  const totalPages = Math.ceil(words.length / wordsPerPage)

  // 虚线（jsPDF 没有 dashed line 工具）
  function dashedLine(x1, y1, x2, y2, dashLen = 0.8, gap = 0.5) {
    const dx = x2 - x1, dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return
    const steps = Math.ceil(dist / (dashLen + gap))
    const ux = dx / dist, uy = dy / dist
    for (let i = 0; i < steps; i++) {
      const sx = x1 + ux * i * (dashLen + gap)
      const sy = y1 + uy * i * (dashLen + gap)
      const ex = sx + ux * Math.min(dashLen, dist - i * (dashLen + gap))
      const ey = sy + uy * Math.min(dashLen, dist - i * (dashLen + gap))
      if (ex >= x2 - 0.01) break
      doc.line(sx, sy, ex, ey)
    }
  }

  function drawHeader() {
    // 标题 - Helvetica Bold 22pt 居中
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...colorTitle)
    doc.text('Classic Vocabulary List', pageW / 2, titleY + 4, { align: 'center' })

    // 副标题 - Title 在左，Date 在右
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(...colorSubtitle)
    doc.text(`Title: ${bookName}`, marginX, subtitleY + 2)
    doc.text('Date:    /   /', pageW - marginX, subtitleY + 2, { align: 'right' })
  }

  function drawTableHead() {
    const yRect = tableHeadY
    // 灰色背景
    doc.setFillColor(...colorTableHeadBg)
    doc.rect(marginX, yRect, colW, tableHeadH, 'F')
    doc.rect(marginX + colW + colGap, yRect, colW, tableHeadH, 'F')

    // 表头下边框
    doc.setDrawColor(...colorBorder)
    doc.setLineWidth(0.2)
    doc.line(marginX, yRect + tableHeadH, marginX + colW, yRect + tableHeadH)
    doc.line(marginX + colW + colGap, yRect + tableHeadH, marginX + colW * 2 + colGap, yRect + tableHeadH)

    // 表头文字
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...colorTableHead)
    drawHead(marginX, yRect + 4.8)
    drawHead(marginX + colW + colGap, yRect + 4.8)
  }

  function drawHead(xBase, y) {
    doc.text('No.', xBase + 1, y, { align: 'left' })
    doc.text('Word', xBase + colNo + 1, y, { align: 'left' })
    doc.text('Meaning', xBase + colNo + colWord + 1, y, { align: 'left' })
  }

  function drawRow(col, row, w, noText) {
    const x = col === 0 ? marginX : marginX + colW + colGap
    const y = rowStartY + row * rowH

    // 列内虚线分隔（No./Word/Meaning）
    doc.setDrawColor(...colorBorder)
    doc.setLineWidth(0.15)
    dashedLine(x + colNo, y, x + colNo, y + rowH)
    dashedLine(x + colNo + colWord, y, x + colNo + colWord, y + rowH)

    // No. 序号 - 居中
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...colorContent)
    doc.text(noText, x + colNo / 2, y + rowH * 0.7, { align: 'center' })

    // Word - 粗体英文
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(truncate(w.word, 14), x + colNo + 1, y + rowH * 0.7)

    // Meaning - 中文（NotoSansSC）
    doc.setFont(fontName, 'normal')
    doc.setFontSize(9.5)
    doc.text(truncate(w.meaning, 42), x + colNo + colWord + 1, y + rowH * 0.7)
  }

  function drawFooter(pageIdx) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...colorFooter)
    doc.text(`- ${pageIdx + 1} -`, pageW / 2, footerY + 1, { align: 'center' })
  }

  function drawPage(pageIdx) {
    if (pageIdx > 0) doc.addPage()

    drawHeader()
    drawTableHead()

    // 单词行
    const start = pageIdx * wordsPerPage
    const end = Math.min(start + wordsPerPage, words.length)
    let localIdx = 0
    for (let i = start; i < end; i++) {
      const row = Math.floor(localIdx / 2)
      const col = localIdx % 2
      if (row >= rowsPerCol) break
      drawRow(col, row, words[i], String(i + 1))
      localIdx++
    }

    drawFooter(pageIdx)
  }

  // 逐页绘制
  for (let p = 0; p < totalPages; p++) {
    drawPage(p)
    onProgress?.({ stage: 'generate', progress: Math.round(((p + 1) / totalPages) * 100) })
  }

  return doc.output('blob')
}

/**
 * 分享 PDF 文件（移动端调用系统分享面板）
 */
export async function sharePDF(blob, filename) {
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: filename,
      files: [file]
    })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
