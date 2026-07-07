/**
 * Vercel Serverless Function: 百度 ASR 代理
 * 部署到 Vercel 时，设置环境变量 BAIDU_API_KEY 和 BAIDU_SECRET_KEY
 */

let cachedToken = null
let tokenExpires = 0

async function getAccessToken() {
  const key = process.env.BAIDU_API_KEY || ''
  const secret = process.env.BAIDU_SECRET_KEY || ''
  if (!key || !secret) throw new Error('缺少环境变量')

  if (cachedToken && Date.now() < tokenExpires) return cachedToken

  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${key}&client_secret=${secret}`
  const res = await fetch(url).then(r => r.json())
  if (res.error) throw new Error(res.error_description)
  cachedToken = res.access_token
  tokenExpires = Date.now() + (res.expires_in - 300) * 1000
  return cachedToken
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { audio, format = 'wav', rate = 16000, lang = 'en' } = req.body
    if (!audio) return res.status(400).json({ error: 'missing audio' })

    const token = await getAccessToken()
    const baiduRes = await fetch('https://vop.baidu.com/server_api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format, rate, channel: 1, cuid: 'wordcraft', token,
        dev_pid: lang === 'en' ? 1737 : 1537,
        speech: audio,
        len: Math.ceil(audio.length * 3 / 4)
      })
    }).then(r => r.json())

    if (baiduRes.err_no === 0 && baiduRes.result?.[0]) {
      res.json({ text: baiduRes.result[0] })
    } else {
      res.json({ error: baiduRes.err_msg || '识别失败' })
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
