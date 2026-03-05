const http = require('http');
const fs = require('fs');
const path = require('path');
const { setupWebSocket } = require('./server/ws-handler');
const { listQuizzes, getQuiz, saveQuiz, deleteQuiz } = require('./server/quiz-api');
const { handleUpload } = require('./server/media-api');
const { handleGenerate } = require('./server/generate-api');

const PORT = 3005;
const DIST_DIR = path.join(__dirname, 'dist');
const ROOT_DIR = __dirname;

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webp': 'image/webp',
};

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);
  res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size, 'Cache-Control': 'no-cache' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // REST API
  if (pathname === '/api/quizzes' && req.method === 'GET') return sendJson(res, listQuizzes());
  if (pathname.startsWith('/api/quizzes/') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    const quiz = getQuiz(id);
    return quiz ? sendJson(res, quiz) : sendJson(res, { error: 'Not found' }, 404);
  }
  if (pathname === '/api/quizzes' && req.method === 'POST') {
    const body = await readBody(req);
    return sendJson(res, saveQuiz(JSON.parse(body.toString())));
  }
  if (pathname.startsWith('/api/quizzes/') && req.method === 'DELETE') {
    deleteQuiz(pathname.split('/')[3]);
    return sendJson(res, { ok: true });
  }
  if (pathname === '/api/media' && req.method === 'POST') return handleUpload(req, res);
  if (pathname === '/api/generate' && req.method === 'POST') return handleGenerate(req, res);

  // Media files
  if (pathname.startsWith('/media/')) return serveStatic(res, path.join(ROOT_DIR, pathname));

  // Static (production: dist, dev: root)
  const base = fs.existsSync(DIST_DIR) ? DIST_DIR : ROOT_DIR;
  let filePath;
  if (pathname === '/') filePath = path.join(base, 'index.html');
  else if (pathname.endsWith('/')) filePath = path.join(base, pathname, 'index.html');
  else if (fs.existsSync(path.join(base, pathname))) filePath = path.join(base, pathname);
  else if (fs.existsSync(path.join(base, pathname + '.html'))) filePath = path.join(base, pathname + '.html');
  else {
    const dir = pathname.split('/')[1];
    const candidate = path.join(base, dir, 'index.html');
    filePath = fs.existsSync(candidate) ? candidate : path.join(base, 'index.html');
  }
  serveStatic(res, filePath);
});

setupWebSocket(server);
server.listen(PORT, () => console.log(`Quiz Projector server running on http://localhost:${PORT}`));
