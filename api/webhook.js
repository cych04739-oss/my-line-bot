export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("LINE Bot is running");
  }

  try {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type !== "message" || event.message.type !== "text") {
        continue;
      }

      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "你是嘉基6A病房的衛教聊天機器人，請用繁體中文、簡單清楚、溫柔的語氣回答。若遇到醫療急症，提醒病人立即通知護理師或就醫。",
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
        }),
      });

      const aiData = await openAiResponse.json();

      const aiText =
        aiData.choices?.[0]?.message?.content ||
        "不好意思，我目前無法產生回覆，請稍後再試。";

      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          replyToken: replyToken,
          messages: [
            {
              type: "text",
              text: aiText,
            },
          ],
        }),
      });
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(200).send("OK");
  }
}
