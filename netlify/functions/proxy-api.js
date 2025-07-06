// File: netlify/functions/proxy-api.js

exports.handler = async function (event, context) {
  // รับข้อมูลจาก Client ที่ส่งมา
  const { provider, model, apiKey, systemPrompt, userKeyword } = JSON.parse(event.body);

  if (!apiKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `API Key is missing.` }),
    };
  }

  let apiUrl = '';
  let headers = {};
  let body = {};

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

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    // ⭐ START OF MODIFIED ERROR HANDLING
    if (!response.ok) {
        // อ่าน error เป็น text ก่อน เพราะอาจจะไม่ใช่ JSON
        const errorText = await response.text(); 
        let errorMessage = errorText;

        // พยายามแปลงเป็น JSON ถ้าทำได้ ก็ใช้ข้อความจากใน JSON
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorText;
        } catch (e) {
            // ถ้าแปลงไม่ได้ ก็ใช้ errorText ที่เป็นข้อความธรรมดาต่อไป
        }

        // ส่งกลับเป็น JSON ที่ถูกต้องเสมอ
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: errorMessage })
        };
    }
    // ⭐ END OF MODIFIED ERROR HANDLING

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
