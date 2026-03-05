import { startConfetti } from './animations.js';

const screens = document.querySelectorAll('.screen');
const connStatus = document.getElementById('conn-status');
let stopConfetti = null;

// Navigation state
let quiz = null;
let navRound = -1;
let navQuestion = 0;
let navMode = 'question'; // 'question' | 'discussion'

// Discussion timer (client-side countdown)
let discussionInterval = null;
let discussionValue = 0;
let discussionMax = 0;

function showScreen(id) {
  if (stopConfetti) { stopConfetti(); stopConfetti = null; }
  stopDiscussionTimer();
  screens.forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
  document.body.focus();
}

function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ws`;
}

let ws;
function connect() {
  ws = new WebSocket(getWsUrl());
  ws.onopen = () => {
    connStatus.classList.add('connected');
    ws.send(JSON.stringify({ type: 'register', role: 'projector' }));
  };
  ws.onclose = () => { connStatus.classList.remove('connected'); setTimeout(connect, 2000); };
  ws.onerror = () => ws.close();
  ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
}

function send(msg) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); }

// Send AND apply locally (projector is excluded from broadcast)
function sendAndApply(msg) {
  send(msg);
  handleMessage(msg);
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'state_sync':
      if (msg.screen) handleMessage(msg.screen);
      if (msg.timerMax > 0) updateTimer(msg.timer, msg.timerMax);
      break;
    case 'show_welcome':
      document.getElementById('welcome-title').textContent = msg.title || 'Quiz Projector';
      showScreen('welcome');
      if (msg.quizId) loadQuizForNav(msg.quizId);
      break;
    case 'show_round_title':
      document.getElementById('round-num').textContent = msg.roundLabel || '';
      document.getElementById('round-title').textContent = msg.title || '';
      if (msg.roundIndex !== undefined) navRound = msg.roundIndex;
      navQuestion = 0;
      navMode = 'question';
      showScreen('round'); break;
    case 'show_question':
      document.getElementById('q-badge').textContent = msg.badge || '';
      document.getElementById('q-text').textContent = msg.text || '';
      renderMedia(msg.media);
      document.getElementById('timer-wrap').classList.toggle('hidden', !msg.timer);
      if (msg.roundIndex !== undefined) navRound = msg.roundIndex;
      if (msg.questionIndex !== undefined) navQuestion = msg.questionIndex;
      if (msg.quizId && !quiz) loadQuizForNav(msg.quizId);
      navMode = 'question';
      showScreen('question'); break;
    case 'show_discussion':
      startDiscussionScreen(msg.duration || 30);
      navMode = 'discussion';
      break;
    case 'show_answer':
      document.getElementById('answer-text').textContent = msg.answer || '';
      renderAnswerMedia(msg);
      showScreen('answer'); break;
    case 'show_round_answers':
      renderRoundAnswers(msg);
      showScreen('answers'); break;
    case 'show_leaderboard':
      renderLeaderboard(msg.teams || []);
      showScreen('leaderboard'); break;
    case 'show_final':
      document.getElementById('final-winner').textContent = msg.winner || '';
      showScreen('final');
      stopConfetti = startConfetti(document.getElementById('confetti-canvas'));
      break;
    case 'timer_start': case 'timer_tick':
      updateTimer(msg.value, msg.duration); break;
    case 'timer_reset':
      updateTimer(msg.value, msg.duration); break;
    case 'timer_end':
      updateTimer(0, 1); break;
  }
}

// --- Discussion timer (client-side) ---
function startDiscussionScreen(duration) {
  showScreen('discussion');
  discussionMax = duration;
  discussionValue = duration;
  updateDiscussionDisplay();

  stopDiscussionTimer();
  discussionInterval = setInterval(() => {
    discussionValue--;
    updateDiscussionDisplay();
    if (discussionValue <= 0) {
      stopDiscussionTimer();
    }
  }, 1000);
}

function stopDiscussionTimer() {
  if (discussionInterval) { clearInterval(discussionInterval); discussionInterval = null; }
}

function updateDiscussionDisplay() {
  const timerEl = document.getElementById('discussion-timer');
  const barEl = document.getElementById('discussion-bar');
  if (!timerEl || !barEl) return;
  timerEl.textContent = discussionValue;
  timerEl.classList.toggle('danger', discussionValue <= 5 && discussionValue > 0);
  const pct = discussionMax > 0 ? (discussionValue / discussionMax) * 100 : 0;
  barEl.style.width = pct + '%';
  barEl.classList.toggle('danger', discussionValue <= 5);
}

// --- Quiz loading for projector navigation ---
async function loadQuizForNav(id) {
  try {
    const res = await fetch(`/api/quizzes/${id}`);
    quiz = await res.json();
    console.log('[projector] Quiz loaded:', quiz.title, quiz.rounds.length, 'rounds');
  } catch (e) {
    console.log('[projector] Failed to load quiz:', e.message);
  }
}

// --- Projector navigation ---
// Flow: Question → Discussion → Question → Discussion → ...
function navNext() {
  if (!quiz || navRound < 0) return;
  const round = quiz.rounds[navRound];
  if (!round) return;

  if (navMode === 'question') {
    // question → discussion timer
    const duration = round.discussionTimer || quiz.settings?.defaultTimer || 30;
    sendAndApply({ type: 'show_discussion', duration });
    return;
  }

  if (navMode === 'discussion') {
    // discussion → next question
    if (navQuestion < round.questions.length - 1) {
      navQuestion++;
      showQuestionByNav(navRound, navQuestion);
    } else if (navRound < quiz.rounds.length - 1) {
      // next round
      navRound++;
      navQuestion = 0;
      const r = quiz.rounds[navRound];
      sendAndApply({ type: 'show_round_title', roundLabel: `Раунд ${navRound + 1}`, title: r.name, roundIndex: navRound });
    }
    return;
  }
}

function navPrev() {
  if (!quiz || navRound < 0) return;

  if (navMode === 'discussion') {
    // discussion → back to current question
    showQuestionByNav(navRound, navQuestion);
    return;
  }

  if (navMode === 'question') {
    if (navQuestion > 0) {
      navQuestion--;
      showQuestionByNav(navRound, navQuestion);
    } else if (navRound > 0) {
      navRound--;
      navQuestion = quiz.rounds[navRound].questions.length - 1;
      showQuestionByNav(navRound, navQuestion);
    }
  }
}

function showQuestionByNav(ri, qi) {
  const q = quiz.rounds[ri]?.questions[qi];
  if (!q) return;
  const msg = {
    type: 'show_question',
    badge: `Р${ri + 1} / В${qi + 1}`,
    text: q.text,
    media: q.media ? { url: q.media.url, type: q.type, embedType: q.media.embedType || null } : null,
    timer: false,
    quizId: quiz.id,
    roundIndex: ri,
    questionIndex: qi,
  };
  sendAndApply(msg);
}

// --- Navigation: click zones ---
document.addEventListener('click', (e) => {
  if (e.target.closest('audio, video, button, a, input')) return;
  const x = e.clientX / window.innerWidth;
  if (x < 0.2) {
    navPrev();
  } else if (x > 0.8) {
    navNext();
  } else {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  }
});

// --- Keyboard navigation ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); navNext(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); navPrev(); }
  else if (e.key === 'f' || e.key === 'F') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  }
});

// Prevent iframes from stealing focus
document.addEventListener('focusin', (e) => {
  if (e.target.tagName === 'IFRAME') {
    setTimeout(() => document.body.focus(), 100);
  }
});

// --- Cursor: show on move, hide after idle ---
let cursorTimer;
function showCursor() {
  document.body.classList.remove('cursor-hidden');
  clearTimeout(cursorTimer);
  cursorTimer = setTimeout(() => document.body.classList.add('cursor-hidden'), 3000);
}
document.addEventListener('mousemove', showCursor);
showCursor();

// --- Timer ---
function updateTimer(value, max) {
  const bar = document.getElementById('timer-bar');
  const text = document.getElementById('timer-text');
  const pct = max > 0 ? (value / max) * 100 : 0;
  bar.style.width = pct + '%';
  bar.classList.toggle('danger', pct < 20);
  text.textContent = value + '\u0441';
}

// --- YouTube embed URL builder ---
function ytEmbedUrl(url, autoplay) {
  const params = ['rel=0', 'modestbranding=1', 'iv_load_policy=3', 'disablekb=1', 'fs=0', 'color=white', 'showinfo=0', 'controls=0'];
  if (autoplay) params.push('autoplay=1');
  const sep = url.includes('?') ? '&' : '?';
  return url + sep + params.join('&');
}

// --- Media rendering ---
function renderMedia(media) {
  const el = document.getElementById('q-media');
  el.innerHTML = '';
  if (!media?.url) return;
  const url = media.url;
  const type = media.type || '';
  const isYT = url.includes('youtube.com/embed/') || media.embedType === 'youtube';

  if (isYT) {
    el.innerHTML = `<div class="yt-wrap"><iframe class="yt-embed" src="${ytEmbedUrl(url, true)}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen tabindex="-1"></iframe><div class="yt-overlay"></div><div class="yt-title-hide"></div><div class="yt-bottom-hide"></div></div>`;
  } else if (type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
    el.innerHTML = `<img src="${url}" alt="">`;
  } else if (type === 'audio' || /\.(mp3|ogg|wav|m4a|aac)$/i.test(url)) {
    el.innerHTML = `
      <div class="media-player">
        <div class="media-player-icon">\u266B</div>
        <audio src="${url}" controls></audio>
      </div>`;
    el.querySelector('audio').play().catch(() => {});
  } else if (type === 'video' || /\.(mp4|webm|m4v|mov)$/i.test(url)) {
    el.innerHTML = `<video src="${url}" controls></video>`;
    el.querySelector('video').play().catch(() => {});
  } else {
    el.innerHTML = `<audio src="${url}" controls></audio>`;
  }
}

