const API = '/api/quizzes';
let quiz = newQuiz();

function newQuiz() {
  return { id: '', title: '', settings: { defaultTimer: 60, teamCount: 8 }, rounds: [] };
}

const quizSelect = document.getElementById('quiz-select');
const quizTitle = document.getElementById('quiz-title');
const defaultTimer = document.getElementById('default-timer');
const teamCount = document.getElementById('team-count');
const roundsContainer = document.getElementById('rounds-container');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');
const btnAddRound = document.getElementById('btn-add-round');
const btnBlanks = document.getElementById('btn-blanks');

async function loadQuizList() {
  const res = await fetch(API);
  const list = await res.json();
  quizSelect.innerHTML = '<option value="">— Новый квиз —</option>';
  list.forEach(q => {
    const opt = document.createElement('option');
    opt.value = q.id;
    opt.textContent = `${q.title} (${q.rounds} р.)`;
    quizSelect.appendChild(opt);
  });
}

async function loadQuiz(id) {
  if (!id) { quiz = newQuiz(); syncToDOM(); btnDelete.style.display = 'none'; return; }
  const res = await fetch(`${API}/${id}`);
  quiz = await res.json();
  syncToDOM();
  btnDelete.style.display = '';
}

function syncToDOM() {
  quizTitle.value = quiz.title;
  defaultTimer.value = quiz.settings?.defaultTimer || 60;
  teamCount.value = quiz.settings?.teamCount || 8;
  renderRounds();
}

function syncFromDOM() {
  quiz.title = quizTitle.value;
  quiz.settings = {
    defaultTimer: parseInt(defaultTimer.value) || 60,
    teamCount: parseInt(teamCount.value) || 8,
  };
}

function renderRounds() {
  roundsContainer.innerHTML = '';
  quiz.rounds.forEach((round, ri) => {
    const div = document.createElement('div');
    div.className = 'round';
    div.innerHTML = `
      <div class="round-header">
        <input type="text" value="${esc(round.name)}" placeholder="Название раунда" data-ri="${ri}" class="round-name">
        <label class="round-timer-label" title="Время на обсуждение (сек)">⏱ <input type="number" value="${round.discussionTimer || 30}" min="5" max="300" data-ri="${ri}" class="round-discussion-timer" style="width:60px"> сек</label>
        <button class="btn-icon" title="Удалить раунд" data-action="del-round" data-ri="${ri}">\u{1F5D1}</button>
        <button class="btn-icon" title="Вверх" data-action="move-round-up" data-ri="${ri}">\u2191</button>
        <button class="btn-icon" title="Вниз" data-action="move-round-down" data-ri="${ri}">\u2193</button>
      </div>
      <div class="round-body">
        ${round.questions.map((q, qi) => renderQuestion(q, ri, qi)).join('')}
        <button class="btn-secondary" data-action="add-question" data-ri="${ri}">+ Вопрос</button>
      </div>
    `;
    roundsContainer.appendChild(div);
  });
}

