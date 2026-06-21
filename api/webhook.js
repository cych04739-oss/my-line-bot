export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const events = req.body.events;
  if (!events || events.length === 0) return res.status(200).send('OK');

  const event = events[0];
  if (event.type !== 'message' || event.message.type !== 'text') {
    return res.status(200).send('OK');
  }

  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  try {
    // 1. 問 OpenAI 拿到最聰明的答案
    const aiResponse = await fetch('https://openai.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: userMessage }]
      })
    }).then(res => res.json()).then(data => data.choices[0].message.content);

    // 2. 用最安全的格式回傳給 LINE 手機端
    await fetch('https://line.me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: 'text', text: String(aiResponse) }]
      })
    });

  } catch (error) {
    console.error("AI 或 LINE 連線失敗，原因:", error);
  }

  return res.status(200).send('OK');
}