function renderAnswerMedia(msg) {
  const el = document.getElementById('answer-media');
  if (!el) return;
  el.innerHTML = '';
  if (!msg.media?.url) return;
  const url = msg.media.url;
  const isYT = url.includes('youtube.com/embed/') || msg.media.embedType === 'youtube';

  if (isYT) {
    el.innerHTML = `<div class="yt-wrap yt-wrap-small"><iframe class="yt-embed-small" src="${ytEmbedUrl(url, true)}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen tabindex="-1"></iframe><div class="yt-overlay"></div></div>`;
  } else if (msg.mediaType === 'audio') {
    const info = msg.mediaInfo;
    const artHtml = info?.artwork ? `<img src="${info.artwork}" style="width:80px;height:80px;border-radius:12px;object-fit:cover">` : '';
    const trackHtml = info ? `<div style="color:var(--text-muted);font-size:1.2rem">${esc(info.artist || '')} — ${esc(info.track || '')}</div>` : '';
    el.innerHTML = `<div style="display:flex;align-items:center;gap:1rem;margin-top:1rem">${artHtml}<div><audio src="${msg.media.url}" controls autoplay></audio>${trackHtml}</div></div>`;
  } else if (msg.mediaType === 'video') {
    el.innerHTML = `<video src="${url}" controls autoplay style="max-height:200px;border-radius:12px;margin-top:1rem"></video>`;
  } else if (msg.mediaType === 'image') {
    el.innerHTML = `<img src="${url}" style="max-height:200px;border-radius:12px;margin-top:1rem">`;
  }
}

