const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const QUIZZES_DIR = path.join(__dirname, '..', 'data', 'quizzes');

function ensureDir() {
  if (!fs.existsSync(QUIZZES_DIR)) fs.mkdirSync(QUIZZES_DIR, { recursive: true });
}

function listQuizzes() {
  ensureDir();
  const files = fs.readdirSync(QUIZZES_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(QUIZZES_DIR, f), 'utf-8'));
    return { id: data.id, title: data.title, rounds: data.rounds?.length || 0 };
  });
}

function getQuiz(id) {
  const safe = id.replace(/[^a-zA-Z0-9\-]/g, '');
  const file = path.join(QUIZZES_DIR, `${safe}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function saveQuiz(quiz) {
  ensureDir();
  if (!quiz.id) quiz.id = crypto.randomUUID();
  const safe = quiz.id.replace(/[^a-zA-Z0-9\-]/g, '');
  fs.writeFileSync(path.join(QUIZZES_DIR, `${safe}.json`), JSON.stringify(quiz, null, 2), 'utf-8');
  return quiz;
}

function deleteQuiz(id) {
  const safe = id.replace(/[^a-zA-Z0-9\-]/g, '');
  const file = path.join(QUIZZES_DIR, `${safe}.json`);
  if (fs.existsSync(file)) { fs.unlinkSync(file); return true; }
  return false;
}

module.exports = { listQuizzes, getQuiz, saveQuiz, deleteQuiz };