function renderQuestion(q, ri, qi) {
  const mediaPreview = q.media?.url
    ? (q.type === 'image' ? `<img src="${q.media.url}" alt="">` :
       q.type === 'audio' ? `<audio src="${q.media.url}" controls style="height:36px"></audio>` :
       q.type === 'video' ? `<video src="${q.media.url}" style="max-height:80px" controls></video>` : '')
    : '';
  return `
    <div class="question" data-ri="${ri}" data-qi="${qi}">
      <div class="q-actions">
        <button class="btn-icon" data-action="move-q-up" data-ri="${ri}" data-qi="${qi}">\u2191</button>
        <button class="btn-icon" data-action="move-q-down" data-ri="${ri}" data-qi="${qi}">\u2193</button>
        <button class="btn-icon" data-action="del-question" data-ri="${ri}" data-qi="${qi}">\u2715</button>
      </div>
      <div class="q-row">
        <span class="q-num">${qi + 1}.</span>
        <textarea placeholder="Текст вопроса" data-field="text" data-ri="${ri}" data-qi="${qi}" class="q-field">${esc(q.text)}</textarea>
      </div>
      <div class="q-row">
        <span class="q-num"></span>
        <input type="text" placeholder="Ответ" value="${esc(q.answer)}" data-field="answer" data-ri="${ri}" data-qi="${qi}" class="q-field">
        <select data-field="type" data-ri="${ri}" data-qi="${qi}" class="q-field">
          <option value="text" ${q.type==='text'?'selected':''}>Текст</option>
          <option value="image" ${q.type==='image'?'selected':''}>Картинка</option>
          <option value="audio" ${q.type==='audio'?'selected':''}>Аудио</option>
          <option value="video" ${q.type==='video'?'selected':''}>Видео</option>
        </select>
        <input type="number" value="${q.points||1}" min="1" max="10" data-field="points" data-ri="${ri}" data-qi="${qi}" class="q-field" title="Очки">
        <input type="number" value="${q.timer||''}" min="5" max="300" placeholder="\u23F1" data-field="timer" data-ri="${ri}" data-qi="${qi}" class="q-field" title="Таймер (сек)" style="width:70px">
      </div>
      <div class="q-media">
        ${mediaPreview}
        <input type="file" data-action="upload-media" data-ri="${ri}" data-qi="${qi}" accept="image/*,audio/*,video/*" style="font-size:0.85rem">
        ${q.media?.url ? `<button class="btn-icon" data-action="remove-media" data-ri="${ri}" data-qi="${qi}">\u2715</button>` : ''}
      </div>
    </div>`;
}

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const ri = parseInt(btn.dataset.ri);
  const qi = parseInt(btn.dataset.qi);
  switch (action) {
    case 'add-question':
      quiz.rounds[ri].questions.push({ text: '', type: 'text', media: null, answer: '', points: 1, timer: null });
      renderRounds(); break;
    case 'del-question':
      quiz.rounds[ri].questions.splice(qi, 1); renderRounds(); break;
    case 'del-round':
      if (confirm('Удалить раунд?')) { quiz.rounds.splice(ri, 1); renderRounds(); } break;
    case 'move-round-up':
      if (ri > 0) { [quiz.rounds[ri-1], quiz.rounds[ri]] = [quiz.rounds[ri], quiz.rounds[ri-1]]; renderRounds(); } break;
    case 'move-round-down':
      if (ri < quiz.rounds.length-1) { [quiz.rounds[ri+1], quiz.rounds[ri]] = [quiz.rounds[ri], quiz.rounds[ri+1]]; renderRounds(); } break;
    case 'move-q-up':
      if (qi > 0) { const qs = quiz.rounds[ri].questions; [qs[qi-1], qs[qi]] = [qs[qi], qs[qi-1]]; renderRounds(); } break;
    case 'move-q-down': {
      const qs = quiz.rounds[ri].questions;
      if (qi < qs.length-1) { [qs[qi+1], qs[qi]] = [qs[qi], qs[qi+1]]; renderRounds(); } break;
    }
    case 'remove-media':
      quiz.rounds[ri].questions[qi].media = null; renderRounds(); break;
  }
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.classList.contains('round-name')) { quiz.rounds[parseInt(el.dataset.ri)].name = el.value; return; }
  if (el.classList.contains('round-discussion-timer')) { quiz.rounds[parseInt(el.dataset.ri)].discussionTimer = parseInt(el.value) || 30; return; }
  if (el.classList.contains('q-field')) {
    const ri = parseInt(el.dataset.ri), qi = parseInt(el.dataset.qi), field = el.dataset.field;
    const q = quiz.rounds[ri].questions[qi];
    if (field === 'points') q.points = parseInt(el.value) || 1;
    else if (field === 'timer') q.timer = parseInt(el.value) || null;
    else q[field] = el.value;
    return;
  }
  if (el.dataset.action === 'upload-media') {
    const file = el.files[0];
    if (!file) return;
    const ri = parseInt(el.dataset.ri), qi = parseInt(el.dataset.qi);
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/media', { method: 'POST', body: fd });
    const data = await res.json();
    quiz.rounds[ri].questions[qi].media = { url: data.url };
    if (file.type.startsWith('image')) quiz.rounds[ri].questions[qi].type = 'image';
    else if (file.type.startsWith('audio')) quiz.rounds[ri].questions[qi].type = 'audio';
    else if (file.type.startsWith('video')) quiz.rounds[ri].questions[qi].type = 'video';
    renderRounds();
  }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.classList.contains('q-field') && el.tagName === 'TEXTAREA') {
    quiz.rounds[parseInt(el.dataset.ri)].questions[parseInt(el.dataset.qi)].text = el.value;
  }
  if (el.classList.contains('round-name')) quiz.rounds[parseInt(el.dataset.ri)].name = el.value;
});

btnAddRound.addEventListener('click', () => {
  quiz.rounds.push({ name: `Раунд ${quiz.rounds.length + 1}`, discussionTimer: 30, questions: [{ text: '', type: 'text', media: null, answer: '', points: 1, timer: null }] });
  renderRounds();
});

btnSave.addEventListener('click', async () => {
  syncFromDOM();
  if (!quiz.title.trim()) { alert('Введите название квиза'); return; }
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quiz) });
  quiz = await res.json();
  await loadQuizList();
  quizSelect.value = quiz.id;
  btnDelete.style.display = '';
  alert('Сохранено!');
});

btnDelete.addEventListener('click', async () => {
  if (!quiz.id || !confirm('Удалить квиз?')) return;
  await fetch(`${API}/${quiz.id}`, { method: 'DELETE' });
  quiz = newQuiz(); syncToDOM(); await loadQuizList();
  quizSelect.value = ''; btnDelete.style.display = 'none';
});

quizSelect.addEventListener('change', () => loadQuiz(quizSelect.value));

btnBlanks.addEventListener('click', () => {
  import('./blank-generator.js').then(m => m.generateBlanks(quiz));
});

// --- AI Generator ---
import { CATEGORIES } from '../shared/categories.js';

