export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { message } = req.body;
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

  if (!NVIDIA_API_KEY) {
    console.error("DEBUG: NVIDIA_API_KEY is missing in Vercel Environment Variables");
    return res.status(500).json({ error: "NVIDIA API Key not configured on Vercel. Please add it to your Vercel Project Settings > Environment Variables." });
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are SmartRoute AI Assistant, a delivery route optimization expert. Help delivery boys with route planning, fuel saving tips, traffic advice. CRITICAL RULE: Keep answers STRICTLY under 2 sentences. Be extremely concise and fast.'
          },
          { role: 'user', content: message }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `API error: ${response.status}`);
    }

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Chat proxy error:", error);
    res.status(500).json({ error: error.message });
  }
}
