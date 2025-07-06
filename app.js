document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const providerSelect = document.getElementById('provider-select');
    const modelSelect = document.getElementById('model-select');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const keywordInput = document.getElementById('keyword-input');
    const promptTemplateSelect = document.getElementById('prompt-template-select');
    const systemPromptInput = document.getElementById('system-prompt-input');
    const promptCountInput = document.getElementById('prompt-count-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');

    // --- DATA & CONFIG ---
    const models = {
        openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        anthropic: [
            'claude-opus-4-20250514',
            'claude-sonnet-4-20250514',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022'
        ],
        google: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest']
    };

    const promptTemplates = {
        default: "You are a creative prompt engineer for Midjourney v7. Create unique, detailed, and creative prompts that will generate interesting images...",
        artistic: "You are an artistic prompt engineer specializing in fine art styles for Midjourney v7...",
        photography: "You are a photography prompt engineer for Midjourney v7...",
        fantasy: "You are a fantasy world prompt engineer for Midjourney v7...",
        'white background': "You are the Photography Tutorials Engineer for Midjourney v7...",
        custom: ""
    };

    // --- FUNCTIONS ---
    function loadApiKey() {
        apiKeyInput.value = localStorage.getItem('userApiKey') || '';
    }

    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('userApiKey', apiKey);
            alert('บันทึก API Key สำเร็จ!');
        } else {
            alert('กรุณาใส่ API Key ก่อนบันทึก');
        }
    }

    function updateModels() {
        const selectedProvider = providerSelect.value;
        modelSelect.innerHTML = '';
        models[selectedProvider].forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
    }

    function updateSystemPrompt() {
        const selectedTemplate = promptTemplateSelect.value;
        if (selectedTemplate === 'custom') {
            systemPromptInput.value = localStorage.getItem('customSystemPrompt') || "กรุณาใส่ System Prompt ของคุณที่นี่...";
            systemPromptInput.readOnly = false;
            systemPromptInput.focus();
        } else {
            systemPromptInput.value = promptTemplates[selectedTemplate];
            systemPromptInput.readOnly = true;
        }
    }

    function saveCustomPrompt() {
        if (promptTemplateSelect.value === 'custom') {
            localStorage.setItem('customSystemPrompt', systemPromptInput.value);
        }
    }

    async function handleGeneration() {
        const apiKey = localStorage.getItem('userApiKey');
        if (!apiKey) {
            alert('กรุณาตั้งค่าและบันทึก API Key ก่อนสร้าง Prompt');
            return;
        }

        const keyword = keywordInput.value.trim();
        if (!keyword) {
            alert('กรุณาใส่ Keyword ที่ต้องการ');
            return;
        }

        const systemPrompt = systemPromptInput.value.trim();
        if (!systemPrompt) {
            alert('System Prompt ว่างเปล่า กรุณาเลือกรูปแบบหรือกำหนดเอง');
            return;
        }

        generateBtn.disabled = true;
        resultContainer.innerHTML = '<p class="placeholder">กำลังสร้าง Prompt กรุณารอสักครู่...</p>';

        try {
            const provider = providerSelect.value;
            const model = modelSelect.value;
            const count = parseInt(promptCountInput.value, 10);
            const finalUserPrompt = `Based on the user's idea, generate ${count} distinct and creative variations for a Midjourney prompt...`; // Your full prompt text here

            const responseText = await callProxyApi(provider, model, apiKey, systemPrompt, finalUserPrompt);
            displayResults(responseText);
        } catch (error) {
            resultContainer.innerHTML = `<p class="placeholder" style="color: #f44336;">เกิดข้อผิดพลาด: ${error.message}</p>`;
        } finally {
            generateBtn.disabled = false;
        }
    }

    async function callProxyApi(provider, model, apiKey, systemPrompt, userKeyword) {
        const response = await fetch('/api/proxy-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider,
                model,
                apiKey,
                systemPrompt,
                userKeyword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An unknown error occurred.');
        }

        if (provider === 'openai') return data.choices[0].message.content.trim();
        if (provider === 'anthropic') return data.content[0].text.trim();
        if (provider === 'google') return data.candidates[0].content.parts[0].text.trim();

        return "ไม่สามารถดึงข้อมูลจาก Provider ที่เลือกได้";
    }

    function displayResults(responseText) {
        resultContainer.innerHTML = '';
        const prompts = responseText.split(/\n?\d+\.\s/).filter(p => p.trim() !== '');

        if (prompts.length === 0) {
            resultContainer.innerHTML = '<p class="placeholder">ไม่ได้รับผลลัพธ์ที่ถูกต้องจาก AI ลองใหม่อีกครั้ง</p>';
            return;
        }

        prompts.forEach(promptText => {
            const cleanedText = promptText.trim();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'result-item';
            const textP = document.createElement('p');
            textP.textContent = cleanedText;
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'คัดลอก';
            copyBtn.className = 'copy-btn-item';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(cleanedText)
                    .then(() => {
                        copyBtn.textContent = 'คัดลอกแล้ว!';
                        setTimeout(() => { copyBtn.textContent = 'คัดลอก'; }, 2000);
                    })
                    .catch(err => console.error('Copy failed', err));
            };
            itemDiv.appendChild(textP);
            itemDiv.appendChild(copyBtn);
            resultContainer.appendChild(itemDiv);
        });
    }

    // --- EVENT LISTENERS ---
    providerSelect.addEventListener('change', updateModels);
    saveKeyBtn.addEventListener('click', saveApiKey);
    generateBtn.addEventListener('click', handleGeneration);
    promptTemplateSelect.addEventListener('change', updateSystemPrompt);
    systemPromptInput.addEventListener('input', saveCustomPrompt);

    // --- INITIALIZATION ---
    loadApiKey();
    updateModels();
    updateSystemPrompt();
});