// Noora — state, persistence, domain logic
import { EXERCISES, PATTERN_PREFS, SPLITS, GOALS, EQUIPMENT_PROFILES, TIMED } from './data.js';

const KEY = 'fitx.v1';
export const VERSION = '1.0.0';

const defaults = () => ({
  version: 1,
  profile: null,
  settings: { unit: 'kg', rest: 0, sound: true, vibrate: true, notify: true, barKg: 20 },
  program: null,
  programIndex: 0,
  routines: [],
  customExercises: [],
  sessions: [],
  bodyweight: [],
  active: null,
});

export let S = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(defaults(), JSON.parse(raw));
  } catch (e) { console.warn('load failed', e); }
  return defaults();
}

let saveTimer = null;
export function save(now = false) {
  clearTimeout(saveTimer);
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn(e); } };
  if (now) write(); else saveTimer = setTimeout(write, 250);
}
export function replaceState(next) { S = Object.assign(defaults(), next); save(true); }
export function resetAll() { S = defaults(); save(true); }

// ---------- ids / dates
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const todayKey = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export function startOfWeek(d = new Date()) { // Monday
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x;
}
export const fmtDate = (ts, opts = { day: 'numeric', month: 'short' }) => new Date(ts).toLocaleDateString(undefined, opts);
export function fmtDur(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}
export function fmtClock(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

// ---------- units (stored in kg)
export const unit = () => S.settings.unit;
export const LB = 2.2046226;
export function toDisp(kg) { if (kg === '' || kg == null || isNaN(kg)) return ''; const v = unit() === 'lb' ? kg * LB : kg; return Math.round(v * 100) / 100; }
export function fromDisp(v) { if (v === '' || v == null || isNaN(v)) return ''; v = +v; return unit() === 'lb' ? v / LB : v; }
export function wFmt(kg, digits = 1) {
  if (kg === '' || kg == null || isNaN(kg)) return '–';
  const v = toDisp(kg); const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return `${r}`;
}
export function bigNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return Math.round(n / 1000) + 'k';
  if (n >= 1e3) return (n / 1000).toFixed(1) + 'k';
  return String(Math.round(n));
}

// ---------- exercises
export function allExercises() { return [...EXERCISES, ...S.customExercises]; }
const exCache = new Map();
export function ex(id) {
  if (exCache.has(id)) return exCache.get(id);
  const e = allExercises().find(x => x.id === id);
  if (e) exCache.set(id, e);
  return e || { id, name: 'Unknown exercise', muscle: 'other', secondary: '', equipment: 'other', cues: [] };
}
export function clearExCache() { exCache.clear(); }
export const isTimed = id => TIMED.has(id);

// ---------- strength math
export function e1rm(w, r) {
  w = +w; r = +r;
  if (!w || !r) return 0;
  if (r === 1) return w;
  if (r > 15) r = 15;
  return w * (1 + r / 30); // Epley
}
export const workingSets = sets => sets.filter(s => s.done && s.type !== 'w');
export function sessionVolume(sess) {
  let v = 0;
  for (const e of sess.exercises) for (const s of workingSets(e.sets)) v += (+s.w || 0) * (+s.r || 0);
  return v;
}
export function sessionSetCount(sess) { return sess.exercises.reduce((a, e) => a + workingSets(e.sets).length, 0); }

// History for an exercise: [{ts, sets, best1rm, bestW, volume}]
export function exHistory(exId) {
  const out = [];
  for (const s of S.sessions) {
    const e = s.exercises.find(x => x.exId === exId);
    if (!e) continue;
    const ws = workingSets(e.sets);
    if (!ws.length) continue;
    let best = 0, bestW = 0, vol = 0, bestReps = 0;
    for (const st of ws) { best = Math.max(best, e1rm(st.w, st.r)); bestW = Math.max(bestW, +st.w || 0); vol += (+st.w || 0) * (+st.r || 0); bestReps = Math.max(bestReps, +st.r || 0); }
    out.push({ ts: s.start, sessionId: s.id, sets: ws, best1rm: best, bestW, vol, bestReps });
  }
  return out.sort((a, b) => a.ts - b.ts);
}
export function lastPerformance(exId) {
  const h = exHistory(exId); return h.length ? h[h.length - 1] : null;
}
export function personalBests() {
  const map = new Map();
  for (const s of S.sessions) for (const e of s.exercises) for (const st of workingSets(e.sets)) {
    const v = e1rm(st.w, st.r);
    const cur = map.get(e.exId);
    if (!cur || v > cur.e1rm || (v === cur.e1rm && (+st.r) > cur.r)) map.set(e.exId, { exId: e.exId, e1rm: v, w: +st.w || 0, r: +st.r || 0, ts: s.start });
  }
  return [...map.values()].filter(x => x.e1rm > 0).sort((a, b) => b.ts - a.ts);
}

