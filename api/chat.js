// Allowed origins — only requests from Cove's own domain are accepted
const ALLOWED_ORIGINS = [
  "https://cove-orpin.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
];

// Simple in-memory rate limiter — max 20 requests per IP per minute
const rateLimitMap = new Map();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

export default async function handler(req, res) {
  // Origin check
  const origin = req.headers.origin || "";
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.setHeader("Access-Control-Allow-Origin", origin);

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit by IP
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const { messages, systemPrompt } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  // Cap message history to prevent token abuse
  const cappedMessages = messages.slice(-20);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          ...cappedMessages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply: text });

  } catch (e) {
    return res.status(500).json({ error: "Server error: " + e.message });
  }
}
