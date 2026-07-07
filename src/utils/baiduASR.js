/**
 * 百度语音识别前端工具
 * 使用 MediaRecorder 录音 → 发送到代理服务 → 获取识别文本
 */

let mediaRecorder = null
let audioChunks = []

export function isBaiduRecording() {
  return mediaRecorder?.state === 'recording'
}

export async function startBaiduRecord(proxyUrl) {
  if (!proxyUrl) throw new Error('未配置代理地址')

  // 停止之前可能存在的录音
  stopBaiduRecord()

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
  audioChunks = []

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      // 释放麦克风
      stream.getTracks().forEach(t => t.stop())

      if (audioChunks.length === 0) {
        reject(new Error('未检测到语音'))
        return
      }

      try {
        const blob = new Blob(audioChunks, { type: 'audio/webm' })
        const base64 = await blobToBase64(blob)
        const result = await sendToProxy(proxyUrl, base64)
        resolve(result)
      } catch (e) {
        reject(e)
      }
    }

    mediaRecorder.onerror = (e) => reject(e)
    mediaRecorder.start()
  })
}

export function stopBaiduRecord() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.readAsDataURL(blob)
  })
}

async function sendToProxy(proxyUrl, base64Audio) {
  const res = await fetch(`${proxyUrl}/asr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: base64Audio,
      format: 'wav',
      rate: 16000,
      lang: 'en'
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text || ''
}
