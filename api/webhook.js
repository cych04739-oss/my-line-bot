export default async function handler(req, res) {
  // 1. 確保只接受 LINE 傳過來的 POST 訊號
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    // 2. 解析 LINE 傳過來的事件資料
    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send('OK');

    // 關鍵修正：精準抓取 LINE 陣列裡的第一筆訊息
    const event = events[0]; 
    if (!event || event.type !== 'message' || event.message.type !== 'text') {
      return res.status(200).send('OK');
    }

    const userMessage = event.message.text;
    const replyToken = event.replyToken;

    // 3. 呼叫 OpenAI 拿答案（使用正確的官方 API 窗口網址）
    const openAiResponse = await fetch('https://openai.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${String(process.env.OPENAI_API_KEY).trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: String(userMessage) }]
      })
    });

    const aiData = await openAiResponse.json();

    // 防呆：如果 OpenAI 爆掉，至少在日誌印出原因
    if (aiData.error) {
      console.error("OpenAI 拒絕連線，原因:", JSON.stringify(aiData.error));
      return res.status(200).send('OK');
    }

    const aiResponse = aiData.choices[0].message.content; 

    // 4. 回傳給手機端的 LINE（使用正確的 LINE 回覆 API 窗口網址）
    await fetch('https://line.me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${String(process.env.LINE_CHANNEL_ACCESS_TOKEN).trim()}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: 'text', text: String(aiResponse) }]
      })
    });

  } catch (error) {
    console.error("執行失敗，抓到小惡魔:", error.message);
  }

  return res.status(200).send('OK');
}

