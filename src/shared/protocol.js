// WebSocket message types
export const MSG = {
  SHOW_WELCOME: 'show_welcome',
  SHOW_ROUND_TITLE: 'show_round_title',
  SHOW_QUESTION: 'show_question',
  SHOW_ANSWER: 'show_answer',
  SHOW_LEADERBOARD: 'show_leaderboard',
  SHOW_FINAL: 'show_final',
  SHOW_ROUND_ANSWERS: 'show_round_answers',
  SHOW_DISCUSSION: 'show_discussion',
  TIMER_START: 'timer_start',
  TIMER_PAUSE: 'timer_pause',
  TIMER_RESET: 'timer_reset',
  TIMER_TICK: 'timer_tick',
  TIMER_END: 'timer_end',
  REGISTER: 'register',
  STATE_SYNC: 'state_sync',
};

export const ROLES = { HOST: 'host', PROJECTOR: 'projector' };

export function makeMsg(type, payload = {}) {
  return JSON.stringify({ type, ...payload });
}

export function parseMsg(data) {
  try { return JSON.parse(data); } catch { return null; }
}
