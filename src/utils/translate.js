/**
 * MyMemory 翻译 API 封装
 */

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get'

/**
 * 翻译单个英文单词 → { word, meaning, phonetic }
 */
export async function translateWord(word) {
  const trimmed = word.trim().toLowerCase()
  if (!trimmed) throw new Error('单词不能为空')
  if (!/^[a-zA-Z\s-]+$/.test(trimmed)) throw new Error('仅支持英文单词')

  try {
    const res = await fetch(`${MYMEMORY_URL}?q=${encodeURIComponent(trimmed)}&langpair=en|zh`)
    if (!res.ok) throw new Error('翻译服务不可用')
    const data = await res.json()

    if (data.responseStatus === 200 && data.responseData) {
      return {
        word: trimmed,
        meaning: data.responseData.translatedText || '',
        phonetic: extractPhonetic(data)
      }
    }

    throw new Error(data.responseDetails || '翻译失败')
  } catch (e) {
    if (e.message.includes('翻译') || e.message.includes('单词')) throw e
    throw new Error('翻译服务连接失败，请检查网络')
  }
}

/**
 * 批量翻译多个单词
 */
export async function translateBatch(words) {
  const results = []
  const errors = []
  for (const w of words) {
    try {
      const result = await translateWord(w)
      if (result.meaning) results.push(result)
      else errors.push(w)
    } catch {
      errors.push(w)
    }
  }
  return { results, errors }
}

/**
 * 从 API 响应中提取音标
 */
function extractPhonetic(data) {
  const matches = data.matches || []
  for (const m of matches) {
    if (m.segment === data.responseData?.translatedText?.split('|||')[0]) continue
    // 有些返回数据包含音标，但目前MyMemory不直接提供
  }
  return ''
}
