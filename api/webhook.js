export default async function handler(req, res) {
  // 1. 只接收 LINE 的 POST 訊號
  if (req.method !== 'POST') return res.status(200).send('OK');
  try {
    const events = req.body.events;
    // 防呆：如果沒有事件，直接結束
    if (!events || events.length === 0) return res.status(200).send('OK');
    // 核心關鍵修正：精準抓取 LINE 陣列裡的第一筆訊息 [0]
    const event = events[0]; 
    if (!event || event.type !== 'message' || event.message.type !== 'text') {
      return res.status(200).send('OK');
    }
    const userMessage = event.message.text;
    const replyToken = event.replyToken;
    // 2. 呼叫 OpenAI 拿答案
    const openAiResponse = await fetch('https://openai.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + String(process.env.OPENAI_API_KEY).trim()
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: String(userMessage) }]
      })
    });
    const aiData = await openAiResponse.json();
    // 如果 OpenAI 回傳格式錯誤或額度問題，直接在日誌上打印
    if (aiData.error) {
      console.error("OpenAI 拒絕了連線，原因:", JSON.stringify(aiData.error));
      return res.status(200).send('OK');
    }
    const aiResponse = aiData.choices[0].message.content; // 修正：精準對齊 OpenAI 的回答結構
    // 3. 用最安全的格式回傳給手機端的 LINE
    await fetch('https://line.me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + String(process.env.LINE_CHANNEL_ACCESS_TOKEN).trim()
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: 'text', text: String(aiResponse) }]
      })
    });
  } catch (error) {
    console.error("執行失敗，抓到阻擋的小惡魔:", error.message);
  }
  return res.status(200).send('OK');
}
