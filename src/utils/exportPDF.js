/**
 * 单词本 PDF 导出工具
 * 格式参考 Classic Vocabulary List 双栏排版
 * NotoSansSC 字体在导出时按需从 CDN 加载
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
 * @param {Function} onProgress - 进度回调 (0-100)
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
 * @param {string} bookName - 单词本名称
 * @param {Array} words - [{ word, meaning, phonetic? }]
 * @param {Function} onProgress - 进度回调
 * @returns {Blob} PDF Blob
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

  // 布局参数（按参考 PDF 精确还原 A4 双栏）
  const marginX = 12
  const marginTop = 18
  const colGap = 5
  const colW = (pageW - marginX * 2 - colGap) / 2
  const rowsPerCol = 21
  const wordsPerPage = rowsPerCol * 2

  // 颜色（按参考 PDF 视觉）
  const colorTitle = [40, 40, 40]
  const colorSubtitle = [80, 80, 80]
  const colorTableHead = [60, 60, 60]
  const colorRowAlt = [245, 245, 245]
  const colorRowNormal = [255, 255, 255]
  const colorContent = [50, 50, 50]
  const colorFooter = [150, 150, 150]
  const colorTableHeadBg = [220, 220, 220]
  const colorBorder = [180, 180, 180]

  // 标题区域高度
  const titleY = marginTop
  const subtitleY = titleY + 9
  const tableHeadY = subtitleY + 5
  const rowStartY = tableHeadY + 8
  const rowH = (pageH - rowStartY - 12) / rowsPerCol  // 单词行高，自动适应

  // 列内分栏：No. / Word / Meaning
  const colNo = 8     // 序号列宽 (mm)
  const colWord = 18  // 单词列宽
  const colMean = colW - colNo - colWord

  const totalPages = Math.ceil(words.length / wordsPerPage)

  function drawHeader(yHeader) {
    // 标题
    doc.setFontSize(18)
    doc.setTextColor(...colorTitle)
    doc.text('Classic Vocabulary List', pageW / 2, yHeader, { align: 'center' })

    // 副标题
    doc.setFontSize(10.5)
    doc.setTextColor(...colorSubtitle)
    doc.text(`Title: ${bookName}    Date:   /   /`, marginX, yHeader + 7)
  }

  function drawTableHead(yHead) {
    const yRect = yHead - 1
    // 表头背景（每列单独画）
    doc.setFillColor(...colorTableHeadBg)
    doc.rect(marginX, yRect, colW, 6, 'F')
    doc.rect(marginX + colW + colGap, yRect, colW, 6, 'F')

    // 表头下方分隔线
    doc.setDrawColor(...colorBorder)
    doc.setLineWidth(0.2)
    doc.line(marginX, yRect + 6, marginX + colW, yRect + 6)
    doc.line(marginX + colW + colGap, yRect + 6, marginX + colW * 2 + colGap, yRect + 6)

    // 表头文字
    doc.setFontSize(9.5)
    doc.setTextColor(...colorTableHead)
    drawHead(marginX, yHead)
    drawHead(marginX + colW + colGap, yHead)
  }

  function drawHead(xBase, y) {
    doc.text('No.', xBase + 1, y, { align: 'left' })
    doc.text('Word', xBase + colNo + 1, y, { align: 'left' })
    doc.text('Meaning', xBase + colNo + colWord + 1, y, { align: 'left' })
  }

  function drawRow(col, row, w, noText) {
    const x = col === 0 ? marginX : marginX + colW + colGap
    const y = rowStartY + row * rowH

    // 交替行底色
    if (row % 2 === 0) {
      doc.setFillColor(...colorRowAlt)
      doc.rect(x, y, colW, rowH, 'F')
    }

    // 底部细线
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.1)
    doc.line(x, y + rowH, x + colW, y + rowH)

    // 列分隔线（仅每列内）
    doc.setDrawColor(220, 220, 220)
    doc.line(x + colNo, y, x + colNo, y + rowH)
    doc.line(x + colNo + colWord, y, x + colNo + colWord, y + rowH)

    // 文字
    doc.setFontSize(9.5)
    doc.setTextColor(...colorContent)
    doc.text(noText, x + colNo - 1, y + rowH * 0.7, { align: 'right' })
    doc.text(truncate(w.word, 14), x + colNo + 1, y + rowH * 0.7)
    doc.text(truncate(w.meaning, 38), x + colNo + colWord + 1, y + rowH * 0.7)
  }

  function drawFooter(pageIdx) {
    doc.setFontSize(10)
    doc.setTextColor(...colorFooter)
    doc.text(`- ${pageIdx + 1} -`, pageW / 2, pageH - 6, { align: 'center' })
  }

  function drawPage(pageIdx) {
    if (pageIdx > 0) doc.addPage()

    drawHeader(titleY)
    drawTableHead(tableHeadY)

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
    // 降级：直接下载
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
