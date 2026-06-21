export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const event = req.body.events[0];
  if (!event || event.type !== 'message' || event.message.type !== 'text') {
    return res.status(200).send('OK');
  }

  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  // 1. 問 OpenAI 問題
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

  // 2. 把答案傳回給 LINE
  await fetch('https://line.me', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: 'text', text: aiResponse }]
    })
  });

  return res.status(200).send('OK');
}
