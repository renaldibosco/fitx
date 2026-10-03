// NrXFitz — Fight Mode: boxing / Muay Thai rounds with bell and spoken combos
import { speak, vibrate, keepAwake } from './native.js';

export const COMBOS = {
  boxing: {
    basic: ['Jab', 'Jab, cross', 'Double jab', 'Jab, cross, hook', 'Cross, hook', 'Jab, jab, cross', 'Hook, cross', 'Jab, uppercut', 'Slip and cross', 'Body jab'],
    pro: ['One, two, three, two', 'Jab, cross, hook, cross', 'Double jab, cross, hook', 'Slip, slip, cross, hook', 'Uppercut, hook, cross', 'Jab to the body, hook to the head', 'Cross, hook, roll, cross', 'Six punch combo!', 'Double hook, cross', 'Feint jab, cross'],
  },
  muaythai: {
    basic: ['Jab, cross', 'Teep', 'Right knee', 'Left knee', 'Jab, teep', 'Right kick', 'Left kick', 'Jab, cross, right kick', 'Double knee', 'Check and cross'],
    pro: ['Jab, cross, hook, low kick', 'Teep, cross, left kick', 'Clinch, knee, knee', 'Elbow, elbow, knee', 'Jab, cross, switch kick', 'Cross, hook, right knee', 'Teep, teep, cross', 'Block, counter kick', 'Hook, low kick, knee', 'Jab, right elbow, left knee'],
  },
};
const MOTIVATE = ['Hands up!', 'Breathe!', 'Move your feet!', 'Chin down!', 'Stay sharp!', 'Last push!', 'Keep working!'];

let actx = null;
function ctx() { try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* ignore */ } return actx; }
export function bell(times = 1) {
  const c = ctx(); if (!c) return;
  for (let n = 0; n < times; n++) {
    const t = c.currentTime + n * 0.7;
    for (const [f, a] of [[880, 0.5], [1760, 0.22], [2640, 0.12], [3520, 0.06]]) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 2.3);
    }
  }
}
function clack() {
  const c = ctx(); if (!c) return;
  for (let i = 0; i < 2; i++) {
    const t = c.currentTime + i * 0.18; const o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = 520; g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.1);
  }
}

export const fight = { style: 'muaythai', level: 'basic', rounds: 5, work: 180, rest: 60, every: 6, voice: true, running: false };

export function startFight() {
  Object.assign(fight, { running: true, round: 1, phase: 'prep', end: Date.now() + 10000, nextCall: 0, warned: false, lastCall: '' });
  keepAwake(true); speak('Get ready. Round one in ten seconds.');
}
export function stopFight() { fight.running = false; keepAwake(false); }

// returns true when the round state changed (to re-render labels)
export function tickFight() {
  if (!fight.running) return false;
  const now = Date.now(); const left = (fight.end - now) / 1000;
  if (fight.phase === 'work') {
    if (!fight.warned && left <= 10 && left > 0) { fight.warned = true; clack(); }
    if (fight.voice && now >= fight.nextCall && left > 3) {
      const pool = COMBOS[fight.style][fight.level];
      let c = Math.random() < 0.12 ? MOTIVATE[Math.floor(Math.random() * MOTIVATE.length)] : pool[Math.floor(Math.random() * pool.length)];
      if (c === fight.lastCall) c = pool[(pool.indexOf(c) + 1) % pool.length];
      fight.lastCall = c; speak(c, 'en-US', 1.12);
      fight.nextCall = now + (fight.every + Math.random() * 2) * 1000;
    }
  }
  if (left > 0) return false;
  if (fight.phase === 'prep' || fight.phase === 'rest') {
    if (fight.phase === 'rest') fight.round++;
    fight.phase = 'work'; fight.end = now + fight.work * 1000; fight.warned = false; fight.nextCall = now + 2500;
    bell(1); vibrate([300]);
  } else if (fight.round < fight.rounds) {
    fight.phase = 'rest'; fight.end = now + fight.rest * 1000; bell(2); vibrate([200, 100, 200]);
    setTimeout(() => speak(`Round ${fight.round} done. Breathe. ${fight.rounds - fight.round} to go.`), 1500);
  } else {
    bell(3); vibrate([400, 150, 400, 150, 400]); fight.running = false; fight.done = true; keepAwake(false);
    setTimeout(() => speak('Fight over. Great work, champion!'), 2200);
  }
  return true;
}
