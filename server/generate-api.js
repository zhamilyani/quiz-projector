const fs = require('fs');
const path = require('path');
const https = require('https');
const { attachMediaToQuestions } = require('./media-search');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      env[key] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

function buildPrompt(topic, rounds, questionsPerRound, roundTypes) {
  const roundTypeInstructions = roundTypes && roundTypes.length > 0
    ? roundTypes.map((rt, i) => `${i + 1}. "${rt.name}" — ${rt.desc}. ${rt.aiHint || ''} Тип вопроса: ${rt.questionType || 'text'}.`).join('\n')
    : null;

  const roundDistribution = roundTypeInstructions
    ? `\nТипы раундов (распредели ${rounds} раундов по этим типам, можешь повторять если раундов больше чем типов):\n${roundTypeInstructions}\nКаждый раунд ДОЛЖЕН соответствовать одному из указанных типов. Название раунда должно отражать его тип.`
    : `\nКаждый раунд должен иметь тематическое название, связанное с общей темой "${topic}".`;

  return `Ты — генератор вопросов для pub quiz. Создай квиз по теме: "${topic}".
Количество раундов: ${rounds}. Вопросов в раунде: ${questionsPerRound}.
${roundDistribution}

Правила:
- Вопросы должны быть разнообразными и соответствовать типу раунда.
- Ответы должны быть краткими (1-3 слова).
- Сложность вопросов — средняя, для широкой аудитории.
- Не повторяй вопросы и темы внутри квиза.
- ВАЖНО: Поле "text" — это ЗАДАНИЕ для игроков, которое они видят на экране. Оно НЕ должно содержать ответ или подсказку!
- Для раундов с типом "audio" — поле text ДОЛЖНО быть заданием-вопросом для игроков, например: "Прослушайте фрагмент и назовите исполнителя и песню", "Из какого фильма этот саундтрек?", "Назовите мультфильм по песне". НИКОГДА не пиши в text название песни, исполнителя или фильма! В поле answer ОБЯЗАТЕЛЬНО укажи в формате "Исполнитель - Название песни" (например: "Queen - Bohemian Rhapsody"). Это критично для автоматического поиска аудио!
- Для раундов с типом "video" — поле text ДОЛЖНО быть заданием-вопросом, например: "Посмотрите отрывок и назовите фильм", "Из какого фильма этот кадр?". НИКОГДА не упоминай название фильма в text! Название фильма — только в answer.
- Для раундов с типом "image" — поле text ДОЛЖНО быть заданием-вопросом, например: "Угадайте фильм по кадру", "Какой бренд скрывается за этим логотипом?", "Кто изображён на фото?". НИКОГДА не описывай содержимое картинки и не упоминай ответ в text! Ответ — только в поле answer.
- Если в раунде есть пропущенные слова — используй "___" для обозначения пропуска в тексте вопроса.

КРИТИЧЕСКОЕ ПРАВИЛО для audio/video/image вопросов:
- Поле "text" должно содержать ТОЛЬКО задание игрокам (например: "Угадайте фильм по отрывку", "Назовите исполнителя и песню").
- Поле "text" НИКОГДА НЕ ДОЛЖНО содержать название фильма, песни, исполнителя, описание кадра или любую другую подсказку.
- Ответ (название фильма, песня, исполнитель) — ТОЛЬКО в поле "answer".
- НЕПРАВИЛЬНО: {"text": "На экране корабль Титаник", "answer": "Титаник"}
- ПРАВИЛЬНО: {"text": "Угадайте фильм по отрывку", "answer": "Титаник"}

Верни ТОЛЬКО валидный JSON без markdown-обёртки, без комментариев, без пояснений.
Формат:
{"title":"Название","settings":{"defaultTimer":60,"teamCount":8},"rounds":[{"name":"Раунд","questions":[{"text":"Вопрос?","answer":"Ответ","type":"text","media":null,"points":1,"timer":30}]}]}`;
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout 120s')); });
    req.write(body);
    req.end();
  });
}

async function callGroq(apiKey, prompt) {
  const body = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Ты генератор квизов. Отвечай ТОЛЬКО валидным JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 16000,
    response_format: { type: 'json_object' },
  });

  const res = await httpsRequest({
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  if (res.status !== 200) {
    const err = JSON.parse(res.data).error?.message || res.data.slice(0, 300);
    throw new Error(`Groq: ${err}`);
  }
  const parsed = JSON.parse(res.data);
  return parsed.choices?.[0]?.message?.content || '';
}

async function callGemini(apiKey, prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 16000, responseMimeType: 'application/json' },
  });

  const res = await httpsRequest({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, body);

  if (res.status !== 200) {
    const err = JSON.parse(res.data).error?.message || res.data.slice(0, 300);
    throw new Error(`Gemini: ${err}`);
  }
  const parsed = JSON.parse(res.data);
  return parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function cleanJson(raw) {
  let s = raw.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  return s;
}

async function handleGenerate(req, res) {
  try {
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', c => { body += c; });
      req.on('end', resolve);
      req.on('error', reject);
    });

    let params;
    try { params = JSON.parse(body); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }

    const { topic, category, roundTypes, rounds = 3, questionsPerRound = 10 } = params;
    if (!topic?.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Введите тематику квиза' }));
    }

    const env = loadEnv();
    const groqKey = env.GROQ_API_KEY;
    const geminiKey = env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'API ключи не найдены. Добавьте GROQ_API_KEY или GEMINI_API_KEY в .env' }));
    }

    console.log(`[generate] Category: ${category}, RoundTypes: ${roundTypes?.map(rt => rt.id).join(', ') || 'none'}`);
    const prompt = buildPrompt(topic.trim(), rounds, questionsPerRound, roundTypes);
    let raw;

    // Try Groq first (fast, free), fallback to Gemini
    if (groqKey) {
      try {
        console.log('[generate] Trying Groq...');
        raw = await callGroq(groqKey, prompt);
      } catch (e) {
        console.log('[generate] Groq failed:', e.message);
        if (geminiKey) {
          console.log('[generate] Falling back to Gemini...');
          raw = await callGemini(geminiKey, prompt);
        } else {
          throw e;
        }
      }
    } else {
      raw = await callGemini(geminiKey, prompt);
    }

    const cleaned = cleanJson(raw);
    let quiz;
    try { quiz = JSON.parse(cleaned); } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'AI вернул невалидный JSON. Попробуйте ещё раз.' }));
    }

    if (!Array.isArray(quiz.rounds)) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Квиз не содержит раундов' }));
    }

    // Auto-attach real audio/video from iTunes for media questions
    try {
      await attachMediaToQuestions(quiz);
    } catch (e) {
      console.log('[generate] Media search failed (non-critical):', e.message);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(quiz));

  } catch (err) {
    console.error('[generate-api] Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = { handleGenerate };