// Progression hint: returns {text, w} or null
export function suggestion(exId, target) {
  const last = lastPerformance(exId);
  if (!last || !target) return null;
  const [lo, hi] = target.reps;
  const allTop = last.sets.length >= Math.max(1, target.sets - 1) && last.sets.every(s => +s.r >= hi);
  const topW = Math.max(...last.sets.map(s => +s.w || 0));
  if (allTop && topW > 0 && !isTimed(exId)) {
    const e = ex(exId);
    const stepKg = unit() === 'lb' ? (e.equipment === 'dumbbell' ? 5 : 5) / LB : (e.equipment === 'dumbbell' ? 2 : 2.5);
    return { up: true, w: topW + stepKg, text: `You hit ${hi}+ reps on every set last time — go up to ${wFmt(topW + stepKg)} ${unit()}` };
  }
  const anyLow = last.sets.some(s => +s.r < lo);
  if (anyLow && topW > 0) return { up: false, w: topW, text: `Stay at ${wFmt(topW)} ${unit()} and aim for ${lo}–${hi} reps on every set` };
  return { up: false, w: topW, text: `Last: ${last.sets.map(s => setLabel(exId, s)).join(', ')}` };
}
export function setLabel(exId, s) {
  if (isTimed(exId)) return `${s.r || 0}${+s.w ? ` @${wFmt(s.w)}` : ''}`;
  return +s.w ? `${wFmt(s.w)}×${s.r}` : `${s.r} reps`;
}

// ---------- program generation
export function goalOf() { return GOALS[S.profile?.goal] || GOALS.recomp; }
export function restDefault() { return S.settings.rest || goalOf().rest; }

export function generateProgram(profile) {
  const days = Math.min(6, Math.max(2, +profile.days || 3));
  const split = SPLITS[days];
  const eq = new Set(EQUIPMENT_PROFILES[profile.equipment]?.eq || EQUIPMENT_PROFILES.gym.eq);
  const g = GOALS[profile.goal] || GOALS.recomp;
  const level = profile.level || 'beginner';
  const byId = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
  const out = split.days.map(([name, focus, slots], i) => {
    const used = new Set();
    let list = [];
    for (const slot of slots) {
      const prefs = PATTERN_PREFS[slot] || [];
      const pick = prefs.find(id => byId[id] && eq.has(byId[id].equipment) && !used.has(id));
      if (!pick) continue;
      used.add(pick);
      const compound = ['squat', 'squat2', 'hinge', 'hinge2', 'h_push', 'v_push', 'h_pull', 'v_pull'].includes(slot);
      let sets = g.sets, reps = [...g.reps], rest = g.rest;
      if (!compound) { sets = Math.min(sets, 3); reps = g.reps[1] <= 6 ? [8, 12] : [Math.max(10, g.reps[0]), Math.max(15, g.reps[1])]; rest = Math.min(rest, 75); }
      if (level === 'beginner') sets = Math.min(sets, 3);
      if (TIMED.has(pick)) { reps = slot === 'core2' ? [30, 60] : [10, 20]; sets = slot === 'core2' ? 3 : 1; rest = 45; }
      list.push({ exId: pick, sets, reps, rest });
    }
    if (level === 'beginner' && list.length > 5) list = list.slice(0, 5);
    if (g.finisher) {
      const fin = (PATTERN_PREFS.cardio).find(id => byId[id] && eq.has(byId[id].equipment) && !used.has(id))
        || (PATTERN_PREFS.conditioning).find(id => byId[id] && eq.has(byId[id].equipment) && !used.has(id));
      if (fin) list.push({ exId: fin, sets: 1, reps: [10, 20], rest: 30 });
    }
    return { id: 'p' + i + '_' + uid(), name, focus, exercises: list };
  });
  return { name: split.name, days: out, createdAt: Date.now() };
}

