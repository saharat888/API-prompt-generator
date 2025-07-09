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
        default: `You are a creative prompt engineer for Midjourney v7. Your task is to expand the user's keyword into unique, detailed, and creative prompts.

        IMPORTANT: Your entire response must consist ONLY of the generated prompts. Each prompt must be on a new line. Do NOT include numbers, bullet points, titles, introductions, or any other explanatory text.
Consider these elements for rich visual detail:
- Detailed subject description
- Style and artistic direction (e.g., cinematic, anime)
- Lighting and mood (e.g., golden hour, dramatic)
- Camera terms (e.g., 85mm lens, f/1.8)
- Relevant v7 parameters (e.g., --style raw, --ar 16:9)`,

        artistic: `You are an artistic prompt engineer specializing in fine art styles for Midjourney v7. Your task is to interpret the user's keyword and transform it into a prompt that evokes a specific art style.

        IMPORTANT: Your entire response must consist ONLY of the generated prompts. Each prompt must be on a new line. Do NOT include numbers, bullet points, titles, introductions, or any other explanatory text.
Focus on:
- Classical and contemporary art movements (Impressionism, Surrealism, etc.)
- Traditional media (Oil painting, Watercolor, etc.)
- Artistic techniques, compositions, and color theory.`,

        photography: `You are a professional photography prompt engineer for Midjourney v7. Your task is to convert the user's keyword into a photorealistic prompt.

        IMPORTANT: Your entire response must consist ONLY of the generated prompts. Each prompt must be on a new line. Do NOT include numbers, bullet points, titles, introductions, or any other explanatory text.
Focus on specifying:
- Professional photography techniques and composition
- Camera settings and lens specifications (e.g., 50mm, wide-angle)
- Lighting setups (studio, natural, golden hour)
- Always use --style raw for realism.`,

        fantasy: `You are a fantasy world prompt engineer for Midjourney v7. Your task is to forge the user's keyword into an epic fantasy-themed prompt.

        IMPORTANT: Your entire response must consist ONLY of the generated prompts. Each prompt must be on a new line. Do NOT include numbers, bullet points, titles, introductions, or any other explanatory text.
Focus on describing:
- Mythical creatures and magical beings
- Epic fantasy landscapes and realms
- Mystical lighting and atmospheric effects
- Fantasy character design with rich lore.`,

        whitebackground: `You are a product photography specialist for Midjourney v7. Your task is to create a prompt based on the user's keyword that results in an object isolated on a clean, smooth white background.

        IMPORTANT: Your entire response must consist ONLY of the generated prompts. Each prompt must be on a new line. Do NOT include numbers, bullet points, titles, introductions, or any other explanatory text.
The prompt must specify:
- A clear description of the object.
- Studio lighting, softbox, or even lighting.
- A simple, uncluttered composition.
- Use --style raw for realism.`,

        custom: "You are a helpful assistant. Follow the user's instructions precisely."
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
            systemPromptInput.value = localStorage.getItem('customSystemPrompt') || promptTemplates.custom;
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

    // ⭐ REWRITTEN: This function now has simpler and more reliable logic.
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

            // This is the new, simplified user prompt. It's the same for all templates.
            const userPrompt = `Generate ${count} distinct prompt variations based on this keyword/idea: "${keyword}".`;

            const responseText = await callProxyApi(provider, model, apiKey, systemPrompt, userPrompt);
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
