// ============================================================
//  دالة الخادم (Serverless Function)
//  هذي هي "الوسيط" الآمن بين صفحتك وبين الذكاء الاصطناعي.
//  المفتاح ANTHROPIC_API_KEY يبقى هنا في الخادم ولا يظهر أبداً
//  في المتصفح — عشان ما ينسرق ولا يطق قدام أحد.
//  المتصفح ينادي /api/chat فقط، وهذي الدالة تكلم Anthropic.
// ============================================================

// اختر الموديل: haiku أرخص وأسرع (مناسب للورشة).
// للجودة الأعلى بدّلها إلى "claude-sonnet-5".
const MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req, res) {
  // نقبل فقط طلبات POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "استخدم POST فقط" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "المفتاح غير موجود. أضف ANTHROPIC_API_KEY في إعدادات Vercel.",
    });
  }

  try {
    const { messages, system } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "لا توجد رسائل في الطلب" });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: system || "أنت مساعد ذكي ودود.",
        messages: messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        error: data?.error?.message || "خطأ من واجهة الذكاء الاصطناعي",
      });
    }

    // نجمّع النص من الرد (قد يكون فيه أكثر من قطعة)
    const reply = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message || "خطأ غير متوقع" });
  }
}
