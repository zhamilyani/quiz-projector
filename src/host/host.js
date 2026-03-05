const API = '/api/quizzes';
let quiz = null;
let currentRound = -1;
let currentQuestion = 0;
let teams = [];
let answeredSet = new Set();
let ws;
let timerValue = 60, timerMax = 60, timerRunning = false;

const quizSelect = document.getElementById('quiz-select');
const wsDot = document.getElementById('ws-dot');
const panelNo = document.getElementById('panel-noQuiz');
const panelGame = document.getElementById('panel-game');
const roundTabs = document.getElementById('round-tabs');
const qNav = document.getElementById('q-nav');
const cardLabel = document.getElementById('card-label');
const cardText = document.getElementById('card-text');
const cardAnswer = document.getElementById('card-answer');
const timerDisplay = document.getElementById('timer-display');

function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ws`;
}

function connectWS() {
  ws = new WebSocket(getWsUrl());
  ws.onopen = () => { wsDot.classList.add('ok'); ws.send(JSON.stringify({ type: 'register', role: 'host' })); };
  ws.onclose = () => { wsDot.classList.remove('ok'); setTimeout(connectWS, 2000); };
  ws.onerror = () => ws.close();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'timer_tick') { timerValue = msg.value; timerMax = msg.duration; updateTimerDisplay(); }
    else if (msg.type === 'timer_end') { timerValue = 0; timerRunning = false; updateTimerDisplay(); }
    else if (msg.type === 'show_question' && msg.roundIndex !== undefined && quiz) {
      // Sync host UI when projector navigates
      if (msg.roundIndex !== currentRound || msg.questionIndex !== currentQuestion) {
        currentRound = msg.roundIndex;
        currentQuestion = msg.questionIndex;
        renderNavigation();
        updateCard();
      }
    }
    else if (msg.type === 'show_answer' && quiz && currentRound >= 0) {
      answeredSet.add(`${currentRound}-${currentQuestion}`);
      renderQuestionNav();
    }
  };
}

function send(msg) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); }

async function loadQuizList() {
  const res = await fetch(API);
  const list = await res.json();
  quizSelect.innerHTML = '<option value="">— Выберите квиз —</option>';
  list.forEach(q => {
    const opt = document.createElement('option');
    opt.value = q.id; opt.textContent = q.title;
    quizSelect.appendChild(opt);
  });
}

async function loadQuiz(id) {
  if (!id) { quiz = null; panelNo.classList.add('active'); panelGame.classList.remove('active'); return; }
  const res = await fetch(`${API}/${id}`);
  quiz = await res.json();
  teams = [];
  const tc = quiz.settings?.teamCount || 8;
  for (let i = 0; i < tc; i++) teams.push({ name: `Команда ${i+1}`, score: 0 });
  answeredSet.clear();
  currentRound = -1; currentQuestion = 0;
  panelNo.classList.remove('active'); panelGame.classList.add('active');
  renderNavigation(); showWelcome(); renderTeams();
}

quizSelect.addEventListener('change', () => loadQuiz(quizSelect.value));

function renderNavigation() {
  roundTabs.innerHTML = '';
  quiz.rounds.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn' + (i === currentRound ? ' active' : '');
    btn.textContent = r.name || `Р${i+1}`;
    btn.addEventListener('click', () => selectRound(i));
    roundTabs.appendChild(btn);
  });
  document.getElementById('btn-welcome').classList.toggle('active', currentRound === -1);
  renderQuestionNav();
}

function renderQuestionNav() {
  qNav.innerHTML = '';
  if (currentRound < 0 || !quiz.rounds[currentRound]) return;
  quiz.rounds[currentRound].questions.forEach((q, i) => {
    const btn = document.createElement('button');
    const key = `${currentRound}-${i}`;
    btn.className = 'q-btn' + (i === currentQuestion ? ' active' : '') + (answeredSet.has(key) ? ' answered' : '');
    btn.textContent = i + 1;
    btn.addEventListener('click', () => selectQuestion(i));
    qNav.appendChild(btn);
  });
}

function selectRound(ri) {
  currentRound = ri; currentQuestion = 0;
  renderNavigation();
  const round = quiz.rounds[ri];
  send({ type: 'show_round_title', roundLabel: `Раунд ${ri+1}`, title: round.name, roundIndex: ri });
  updateCard();
}

function selectQuestion(qi) {
  currentQuestion = qi; renderQuestionNav(); updateCard();
}

function showWelcome() {
  currentRound = -1; renderNavigation();
  send({ type: 'show_welcome', title: quiz.title, quizId: quiz.id });
  cardLabel.textContent = 'Приветствие'; cardText.textContent = quiz.title; cardAnswer.textContent = '';
}

document.getElementById('btn-welcome').addEventListener('click', showWelcome);

function updateCard() {
  if (currentRound < 0) { cardLabel.textContent = 'Приветствие'; cardText.textContent = quiz?.title || ''; cardAnswer.textContent = ''; return; }
  const q = quiz.rounds[currentRound]?.questions[currentQuestion];
  if (!q) return;
  cardLabel.textContent = `Раунд ${currentRound+1}, Вопрос ${currentQuestion+1}`;
  cardText.textContent = q.text;
  cardAnswer.textContent = `Ответ: ${q.answer}`;
}

document.getElementById('btn-show-question').addEventListener('click', () => {
  if (currentRound < 0 || !quiz) return;
  const q = quiz.rounds[currentRound]?.questions[currentQuestion];
  if (!q) return;
  const timer = q.timer || quiz.settings?.defaultTimer || 60;
  send({ type: 'show_question', badge: `Р${currentRound+1} / В${currentQuestion+1}`, text: q.text, media: q.media ? { url: q.media.url, type: q.type, embedType: q.media.embedType || null } : null, timer, quizId: quiz.id, roundIndex: currentRound, questionIndex: currentQuestion });
});

document.getElementById('btn-show-answer').addEventListener('click', () => {
  if (currentRound < 0 || !quiz) return;
  const q = quiz.rounds[currentRound]?.questions[currentQuestion];
  if (!q) return;
  answeredSet.add(`${currentRound}-${currentQuestion}`);
  renderQuestionNav();
  send({
    type: 'show_answer',
    answer: q.answer,
    media: q.media ? { url: q.media.url, embedType: q.media.embedType || null } : null,
    mediaType: q.type,
    mediaInfo: q.mediaInfo || null,
  });
});

document.getElementById('btn-show-discussion')?.addEventListener('click', () => {
  if (currentRound < 0 || !quiz) return;
  const round = quiz.rounds[currentRound];
  const duration = round?.discussionTimer || 30;
  send({ type: 'show_discussion', duration });
});

document.getElementById('btn-timer-start').addEventListener('click', () => {
  if (currentRound < 0 || !quiz) return;
  const q = quiz.rounds[currentRound]?.questions[currentQuestion];
  const duration = q?.timer || quiz.settings?.defaultTimer || 60;
  timerRunning = true;
  send({ type: 'timer_start', duration });
});

document.getElementById('btn-timer-pause').addEventListener('click', () => { timerRunning = false; send({ type: 'timer_pause' }); });

document.getElementById('btn-timer-reset').addEventListener('click', () => {
  if (currentRound < 0 || !quiz) return;
  const q = quiz.rounds[currentRound]?.questions[currentQuestion];
  const duration = q?.timer || quiz.settings?.defaultTimer || 60;
  timerRunning = false; timerValue = duration; timerMax = duration;
  updateTimerDisplay();
  send({ type: 'timer_reset', duration });
});

function updateTimerDisplay() {
  timerDisplay.textContent = timerValue;
  timerDisplay.classList.toggle('danger', timerValue <= 10 && timerValue > 0);
}

function renderTeams() {
  const container = document.getElementById('teams-list');
  container.innerHTML = '';
  teams.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'team-row';
    row.innerHTML = `
      <input type="text" class="team-name" value="${esc(t.name)}" data-ti="${i}">
      <button class="score-btn minus" data-action="score-minus" data-ti="${i}">\u2212</button>
      <input type="number" class="team-score" value="${t.score}" data-ti="${i}" data-field="score">
      <button class="score-btn plus" data-action="score-plus" data-ti="${i}">+</button>
      <button class="btn-icon" data-action="del-team" data-ti="${i}">\u2715</button>`;
    container.appendChild(row);
  });
}

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const ti = parseInt(btn.dataset.ti);
  const action = btn.dataset.action;
  if (action === 'score-plus' && teams[ti]) {
    const q = currentRound >= 0 ? quiz.rounds[currentRound]?.questions[currentQuestion] : null;
    teams[ti].score += (q?.points || 1); renderTeams();
  } else if (action === 'score-minus' && teams[ti]) {
    const q = currentRound >= 0 ? quiz.rounds[currentRound]?.questions[currentQuestion] : null;
    teams[ti].score -= (q?.points || 1); renderTeams();
  } else if (action === 'del-team') { teams.splice(ti, 1); renderTeams(); }
});

document.addEventListener('change', (e) => {
  if (e.target.classList.contains('team-name')) teams[parseInt(e.target.dataset.ti)].name = e.target.value;
  if (e.target.dataset.field === 'score') teams[parseInt(e.target.dataset.ti)].score = parseInt(e.target.value) || 0;
});

document.getElementById('btn-add-team').addEventListener('click', () => {
  teams.push({ name: `Команда ${teams.length+1}`, score: 0 }); renderTeams();
});

document.getElementById('btn-show-round-answers').addEventListener('click', () => {
  if (currentRound < 0 || !quiz) return;
  const round = quiz.rounds[currentRound];
  if (!round) return;
  send({
    type: 'show_round_answers',
    roundLabel: `Раунд ${currentRound + 1}`,
    roundName: round.name,
    questions: round.questions.map(q => ({
      text: q.text,
      answer: q.answer,
      type: q.type,
      media: q.media ? { url: q.media.url, embedType: q.media.embedType || null } : null,
      mediaInfo: q.mediaInfo || null,
      points: q.points || 1,
    })),
  });
});

document.getElementById('btn-show-lb').addEventListener('click', () => {
  send({ type: 'show_leaderboard', teams: teams.map(t => ({ name: t.name, score: t.score })) });
});

document.getElementById('btn-show-final').addEventListener('click', () => {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  send({ type: 'show_final', winner: sorted[0]?.name || '—' });
});

connectWS();
loadQuizList();
