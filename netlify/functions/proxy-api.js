// File: netlify/functions/proxy-api.js (ฉบับแก้ไข)
// คัดลอกไปทับของเดิมได้เลย

exports.handler = async function (event, context) {
  // ⭐ MODIFIED: รับ apiKey จาก Client ที่ส่งมา
  const { provider, model, apiKey, systemPrompt, userKeyword } = JSON.parse(event.body);

  // ⭐ REMOVED: ไม่ต้องดึง Key จาก Environment ของ Netlify แล้ว
  // const apiKeys = { ... };

  // ตรวจสอบว่า Client ส่ง Key มาหรือไม่
  if (!apiKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `API Key is missing.` }),
    };
  }

  let apiUrl = '';
  let headers = {};
  let body = {};

  // ตอนนี้เราจะใช้ `apiKey` ที่ได้รับมาโดยตรง
  if (provider === 'openai') {
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
    body = { model: model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userKeyword }] };
  } else if (provider === 'anthropic') {
    apiUrl = 'https://api.anthropic.com/v1/messages';
    headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
    body = { model: model, system: systemPrompt, max_tokens: 4096, messages: [{ role: 'user', content: userKeyword }] };
  } else if (provider === 'google') {
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    headers = { 'Content-Type': 'application/json' };
    body = { contents: [{ parts: [{ text: `${systemPrompt}\n\n${userKeyword}` }] }], generationConfig: { maxOutputTokens: 4096 } };
  }
  
  // (โค้ดส่วน try...catch ที่เหลือเหมือนเดิมทั้งหมด)
  try {
    // ...
  } catch (error) {
    // ...
  }
};