function renderRoundAnswers(msg) {
  document.getElementById('answers-title').textContent = `${msg.roundLabel}: ${msg.roundName || 'Ответы'}`;
  const list = document.getElementById('answers-list');
  list.innerHTML = '';

  (msg.questions || []).forEach((q, i) => {
    const row = document.createElement('div');
    row.className = 'answer-row';

    let mediaHtml = '';
    if (q.media?.url) {
      const url = q.media.url;
      const isYT = url.includes('youtube.com/embed/') || q.media?.embedType === 'youtube';
      if (isYT) {
        mediaHtml = `<div class="answer-media-row"><div class="yt-wrap yt-wrap-tiny"><iframe class="yt-embed-tiny" src="${esc(ytEmbedUrl(url, false))}" frameborder="0" allow="encrypted-media" allowfullscreen tabindex="-1"></iframe></div></div>`;
      } else if (q.type === 'audio') {
        const info = q.mediaInfo;
        const artHtml = info?.artwork ? `<img src="${esc(info.artwork)}" class="answer-artwork" alt="">` : '';
        const trackHtml = info ? `<span class="answer-track">${esc(info.artist || '')} — ${esc(info.track || '')}</span>` : '';
        mediaHtml = `<div class="answer-media-row">${artHtml}<audio src="${esc(url)}" controls preload="none"></audio>${trackHtml}</div>`;
      } else if (q.type === 'video') {
        mediaHtml = `<div class="answer-media-row"><video src="${esc(url)}" controls preload="none" style="max-height:120px;border-radius:8px"></video></div>`;
      } else if (q.type === 'image') {
        mediaHtml = `<div class="answer-media-row"><img src="${esc(url)}" class="answer-img" alt=""></div>`;
      }
    }

    row.innerHTML = `
      <div class="answer-num">${i + 1}</div>
      <div class="answer-body">
        <div class="answer-question-text">${esc(q.text)}</div>
        ${mediaHtml}
        <div class="answer-value">${esc(q.answer)}</div>
      </div>`;
    list.appendChild(row);
  });
}

function renderLeaderboard(teams) {
  const container = document.getElementById('lb-bars');
  container.innerHTML = '';
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const maxScore = sorted[0]?.score || 1;
  sorted.forEach((team, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row';
    const pct = (team.score / maxScore) * 100;
    row.innerHTML = `
      <span class="lb-name">${esc(team.name)}</span>
      <div class="lb-bar-outer">
        <div class="lb-bar-inner ${i === 0 ? 'first' : ''}" style="width: 0%"></div>
        <span class="lb-score">${team.score}</span>
      </div>`;
    container.appendChild(row);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { row.querySelector('.lb-bar-inner').style.width = pct + '%'; });
    });
  });
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

document.body.setAttribute('tabindex', '0');
document.body.focus();
connect();
