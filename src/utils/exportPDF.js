/**
 * 单词本 PDF 导出工具
 * 格式参考 Classic Vocabulary List 双栏排版
 * NotoSansSC 字体在导出时按需从 CDN 加载
 */
import { jsPDF } from 'jspdf'

// CDN 字体 URL（Google Fonts 官方仓库，约 16MB）
const FONT_URL =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf'

let fontCache = null

/**
 * 加载 NotoSansSC 字体（仅首次导出时下载，后续从缓存取）
 * @param {Function} onProgress - 进度回调 (0-100)
 */
async function loadFont(onProgress) {
  if (fontCache) return fontCache

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', FONT_URL, true)
    xhr.responseType = 'arraybuffer'

    xhr.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        fontCache = xhr.response
        resolve(fontCache)
      } else {
        reject(new Error(`字体加载失败: HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('字体加载失败：网络错误'))
    xhr.send()
  })
}

/**
 * 截断长文本
 */
function truncate(text, maxLen) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text
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

  // 注册中文字体
  doc.addFileToVFS('NotoSansSC.ttf', fontData)
  doc.addFont('NotoSansSC.ttf', 'NotoSansSC', 'normal')
  doc.setFont('NotoSansSC', 'normal')

  // 布局参数
  const margin = 10
  const colGap = 6
  const colW = (pageW - margin * 2 - colGap) / 2
  const rowsPerPage = 40
  const wordsPerPage = rowsPerPage * 2
  const totalPages = Math.ceil(words.length / wordsPerPage)
  const headerH = 22
  const rowH = 6.5
  const footerH = 8

  function drawPage(pageIdx) {
    if (pageIdx > 0) doc.addPage()

    // 标题
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('Classic Vocabulary List', pageW / 2, 18, { align: 'center' })

    // 副标题
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Title: ${bookName}    Date:   /   /`, margin, 26)

    // 表头背景
    const y0 = 32
    doc.setFillColor(230, 230, 230)
    doc.rect(margin, y0, colW, 6, 'F')
    doc.rect(margin + colW + colGap, y0, colW, 6, 'F')

    // 表头文字
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text('No.   Word         Meaning', margin + 1, y0 + 4.2)
    doc.text('No.   Word         Meaning', margin + colW + colGap + 1, y0 + 4.2)

    // 单词行
    const start = pageIdx * wordsPerPage
    const end = Math.min(start + wordsPerPage, words.length)

    for (let i = start; i < end; i++) {
      const localIdx = i - start
      const row = Math.floor(localIdx / 2)
      const col = localIdx % 2
      const x = col === 0 ? margin : margin + colW + colGap
      const y = y0 + 7 + row * rowH

      const w = words[i]
      const no = String(i + 1).padStart(3, ' ')
      const word = truncate(w.word, 10).padEnd(11, ' ')
      const meaning = truncate(w.meaning, 28)

      // 交替行背景
      if (row % 2 === 0) {
        doc.setFillColor(248, 248, 248)
        doc.rect(x, y - 3.5, colW, rowH, 'F')
      }

      doc.setFontSize(8.5)
      doc.setTextColor(40, 40, 40)
      doc.text(`${no}  ${word} ${meaning}`, x + 1, y + 0.5)
    }

    // 页码
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(`- ${pageIdx + 1} -`, pageW / 2, pageH - 5, { align: 'center' })
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