const genToggle = document.getElementById('gen-toggle');
const genBody = document.getElementById('gen-body');
const genArrow = document.getElementById('gen-arrow');
const btnGenerate = document.getElementById('btn-generate');
const genStatus = document.getElementById('gen-status');
const genCategoriesEl = document.getElementById('gen-categories');
const genRoundTypesEl = document.getElementById('gen-round-types');
const genStep2 = document.getElementById('gen-step-2');
const genCatName = document.getElementById('gen-cat-name');

let selectedCategory = null;
let selectedRoundTypes = new Set();

// Render category cards
function renderCategories() {
  genCategoriesEl.innerHTML = CATEGORIES.map(c => `
    <div class="gen-cat" data-cat="${c.id}">
      <span class="gen-cat-icon">${c.icon}</span>
      <span class="gen-cat-name">${c.name}</span>
    </div>
  `).join('');
}

// Render round type chips for selected category
function renderRoundTypes() {
  if (!selectedCategory) { genStep2.style.display = 'none'; return; }
  const cat = CATEGORIES.find(c => c.id === selectedCategory);
  if (!cat) return;
  genCatName.textContent = cat.name;
  genStep2.style.display = '';
  genRoundTypesEl.innerHTML = cat.roundTypes.map(rt => `
    <div class="gen-rt ${selectedRoundTypes.has(rt.id) ? 'selected' : ''}" data-rt="${rt.id}" title="${rt.desc}">
      ${rt.name}
    </div>
  `).join('');
}

genCategoriesEl.addEventListener('click', (e) => {
  const card = e.target.closest('.gen-cat');
  if (!card) return;
  const catId = card.dataset.cat;
  selectedCategory = catId;
  selectedRoundTypes.clear();
  // Auto-select all round types
  const cat = CATEGORIES.find(c => c.id === catId);
  if (cat) cat.roundTypes.forEach(rt => selectedRoundTypes.add(rt.id));
  // Update UI
  genCategoriesEl.querySelectorAll('.gen-cat').forEach(el => el.classList.toggle('selected', el.dataset.cat === catId));
  renderRoundTypes();
  // Update topic placeholder
  const placeholders = {
    music: 'Например: хиты 2000-х, российские и зарубежные',
    movies: 'Например: голливудская классика 90-х и 2000-х',
    cartoons: 'Например: мультфильмы Disney и Pixar',
    books: 'Например: русская классика и современная проза',
    general: 'Например: наука, география, история',
    visual: 'Например: бренды, флаги, знаменитости',
    puzzle: 'Например: музыкальные ребусы и головоломки',
  };
  document.getElementById('gen-topic').placeholder = placeholders[catId] || '';
});

genRoundTypesEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.gen-rt');
  if (!chip) return;
  const rtId = chip.dataset.rt;
  if (selectedRoundTypes.has(rtId)) selectedRoundTypes.delete(rtId);
  else selectedRoundTypes.add(rtId);
  chip.classList.toggle('selected');
});

genToggle.addEventListener('click', () => {
  const open = genBody.style.display === 'none';
  genBody.style.display = open ? 'block' : 'none';
  genArrow.classList.toggle('open', open);
});

btnGenerate.addEventListener('click', async () => {
  if (!selectedCategory) {
    genStatus.textContent = 'Выберите тип квиза';
    genStatus.className = 'gen-status error';
    return;
  }
  if (selectedRoundTypes.size === 0) {
    genStatus.textContent = 'Выберите хотя бы один тип раунда';
    genStatus.className = 'gen-status error';
    return;
  }

  const topic = document.getElementById('gen-topic').value.trim();
  const rounds = parseInt(document.getElementById('gen-rounds').value) || 3;
  const questionsPerRound = parseInt(document.getElementById('gen-questions').value) || 10;

  // Build round type hints for AI
  const cat = CATEGORIES.find(c => c.id === selectedCategory);
  const roundTypeDetails = cat.roundTypes
    .filter(rt => selectedRoundTypes.has(rt.id))
    .map(rt => ({ id: rt.id, name: rt.name, desc: rt.desc, aiHint: rt.aiHint, questionType: rt.questionType }));

  btnGenerate.disabled = true;
  genStatus.className = 'gen-status gen-spinner';
  genStatus.textContent = 'Генерация квиза... Обычно 15-30 секунд';

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic || cat.name,
        category: selectedCategory,
        roundTypes: roundTypeDetails,
        rounds,
        questionsPerRound,
      }),
    });
    const data = await res.json();

    if (data.error) {
      genStatus.textContent = data.error;
      genStatus.className = 'gen-status error';
      return;
    }

    quiz = { id: '', ...data };
    syncToDOM();
    genStatus.textContent = `Готово! ${quiz.rounds.length} раундов, ${quiz.rounds.reduce((s, r) => s + r.questions.length, 0)} вопросов. Редактируйте и сохраняйте.`;
    genStatus.className = 'gen-status';
  } catch (err) {
    genStatus.textContent = 'Ошибка: ' + err.message;
    genStatus.className = 'gen-status error';
  } finally {
    btnGenerate.disabled = false;
  }
});

// --- Init ---
renderCategories();
loadQuizList();
syncToDOM();
