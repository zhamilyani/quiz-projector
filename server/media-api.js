const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEDIA_DIR = path.join(__dirname, '..', 'media');

function ensureDir() {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function handleUpload(req, res) {
  ensureDir();
  const contentType = req.headers['content-type'] || '';
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No boundary' }));
    return;
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const parts = parseMultipart(buffer, boundary);
    if (!parts.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No file' }));
      return;
    }
    const part = parts[0];
    const ext = path.extname(part.filename) || '.bin';
    const safeName = crypto.randomUUID().slice(0, 8) + ext;
    fs.writeFileSync(path.join(MEDIA_DIR, safeName), part.data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url: `/media/${safeName}`, filename: safeName }));
  });
}

function parseMultipart(buffer, boundary) {
  const parts = [];
  const str = buffer.toString('binary');
  const sections = str.split(`--${boundary}`);
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    if (section.startsWith('--')) break;
    const headerEnd = section.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = section.substring(0, headerEnd);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    if (!filenameMatch) continue;
    let bodyStr = section.substring(headerEnd + 4);
    if (bodyStr.endsWith('\r\n')) bodyStr = bodyStr.slice(0, -2);
    parts.push({ filename: filenameMatch[1], data: Buffer.from(bodyStr, 'binary') });
  }
  return parts;
}

module.exports = { handleUpload };
