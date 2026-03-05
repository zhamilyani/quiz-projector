const WebSocket = require('ws');

class GameState {
  constructor() {
    this.clients = new Map();
    this.timer = null;
    this.timerValue = 0;
    this.timerMax = 0;
    this.timerRunning = false;
    this.currentScreen = { type: 'show_welcome', title: 'Quiz Projector' };
  }

  register(ws, role) {
    this.clients.set(ws, { role });
    ws.send(JSON.stringify({ type: 'state_sync', screen: this.currentScreen, timer: this.timerValue, timerMax: this.timerMax, timerRunning: this.timerRunning }));
  }

  unregister(ws) { this.clients.delete(ws); }

  broadcast(msg, excludeWs = null) {
    const data = typeof msg === 'string' ? msg : JSON.stringify(msg);
    for (const [ws] of this.clients) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) ws.send(data);
    }
  }

  handleMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type, ...payload } = msg;

    switch (type) {
      case 'register':
        this.register(ws, payload.role);
        break;
      case 'show_welcome':
      case 'show_round_title':
      case 'show_question':
      case 'show_answer':
      case 'show_leaderboard':
      case 'show_final':
      case 'show_round_answers':
      case 'show_discussion':
        this.currentScreen = msg;
        this.broadcast(msg, ws);
        break;
      case 'timer_start':
        this.timerMax = payload.duration || 60;
        this.timerValue = this.timerMax;
        this.timerRunning = true;
        this.startTimer();
        this.broadcast({ type: 'timer_start', duration: this.timerMax, value: this.timerValue });
        break;
      case 'timer_pause':
        this.timerRunning = false;
        this.stopTimer();
        this.broadcast({ type: 'timer_pause', value: this.timerValue });
        break;
      case 'timer_reset':
        this.timerRunning = false;
        this.stopTimer();
        this.timerValue = payload.duration || this.timerMax;
        this.timerMax = this.timerValue;
        this.broadcast({ type: 'timer_reset', value: this.timerValue, duration: this.timerMax });
        break;
      default:
        this.broadcast(msg, ws);
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (this.timerValue > 0) {
        this.timerValue--;
        this.broadcast({ type: 'timer_tick', value: this.timerValue, duration: this.timerMax });
        if (this.timerValue === 0) {
          this.timerRunning = false;
          this.stopTimer();
          this.broadcast({ type: 'timer_end' });
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });
  const state = new GameState();
  wss.on('connection', (ws) => {
    ws.on('message', (data) => state.handleMessage(ws, data.toString()));
    ws.on('close', () => state.unregister(ws));
  });
  return wss;
}

module.exports = { setupWebSocket };
