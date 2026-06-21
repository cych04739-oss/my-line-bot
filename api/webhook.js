export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const events = req.body.events;
  if (!events || events.length === 0) return res.status(200).send('OK');

  const event = events[0]; // 強制指向第一筆訊息
  if (!event || event.type !== 'message' || event.message.type !== 'text') {
    return res.status(200).send('OK');
  }

  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  try {
    // 1. 問 OpenAI 拿到最聰明的答案
    const openAiResponse = await fetch('https://openai.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + String(process.env.OPENAI_API_KEY).trim() // 強制清除可能存在的隱形空格
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: String(userMessage) }]
      })
    });

    const aiData = await openAiResponse.json();
    
    // 如果 OpenAI 回傳錯誤，直接顯示在日誌上方便排查
    if (aiData.error) {
      console.error("OpenAI 後端拒絕連線，詳細原因:", JSON.stringify(aiData.error));
      return res.status(200).send('OK');
    }

    const aiResponse = aiData.choices[0].message.content;

    // 2. 用最安全的格式回傳給 LINE 手機端
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
    console.error("執行過程中發生錯誤，原因:", error);
  }

  return res.status(200).send('OK');
}