export function nextProgramDay() {
  if (!S.program?.days?.length) return null;
  return S.program.days[S.programIndex % S.program.days.length];
}
export function findRoutine(id) {
  return S.program?.days.find(d => d.id === id) || S.routines.find(r => r.id === id) || null;
}

// ---------- workout lifecycle
export function startWorkout(routine) {
  const exercises = (routine?.exercises || []).map(r => buildExercise(r.exId, r));
  S.active = { id: uid(), name: routine?.name || 'Quick Workout', routineId: routine?.id || null, start: Date.now(), exercises, notes: '' };
  save(true);
  return S.active;
}
export function buildExercise(exId, target) {
  const t = target ? { sets: target.sets, reps: target.reps, rest: target.rest } : { sets: 3, reps: [8, 12], rest: restDefault() };
  const sug = suggestion(exId, t);
  const last = lastPerformance(exId);
  const w = sug?.w ?? (last ? last.bestW : '');
  const sets = Array.from({ length: t.sets }, () => ({ w: w || '', r: '', done: false, type: 'n' }));
  return { exId, target: t, rest: t.rest || restDefault(), sets };
}
export function finishWorkout() {
  const a = S.active; if (!a) return null;
  const exercises = a.exercises.map(e => ({ exId: e.exId, sets: e.sets.filter(s => s.done).map(s => ({ w: +s.w || 0, r: +s.r || 0, type: s.type, done: true })) })).filter(e => e.sets.length);
  // PR detection vs prior history
  const prs = [];
  for (const e of exercises) {
    const prior = exHistory(e.exId);
    const prevBest = prior.reduce((m, h) => Math.max(m, h.best1rm), 0);
    const prevW = prior.reduce((m, h) => Math.max(m, h.bestW), 0);
    const ws = workingSets(e.sets);
    const best = ws.reduce((m, s) => Math.max(m, e1rm(s.w, s.r)), 0);
    const bestW = ws.reduce((m, s) => Math.max(m, s.w), 0);
    if (prior.length && best > prevBest + 0.01 && !isTimed(e.exId)) prs.push({ exId: e.exId, kind: 'e1rm', value: best });
    else if (prior.length && bestW > prevW + 0.01 && !isTimed(e.exId)) prs.push({ exId: e.exId, kind: 'weight', value: bestW });
  }
  const sess = { id: a.id, name: a.name, routineId: a.routineId, start: a.start, end: Date.now(), exercises, notes: a.notes || '', prs };
  sess.volume = sessionVolume(sess);
  if (exercises.length) {
    S.sessions.push(sess);
    if (a.routineId && S.program) {
      const idx = S.program.days.findIndex(d => d.id === a.routineId);
      if (idx >= 0) S.programIndex = idx + 1;
    }
  }
  S.active = null; save(true);
  return exercises.length ? sess : null;
}

// ---------- stats
export function weekStats(weekStart = startOfWeek()) {
  const end = weekStart.getTime() + 7 * 864e5;
  const ss = S.sessions.filter(s => s.start >= weekStart.getTime() && s.start < end);
  return { count: ss.length, volume: ss.reduce((a, s) => a + (s.volume || 0), 0), sessions: ss };
}
export function streakWeeks() {
  // consecutive weeks (ending this or last week) with >= 1 workout
  let n = 0; let w = startOfWeek();
  if (!weekStats(w).count) w = new Date(w.getTime() - 7 * 864e5);
  while (weekStats(w).count) { n++; w = new Date(w.getTime() - 7 * 864e5); }
  return n;
}
export function muscleSets(sessions) {
  const m = {};
  for (const s of sessions) for (const e of s.exercises) {
    const mu = ex(e.exId).muscle; m[mu] = (m[mu] || 0) + workingSets(e.sets).length;
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
export function latestWeight() {
  if (S.bodyweight.length) return [...S.bodyweight].sort((a, b) => a.date.localeCompare(b.date)).at(-1).kg;
  return S.profile?.weightKg || null;
}
