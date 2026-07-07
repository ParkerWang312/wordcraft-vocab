/**
 * 百度语音识别代理服务
 *
 * 用法：
 *   1. npm install express cors node-fetch
 *   2. node proxy/baidu-asr-proxy.js
 *
 *   或在 package.json 添加脚本: "proxy": "node proxy/baidu-asr-proxy.js"
 *
 * Vercel 部署：将 proxy/api/asr.js 部署为 Serverless Function
 */

const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Baidu OAuth: 获取 access_token（缓存至过期）
let cachedToken = null
let tokenExpires = 0

async function getAccessToken() {
  const key = process.env.BAIDU_API_KEY || ''
  const secret = process.env.BAIDU_SECRET_KEY || ''
  if (!key || !secret) throw new Error('缺少 BAIDU_API_KEY / BAIDU_SECRET_KEY 环境变量')

  if (cachedToken && Date.now() < tokenExpires) return cachedToken

  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${key}&client_secret=${secret}`
  const res = await fetch(url).then(r => r.json())

  if (res.error) throw new Error(`Baidu OAuth error: ${res.error_description}`)

  cachedToken = res.access_token
  tokenExpires = Date.now() + (res.expires_in - 300) * 1000
  return cachedToken
}

// POST /asr
// Body: { audio: "<base64>", format: "wav", rate: 16000 }
app.post('/asr', async (req, res) => {
  try {
    const { audio, format = 'wav', rate = 16000, lang = 'en' } = req.body
    if (!audio) return res.status(400).json({ error: '缺少 audio 字段' })

    const token = await getAccessToken()
    const baiduRes = await fetch('https://vop.baidu.com/server_api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format,
        rate,
        channel: 1,
        cuid: 'wordcraft',
        token,
        dev_pid: lang === 'en' ? 1737 : 1537,  // 1737=英文, 1537=中文
        speech: audio,
        len: Math.ceil(audio.length * 3 / 4)
      })
    }).then(r => r.json())

    if (baiduRes.err_no === 0 && baiduRes.result?.[0]) {
      res.json({ text: baiduRes.result[0] })
    } else {
      res.json({ error: baiduRes.err_msg || '识别失败', code: baiduRes.err_no })
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 健康检查
app.get('/health', (_, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`[ASR Proxy] http://localhost:${PORT}`))
