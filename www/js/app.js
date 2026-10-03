// NrXFitz — app shell, router, screens
import * as St from './store.js';
import { S, save, ex, wFmt, toDisp, fromDisp, unit, fmtDate, fmtDur, fmtClock, e1rm, workingSets, isTimed, bigNum } from './store.js';
import { EXERCISES, MUSCLES, EQUIPMENT, EQUIPMENT_PROFILES, GOALS, LEVELS, FIGHT_ROUTINES, EQUIP_ITEMS } from './data.js';
import { t, LANGS } from './i18n.js';
import { animSvg, animFor, startAnims } from './anim.js';
import { askCoach, offlineAnswer, chatHistory, resetChat, MODELS } from './coach.js';
import { fight, startFight, stopFight, tickFight, COMBOS, bell } from './fight.js';
import * as Ph from './photos.js';
import { icon, LOGO } from './icons.js';
import { lineChart, barChart } from './charts.js';
import * as N from './native.js';

const $app = document.getElementById('app');
const $ov = document.getElementById('overlay');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => (s || '').charAt(0).toUpperCase() + (s || '').slice(1);

// ============================================================ router
const TABS = [['today', 'Today', 'home'], ['plan', 'Plan', 'plan'], ['exercises', 'Exercises', 'dumbbell'], ['progress', 'Progress', 'chart'], ['more', 'More', 'grid']];
const route = () => (location.hash.replace(/^#\/?/, '') || 'today').split('/');
export const go = (path, replace = false) => { const h = '#/' + path; if (replace) location.replace(h); else location.hash = h; };
window.addEventListener('hashchange', () => { closeSheet(true); render(); window.scrollTo(0, 0); });

let onboardStep = 0;
let ui = { exFilter: 'all', exQuery: '', progressEx: null, sessionsMonth: null };

function render() {
  if (!S.profile) { $app.innerHTML = renderOnboarding(); return; }
  const [r, a] = route();
  const screens = {
    today: renderToday, plan: renderPlan, exercises: renderExercises, progress: renderProgress, more: renderMore,
    workout: renderWorkout, history: renderHistory, session: () => renderSession(a), exercise: () => renderExerciseDetail(a),
    routine: () => renderRoutineEditor(a), tool: () => renderTool(a), settings: renderSettings, bodyweight: renderBodyweight,
    fight: renderFight, achievements: renderAchievements, body: renderBody, cardio: renderCardio, equipment: renderEquipment,
  };
  const fn = screens[r] || renderToday;
  const isTab = TABS.some(t => t[0] === r) || !screens[r];
  $app.innerHTML = fn() + (isTab ? renderTabs(r) : '') + (isTab && S.active ? livePill() : '') + (['today', 'exercises', 'plan', 'progress'].includes(r) || !screens[r] ? coachFab() : '');
  afterRender(r);
}

function renderTabs(cur) {
  return `<nav class="tabs"><div class="inner">${TABS.map(([id, label, ic]) => `<button data-go="${id}" class="${cur === id ? 'on' : ''}">${icon(ic)}<span>${t(label)}</span></button>`).join('')}</div></nav>`;
}
function livePill() {
  return `<button class="live-pill" data-go="workout"><span class="pulse"></span><span style="flex:1;text-align:left">${esc(S.active.name)}</span><span class="num" data-elapsed style="font-size:17px">${fmtClock((Date.now() - S.active.start) / 1000)}</span>${icon('right')}</button>`;
}
const topbar = (title, { back = true, right = '' } = {}) => `<header class="topbar">${back ? `<button class="icon-btn" data-back>${icon('left')}</button>` : ''}<div class="title">${esc(title)}</div>${right}</header>`;

// ============================================================ onboarding
let draft = { name: '', goal: 'recomp', level: 'beginner', equipment: 'gym', items: ['dumbbell'], days: 4, sex: 'male', age: '', heightCm: '', weightKg: '', unit: 'kg' };
const ONB_STEPS = 7;
function renderOnboarding() {
  const s = onboardStep;
  if (s === 0) return `<div class="onb" style="position:relative">
      <div class="splash-art">${splashArt()}</div>
      <div class="brand" style="margin-top:6px"><div class="brand-mark">${LOGO}</div><div class="brand-name">NrX<b>Fitz</b></div></div>
      <div class="splash-hero">
        <div class="tiny accent">Your training system</div>
        <h1>Train<br>smarter.<br><b>Get stronger.</b></h1>
        <p class="muted" style="font-size:16px;margin:0;max-width:340px">A personalised plan, a fast workout logger with rest timer, and progress tracking that shows every rep paying off.</p>
      </div>
      <button class="btn primary block" data-onb-next style="height:56px;font-size:16px">Build my plan ${icon('right')}</button>
      <p class="faint small" style="text-align:center;margin:12px 0 0">Works offline · Your data stays on this phone</p>
    </div>`;
  const pct = Math.round((s / ONB_STEPS) * 100);
  let body = '', canNext = true;
  if (s === 1) {
    body = `<h1 class="display">What should we<br>call you?</h1><p class="muted">Just your first name is fine.</p>
      <label class="field" style="margin-top:22px"><input id="onb-name" value="${esc(draft.name)}" placeholder="Your name" autocomplete="given-name" maxlength="24" style="font-size:18px;height:56px"></label>`;
  } else if (s === 2) {
    body = `<h1 class="display">Main goal</h1><p class="muted">This sets your sets, reps and rest times.</p><div style="margin-top:18px">${Object.entries(GOALS).map(([k, g]) => choice('goal', k, g.label, g.desc)).join('')}</div>`;
  } else if (s === 3) {
    body = `<h1 class="display">Experience</h1><p class="muted">Be honest — we'll progress you from here.</p><div style="margin-top:18px">
      ${choice('level', 'beginner', 'Beginner', 'New or returning after a long break')}
      ${choice('level', 'intermediate', 'Intermediate', '6+ months of consistent training')}
      ${choice('level', 'advanced', 'Advanced', '2+ years, comfortable with heavy compounds')}</div>`;
  } else if (s === 4) {
    body = `<h1 class="display">Where do you train?</h1><p class="muted">We'll only pick exercises you can actually do.</p><div style="margin-top:18px">${Object.entries(EQUIPMENT_PROFILES).map(([k, e]) => choice('equipment', k, e.label, e.desc)).join('')}</div>
      ${draft.equipment === 'custom' ? `<div class="chips" style="flex-wrap:wrap;margin-top:14px">${EQUIP_ITEMS.map(([k, l]) => `<button class="chip ${(draft.items || []).includes(k) ? 'on' : ''}" data-ditem="${k}">${l}</button>`).join('')}</div>` : ''}`;
  } else if (s === 5) {
    body = `<h1 class="display">Days per week</h1><p class="muted">Pick what you can stick to. Consistency beats intensity.</p>
      <div class="grid3" style="margin-top:22px;grid-template-columns:repeat(5,1fr)">${[2, 3, 4, 5, 6].map(d => `<button class="choice ${draft.days === d ? 'on' : ''}" data-draft="days" data-val="${d}" style="justify-content:center;flex-direction:column;gap:2px;margin:0;padding:16px 0"><span class="num" style="font-size:30px">${d}</span><span class="tiny faint">days</span></button>`).join('')}</div>
      <div class="card" style="margin-top:18px"><div class="tiny faint">Your split</div><div class="display" style="font-size:24px;margin-top:6px">${({ 2: 'Full Body A/B', 3: 'Full Body ×3', 4: 'Upper / Lower', 5: 'PPL + Upper/Lower', 6: 'Push / Pull / Legs ×2' })[draft.days]}</div></div>`;
  } else if (s === 6) {
    const u = draft.unit;
    canNext = draft.age && draft.heightCm && draft.weightKg;
    body = `<h1 class="display">About you</h1><p class="muted">Used for calorie targets and tracking your weight.</p>
      <div style="margin-top:18px" class="stack">
        <div class="seg">${['kg', 'lb'].map(x => `<button data-draft="unit" data-val="${x}" class="${u === x ? 'on' : ''}">${x === 'kg' ? 'Metric (kg)' : 'Imperial (lb)'}</button>`).join('')}</div>
        <div class="seg">${['male', 'female'].map(x => `<button data-draft="sex" data-val="${x}" class="${draft.sex === x ? 'on' : ''}">${cap(x)}</button>`).join('')}</div>
        <div class="grid2">
          <label class="field"><span>Age</span><div class="input-unit"><input type="number" inputmode="numeric" data-dfield="age" value="${esc(draft.age)}" placeholder="25"><em>yrs</em></div></label>
          <label class="field" style="margin:0"><span>Height</span><div class="input-unit"><input type="number" inputmode="decimal" data-dfield="heightCm" value="${esc(draft.heightCm)}" placeholder="175"><em>cm</em></div></label>
        </div>
        <label class="field"><span>Current weight</span><div class="input-unit"><input type="number" inputmode="decimal" data-dfield="weightDisp" value="${esc(draft.weightKg ? Math.round((u === 'lb' ? draft.weightKg * St.LB : draft.weightKg) * 10) / 10 : '')}" placeholder="${u === 'lb' ? '170' : '75'}"><em>${u}</em></div></label>
      </div>`;
  } else if (s === 7) {
    const prog = St.generateProgram(draft);
    body = `<div class="tiny accent">Ready, ${esc(draft.name || 'athlete')}</div><h1 class="display">Your plan</h1>
      <p class="muted">${esc(prog.name)} · ${draft.days} days/week · ${GOALS[draft.goal].label}. You can edit any day later.</p>
      <div style="margin-top:16px">${prog.days.map((d, i) => `<div class="card tight"><div class="row between"><div><div class="tiny faint">Day ${i + 1}</div><h3 style="font-size:17px;margin-top:2px">${esc(d.name)}</h3></div><span class="tag">${d.exercises.length} exercises</span></div><div class="small muted" style="margin-top:6px">${d.exercises.map(e => esc(ex(e.exId).name)).join(' · ')}</div></div>`).join('')}</div>`;
  }
  return `<div class="onb"><div class="row"><button class="icon-btn" data-onb-back>${icon('left')}</button><div class="progress" style="flex:1"><i style="width:${pct}%"></i></div><span class="faint small" style="width:40px;text-align:right">${s}/${ONB_STEPS}</span></div>
    <div class="body">${body}</div>
    <div class="footer"><button class="btn primary block" data-onb-next ${canNext ? '' : 'disabled'} style="height:54px">${s === 7 ? 'Start training' : 'Continue'}</button></div></div>`;
}
function choice(field, val, title, desc) {
  return `<button class="choice ${draft[field] === val ? 'on' : ''}" data-draft="${field}" data-val="${val}"><span class="radio"></span><span style="flex:1"><span style="display:block;font-weight:700;font-size:16px">${esc(title)}</span><span class="small muted">${esc(desc)}</span></span></button>`;
}
function splashArt() {
  return `<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%"><defs><radialGradient id="sg" cx="80%" cy="20%" r="70%"><stop offset="0" stop-color="#C8F135" stop-opacity=".22"/><stop offset="1" stop-color="#C8F135" stop-opacity="0"/></radialGradient></defs><rect width="400" height="800" fill="url(#sg)"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${-100 + i * 70} 820 L${260 + i * 70} 0" stroke="#C8F135" stroke-opacity="${0.03 + (i % 3) * 0.02}" stroke-width="${18 + (i % 4) * 8}"/>`).join('')}</svg>`;
}
function finishOnboarding() {
  const p = { ...draft, name: draft.name.trim() || 'Athlete', createdAt: Date.now() };
  if (p.equipment !== 'custom') p.items = [...EQUIPMENT_PROFILES[p.equipment].items];
  S.profile = p;
  S.settings.unit = draft.unit;
  S.program = St.generateProgram(p);
  S.programIndex = 0;
  if (p.weightKg) S.bodyweight.push({ date: St.todayKey(), kg: +p.weightKg });
  save(true); go('today', true); render();
}

// ============================================================ Today
function renderToday() {
  const hr = new Date().getHours();
  const greet = t(hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening');
  const wk = St.weekStats(); const ws = St.startOfWeek();
  const doneDays = new Set(wk.sessions.map(s => new Date(s.start).toDateString()));
  const next = St.nextProgramDay();
  const target = S.profile.days;
  const lw = St.latestWeight();
  const recent = [...S.sessions].sort((a, b) => b.start - a.start).slice(0, 3);
  const hb = St.habit(); const pt = St.proteinTarget();
  const stalled = St.deloadSuggestion();
  const todayCardio = S.cardio.filter(c => c.date === St.todayKey());
  return `<div class="screen">
    <header class="topbar"><div class="brand" style="flex:1"><div class="brand-mark">${LOGO}</div><div class="brand-name">NrX<b>Fitz</b></div></div><button class="icon-btn" data-go="achievements">${icon('medal')}</button><button class="icon-btn" data-go="settings">${icon('settings')}</button></header>
    <div class="muted" style="margin-top:6px">${greet},</div>
    <h1 class="display" style="font-size:38px;margin-top:2px">${esc(S.profile.name)}</h1>

    <div class="card" style="margin-top:16px">
      <div class="row between"><div><div class="tiny faint">${t('This week')}</div><div class="num" style="font-size:26px;margin-top:2px">${wk.count}<span class="muted" style="font-size:16px"> / ${target} ${t('workouts')}</span></div></div>
      <div class="row" style="gap:6px;color:var(--warn)">${icon('flame')}<span class="num" style="font-size:22px">${St.streakWeeks()}</span><span class="small muted">${t('wk streak')}</span></div></div>
      <div class="week">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => { const dt = new Date(ws.getTime() + i * 864e5); const done = doneDays.has(dt.toDateString()); const today = dt.toDateString() === new Date().toDateString(); return `<div class="day ${done ? 'done' : ''} ${today ? 'today' : ''}"><div class="d">${d}</div><div class="dot">${done ? icon('check').replace('<svg', '<svg style="width:18px;height:18px"') : dt.getDate()}</div></div>`; }).join('')}</div>
    </div>

    ${St.inDeload() ? `<div class="card" style="margin-top:12px;border-color:var(--info)"><div class="row">${icon('refresh').replace('<svg', '<svg style="color:var(--info)"')}<div style="flex:1"><b>${t('Deload week')}</b><div class="small muted">Weights are set to ~60% with fewer sets until ${fmtDate(S.deloadUntil, { weekday: 'short', day: 'numeric', month: 'short' })}. Recover, then come back stronger.</div></div></div></div>` :
    stalled ? `<div class="card" style="margin-top:12px;border-color:var(--warn)"><div class="row" style="align-items:flex-start">${icon('bolt').replace('<svg', '<svg style="color:var(--warn)"')}<div style="flex:1"><b>Progress has stalled</b><div class="small muted" style="margin-top:2px">${stalled.slice(0, 3).map(id => esc(ex(id).name)).join(', ')} haven't improved in 2+ weeks. A lighter week lets your body catch up.</div>
      <div class="row" style="margin-top:10px"><button class="btn sm primary" data-act="deload-start">${t('Start deload week')}</button><button class="btn sm ghost" data-act="deload-dismiss">${t('Not now')}</button></div></div></div></div>` : ''}

    ${S.active ? `<div class="card hero section" style="margin-top:14px"><div class="tiny accent">${t('In progress')}</div><h2 class="display" style="font-size:28px;margin-top:6px">${esc(S.active.name)}</h2><p class="muted small" style="margin:4px 0 14px">Started ${fmtDur(Date.now() - S.active.start)} ago</p><button class="btn primary block" data-go="workout">${icon('play')} ${t('Resume workout')}</button></div>` :
    next ? `<div class="card hero" style="margin-top:14px">
      <div class="row between"><div class="tiny accent">${t('Up next')} · ${t('Day')} ${(S.programIndex % S.program.days.length) + 1} ${t('of')} ${S.program.days.length}</div><button class="small faint" data-act="skip-day">${t('Skip')} ›</button></div>
      <div class="row" style="align-items:flex-start;gap:8px"><div style="flex:1;min-width:0"><h2 class="display" style="font-size:32px;margin-top:6px">${esc(next.name)}</h2>
      <div class="muted small">${esc(next.focus || '')} · ${next.exercises.length} exercises · ~${estimateMins(next)} min</div></div>
      <div class="hero-anim">${animSvg(animFor(next.exercises[0]?.exId, ex(next.exercises[0]?.exId).muscle))}</div></div>
      <div style="margin:10px 0 14px">${next.exercises.slice(0, 4).map(e => `<div class="row small" style="padding:5px 0"><span class="muted" style="flex:1">${esc(ex(e.exId).name)}</span><span class="faint">${e.sets} × ${repStr(e)}</span></div>`).join('')}${next.exercises.length > 4 ? `<div class="small faint" style="padding-top:4px">+ ${next.exercises.length - 4} more</div>` : ''}</div>
      <div class="row"><button class="btn primary" style="flex:1" data-act="start-routine" data-id="${next.id}">${icon('play')} ${t('Start workout')}</button><button class="btn ghost" data-go="routine/${next.id}">${icon('edit')}</button></div>
    </div>` : ''}

    <div class="grid2" style="margin-top:12px">
      <div class="card tight habit"><div class="row between"><span class="row" style="gap:6px">${icon('drop').replace('<svg', '<svg style="width:18px;height:18px;color:var(--info)"')}<b>${t('Water')}</b></span><span class="small muted">${hb.water}/${St.WATER_GOAL}</span></div>
        <div class="habit-bar"><i style="width:${Math.min(100, hb.water / St.WATER_GOAL * 100)}%;background:var(--info)"></i></div>
        <div class="row" style="margin-top:8px;gap:6px"><button class="btn sm ghost" data-act="water" data-d="-1">−</button><button class="btn sm" style="flex:1;background:rgba(90,180,255,.14);color:var(--info)" data-act="water" data-d="1">+ 250 ml</button></div></div>
      <div class="card tight habit" style="margin:0"><div class="row between"><span class="row" style="gap:6px">${icon('egg').replace('<svg', '<svg style="width:18px;height:18px;color:var(--warn)"')}<b>${t('Protein')}</b></span><span class="small muted">${hb.protein}/${pt}g</span></div>
        <div class="habit-bar"><i style="width:${Math.min(100, hb.protein / pt * 100)}%;background:var(--warn)"></i></div>
        <div class="row" style="margin-top:8px;gap:6px"><button class="btn sm ghost" data-act="protein" data-d="-10">−</button><button class="btn sm" style="flex:1;background:rgba(255,181,71,.14);color:var(--warn)" data-act="protein-add">+ Add</button></div></div>
    </div>

    <div class="grid3" style="margin-top:12px">
      <div class="stat"><div class="tiny faint">${t('Volume')}</div><div class="v">${bigNum(toDisp(wk.volume) || 0)}<small>${unit()}</small></div></div>
      <div class="stat"><div class="tiny faint">${t('Weight')}</div><div class="v">${lw ? wFmt(lw) : '–'}<small>${unit()}</small></div></div>
      <div class="stat"><div class="tiny faint">${t('Cardio')}</div><div class="v">${todayCardio.reduce((a, c) => a + (c.mins || 0), 0)}<small>min</small></div></div>
    </div>

    <div class="quick">
      <button data-act="start-empty">${icon('plus')}<span>${t('Empty workout')}</span></button>
      <button data-go="fight">${icon('fist')}<span>${t('Fight Mode')}</span></button>
      <button data-act="log-cardio">${icon('run')}<span>${t('Log cardio')}</span></button>
      <button data-act="log-weight">${icon('scale')}<span>${t('Log weight')}</span></button>
    </div>

    <div class="section"><div class="section-head"><h2 class="display">${t('Recent')}</h2>${S.sessions.length ? `<button class="link" data-go="history">${t('See all')}</button>` : ''}</div>
    ${recent.length ? `<div class="list">${recent.map(sessionItem).join('')}</div>` : `<div class="card empty">${icon('dumbbell')}<div style="font-weight:600;color:var(--text)">${t('No workouts yet')}</div><div class="small">${t('Your first session will show up here.')}</div></div>`}</div>
  </div>`;
}
function coachFab() { return `<button class="coach-fab" data-act="coach" aria-label="${t('Ask Coach')}">${icon('mic')}<span>${t('Ask Coach')}</span></button>`; }
const repStr = e => isTimed(e.exId) ? `${e.reps[0]}–${e.reps[1]}${ex(e.exId).muscle === 'cardio' ? ' min' : ' s'}` : `${e.reps[0]}–${e.reps[1]}`;
function estimateMins(r) { let s = 0; for (const e of r.exercises) s += isTimed(e.exId) && e.sets === 1 ? e.reps[1] * 60 : e.sets * (45 + (e.rest || 90)); return Math.round(s / 60 / 5) * 5 || 5; }
function sessionItem(s) {
  return `<button class="item" data-go="session/${s.id}"><div class="avatar">${icon('dumbbell')}</div><div class="grow"><div class="t">${esc(s.name)}</div><div class="s">${fmtDate(s.start, { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtDur(s.end - s.start)} · ${bigNum(toDisp(s.volume || 0))} ${unit()}</div></div>${s.prs?.length ? `<span class="pr-badge">${icon('trophy').replace('<svg', '<svg style="width:12px;height:12px"')}${s.prs.length}</span>` : ''}${icon('right', 'chev')}</button>`;
}

// ============================================================ Plan
function renderPlan() {
  const p = S.program;
  const nextIdx = p ? S.programIndex % p.days.length : -1;
  return `<div class="screen">${topbar(t('Plan'), { back: false, right: `<button class="icon-btn" data-act="new-routine">${icon('plus')}</button>` })}
    ${p ? `<div class="card hero"><div class="tiny accent">${t('Your program')}</div><h2 class="display" style="font-size:28px;margin-top:6px">${esc(p.name)}</h2>
      <div class="muted small" style="margin-top:4px">${GOALS[S.profile.goal].label} · ${LEVELS[S.profile.level]} · ${EQUIPMENT_PROFILES[S.profile.equipment].label}</div>
      <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn sm ghost" data-act="regen">${icon('refresh')} ${t('Rebuild program')}</button><button class="btn sm ghost" data-go="equipment">${icon('dumbbell')} ${t('My equipment')}</button></div></div>` : `<div class="card hero"><div class="tiny accent">No program yet</div><h2 class="display" style="font-size:26px;margin-top:6px">Build your plan</h2><p class="muted small">Generate a program from your profile.</p><button class="btn primary" data-act="regen">${icon('refresh')} Build program</button></div>`}
    <div class="section"><div class="section-head"><h2 class="display">${t('Program days')}</h2></div>
      <div class="list">${(p?.days || []).map((d, i) => `<div class="item"><div class="avatar txt" style="${i === nextIdx ? 'background:var(--accent);color:var(--accent-ink)' : ''}">D${i + 1}</div><button class="grow" style="text-align:left" data-go="routine/${d.id}"><div class="t">${esc(d.name)} ${i === nextIdx ? '<span class="tag accent" style="margin-left:4px">Next</span>' : ''}</div><div class="s">${d.exercises.length} exercises · ~${estimateMins(d)} min</div></button><button class="btn sm primary" data-act="start-routine" data-id="${d.id}">${icon('play')}</button></div>`).join('')}</div>
    </div>
    <div class="section"><div class="section-head"><h2 class="display">${t('Fight training')}</h2><button class="link" data-go="fight">${t('Fight Mode')} ›</button></div>
      <div class="list">${FIGHT_ROUTINES.map(r => `<div class="item"><div class="avatar">${icon('fist')}</div><button class="grow" style="text-align:left" data-go="routine/${r.id}"><div class="t">${esc(r.name)}</div><div class="s">${esc(r.focus)} · ~${estimateMins(r)} min</div></button><button class="btn sm primary" data-act="start-routine" data-id="${r.id}">${icon('play')}</button></div>`).join('')}</div>
    </div>
    <div class="section"><div class="section-head"><h2 class="display">${t('My routines')}</h2><button class="link" data-act="new-routine">+ New</button></div>
      ${S.routines.length ? `<div class="list">${S.routines.map(r => `<div class="item"><div class="avatar">${icon('bolt')}</div><button class="grow" style="text-align:left" data-go="routine/${r.id}"><div class="t">${esc(r.name)}</div><div class="s">${r.exercises.length} exercises</div></button><button class="btn sm primary" data-act="start-routine" data-id="${r.id}">${icon('play')}</button></div>`).join('')}</div>`
        : `<div class="card empty">${icon('bolt')}<div style="font-weight:600;color:var(--text)">Build your own routine</div><div class="small" style="margin-bottom:14px">Mix any exercises for a custom session.</div><button class="btn sm primary" data-act="new-routine">${icon('plus')} Create routine</button></div>`}
    </div>
    <div class="section"><div class="card"><div class="row" style="align-items:flex-start">${icon('info', 'accent')}<div class="small muted"><b style="color:var(--text)">How progression works.</b> Hit the top of the rep range on every set and NrXFitz tells you to add weight next time. Fall short and it keeps the weight until you own it.</div></div></div></div>
  </div>`;
}

// ============================================================ Routine editor
let editing = null; // working copy
function renderRoutineEditor(id) {
  if (!editing || editing.id !== id) {
    const src = St.findRoutine(id);
    if (!src) return `<div class="screen">${topbar('Routine')}<div class="empty">Routine not found.</div></div>`;
    editing = JSON.parse(JSON.stringify(src));
    editing._isProgram = !!S.program?.days.find(d => d.id === id);
  }
  const r = editing;
  return `<div class="screen no-tabs">${topbar(r._isProgram ? 'Edit day' : 'Edit routine', { right: `<button class="btn sm primary" data-act="save-routine">Save</button>` })}
    <label class="field"><span>Name</span><input data-rfield="name" value="${esc(r.name)}" maxlength="40"></label>
    <div class="section" style="margin-top:18px"><div class="section-head"><h2 class="display">Exercises</h2><span class="faint small">${r.exercises.length}</span></div>
    ${r.exercises.map((e, i) => { const x = ex(e.exId); return `<div class="card tight">
      <div class="row"><div class="grow" style="flex:1;min-width:0"><div style="font-weight:700">${esc(x.name)}</div><div class="small muted" style="text-transform:capitalize">${x.muscle} · ${x.equipment}</div></div>
      <button class="icon-btn" data-act="r-move" data-i="${i}" data-d="-1" ${i ? '' : 'disabled style="opacity:.3"'}>${icon('up')}</button><button class="icon-btn" data-act="r-move" data-i="${i}" data-d="1" ${i < r.exercises.length - 1 ? '' : 'disabled style="opacity:.3"'}>${icon('down')}</button><button class="icon-btn" data-act="r-del" data-i="${i}" style="color:var(--danger)">${icon('trash')}</button></div>
      <div class="grid3" style="margin-top:10px;grid-template-columns:1fr 1.4fr 1fr">
        <label class="field"><span>Sets</span><input type="number" inputmode="numeric" data-rex="${i}:sets" value="${e.sets}"></label>
        <label class="field" style="margin:0"><span>${isTimed(e.exId) ? 'Time range' : 'Rep range'}</span><div class="row" style="gap:4px"><input type="number" inputmode="numeric" data-rex="${i}:lo" value="${e.reps[0]}"><span class="faint">–</span><input type="number" inputmode="numeric" data-rex="${i}:hi" value="${e.reps[1]}"></div></label>
        <label class="field" style="margin:0"><span>Rest (s)</span><input type="number" inputmode="numeric" data-rex="${i}:rest" value="${e.rest}"></label>
      </div></div>`; }).join('')}
    <button class="btn ghost block" style="margin-top:12px" data-act="r-add">${icon('plus')} Add exercises</button></div>
    ${r._isProgram ? '' : `<button class="btn danger block section" data-act="r-delete-routine">${icon('trash')} Delete routine</button>`}
  </div>`;
}

// ============================================================ Exercises library
function renderExercises() {
  const q = ui.exQuery.toLowerCase();
  const list = St.allExercises().filter(e => (ui.exFilter === 'all' || e.muscle === ui.exFilter) && (!q || e.name.toLowerCase().includes(q) || e.equipment.includes(q)));
  return `<div class="screen">${topbar(t('Exercises'), { back: false, right: `<button class="icon-btn" data-act="new-exercise">${icon('plus')}</button>` })}
    <div class="input-unit" style="margin-bottom:12px"><input id="ex-search" placeholder="Search ${St.allExercises().length} exercises" value="${esc(ui.exQuery)}" style="padding-left:42px"><span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text-3)">${icon('search').replace('<svg', '<svg style="width:18px;height:18px"')}</span></div>
    <div class="chips">${['all', ...MUSCLES].map(m => `<button class="chip ${ui.exFilter === m ? 'on' : ''}" data-exfilter="${m}">${cap(m)}</button>`).join('')}</div>
    <div class="list" style="margin-top:12px" id="ex-list">${exListItems(list, 'go')}</div>
  </div>`;
}
function exListItems(list, mode, selected = new Set()) {
  if (!list.length) return `<div class="empty small">No exercises match.</div>`;
  return list.map(e => {
    const h = St.lastPerformance(e.id);
    const right = mode === 'pick' ? `<span class="check" style="margin:0;${selected.has(e.id) ? 'background:var(--accent);color:var(--accent-ink)' : ''}">${selected.has(e.id) ? icon('check') : ''}</span>` : icon('right', 'chev');
    return `<button class="item" ${mode === 'pick' ? `data-pick="${e.id}"` : `data-go="exercise/${e.id}"`}><div class="avatar txt" style="font-size:13px">${esc(e.muscle.slice(0, 3))}</div><div class="grow"><div class="t">${esc(e.name)}</div><div class="s" style="text-transform:capitalize">${e.muscle} · ${e.equipment}${h ? ` · <span class="accent">Best ${St.setLabel(e.id, h.sets.reduce((a, b) => e1rm(b.w, b.r) > e1rm(a.w, a.r) ? b : a))}</span>` : ''}</div></div>${right}</button>`;
  }).join('');
}
function renderExerciseDetail(id) {
  const e = ex(id); const hist = St.exHistory(id);
  const best = hist.reduce((m, h) => Math.max(m, h.best1rm), 0);
  const bestW = hist.reduce((m, h) => Math.max(m, h.bestW), 0);
  const timed = isTimed(id);
  return `<div class="screen no-tabs">${topbar('Exercise', { right: e.custom ? `<button class="icon-btn" data-act="del-custom-ex" data-id="${id}" style="color:var(--danger)">${icon('trash')}</button>` : '' })}
    <h1 class="display" style="font-size:32px">${esc(e.name)}</h1>
    <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:8px"><span class="tag accent">${e.muscle}</span>${e.secondary ? e.secondary.split(',').map(s => `<span class="tag">${esc(s.trim())}</span>`).join('') : ''}<span class="tag">${e.equipment}</span></div>
    <div class="anim-card">${animSvg(animFor(id, e.muscle))}<div class="anim-label tiny">Form demo</div></div>
    <button class="btn ghost block" style="margin-top:10px" data-act="coach" data-ex="${id}">${icon('mic')} ${t('Ask Coach')} about ${esc(e.name)}</button>
    ${hist.length && !timed ? `<div class="grid3" style="margin-top:16px">
      <div class="stat"><div class="tiny faint">Est. 1RM</div><div class="v">${wFmt(best)}<small>${unit()}</small></div></div>
      <div class="stat"><div class="tiny faint">Heaviest</div><div class="v">${wFmt(bestW)}<small>${unit()}</small></div></div>
      <div class="stat"><div class="tiny faint">Sessions</div><div class="v">${hist.length}</div></div></div>
      ${hist.length > 1 ? `<div class="card" style="margin-top:12px"><div class="tiny faint" style="margin-bottom:6px">Estimated 1RM (${unit()})</div>${lineChart(hist.slice(-20).map(h => ({ label: fmtDate(h.ts), y: Math.round(toDisp(h.best1rm) * 10) / 10 })))}</div>` : ''}` : ''}
    ${e.cues?.length ? `<div class="section"><div class="section-head"><h2 class="display">${t('How to')}</h2></div><div class="card"><ol class="cue-list">${e.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol></div></div>` : ''}
    <div class="section"><div class="section-head"><h2 class="display">History</h2></div>
      ${hist.length ? `<div class="list">${[...hist].reverse().slice(0, 15).map(h => `<button class="item" data-go="session/${h.sessionId}"><div class="grow"><div class="t">${fmtDate(h.ts, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div><div class="s">${h.sets.map(s => St.setLabel(id, s)).join(' · ')}</div></div>${timed ? '' : `<span class="num muted">${wFmt(h.best1rm)}</span>`}</button>`).join('')}</div>` : `<div class="card empty small">No sets logged yet.</div>`}
    </div>
    ${S.active ? `<button class="btn primary block section" data-act="add-to-active" data-id="${id}">${icon('plus')} Add to current workout</button>` : ''}
  </div>`;
}

// ============================================================ Workout logger
let restT = null; // { end, total, exIdx }
function renderWorkout() {
  const a = S.active;
  if (!a) { setTimeout(() => go('today', true)); return '<div class="screen"></div>'; }
  const done = a.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  const total = a.exercises.reduce((n, e) => n + e.sets.length, 0);
  const vol = a.exercises.reduce((v, e) => v + workingSets(e.sets).reduce((x, s) => x + (+s.w || 0) * (+s.r || 0), 0), 0);
  return `<div class="screen no-tabs">
    <div class="wk-head"><div class="row"><button class="icon-btn" data-back>${icon('down')}</button><div style="flex:1;min-width:0"><div class="title display" style="font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.name)}</div>
      <div class="wk-meta"><span><b data-elapsed>${fmtClock((Date.now() - a.start) / 1000)}</b></span><span><b>${bigNum(toDisp(vol))}</b>${unit()}</span><span><b>${done}</b>/ ${total} sets</span></div></div>
      <button class="icon-btn" data-act="coach">${icon('mic')}</button><button class="btn sm primary" data-act="finish">${t('Finish')}</button></div></div>
    ${St.inDeload() ? `<div class="ex-note" style="padding:10px 2px 0;color:var(--info)">Deload week — lighter weights, fewer sets. Focus on perfect form.</div>` : ''}
    ${a.exercises.map((e, i) => exBlock(e, i, a.exercises)).join('')}
    ${!a.exercises.length ? `<div class="card empty" style="margin-top:16px">${icon('dumbbell')}<div style="font-weight:600;color:var(--text)">Empty workout</div><div class="small">Add exercises to start logging.</div></div>` : ''}
    <button class="btn ghost block" style="margin-top:14px" data-act="w-add">${icon('plus')} ${t('Add exercises')}</button>
    <label class="field section"><span>${t('Notes')}</span><textarea id="w-notes" rows="2" placeholder="How did it feel?">${esc(a.notes || '')}</textarea></label>
    <button class="btn danger block" style="margin-top:14px" data-act="discard">Discard workout</button>
  </div>${restDock()}`;
}
function workIdx(e, j) { let n = -1; for (let k = 0; k <= j; k++) if (e.sets[k].type !== 'w') n++; return e.sets[j].type === 'w' ? -1 : n; }
function exBlock(e, i, all = []) {
  const x = ex(e.exId); const timed = isTimed(e.exId);
  const last = St.lastPerformance(e.exId);
  const sug = St.suggestion(e.exId, e.target);
  const ph = e.target ? `${e.target.reps[0]}-${e.target.reps[1]}` : '';
  const ssStart = e.ss && all[i + 1]; const ssEnd = i > 0 && all[i - 1]?.ss;
  const ssLetter = (() => { let n = 0; for (let k = 0; k <= i; k++) if (all[k]?.ss) n++; return String.fromCharCode(64 + Math.max(1, ssEnd ? n : n)); })();
  return `<div class="ex-block ${ssStart ? 'ss-a' : ''} ${ssEnd ? 'ss-b' : ''}" data-ex="${i}">
    ${ssStart || ssEnd ? `<div class="ss-tag">${icon('link').replace('<svg', '<svg style="width:12px;height:12px"')} Superset ${ssLetter}${ssEnd ? '2' : '1'}</div>` : ''}
    <div class="ex-top"><button class="ex-thumb" data-act="form" data-id="${e.exId}">${animSvg(animFor(e.exId, x.muscle))}</button><button class="ex-name" style="text-align:left" data-go="exercise/${e.exId}">${esc(x.name)}</button><span class="faint small row" style="gap:4px">${icon('timer').replace('<svg', '<svg style="width:15px;height:15px"')}${ssStart ? '0:00' : fmtClock(e.rest)}</span><button class="icon-btn" data-act="ex-menu" data-i="${i}">${icon('dots')}</button></div>
    ${sug ? `<div class="ex-note ${sug.up ? 'up' : ''}">${sug.up ? '▲ ' : ''}${esc(sug.text)}</div>` : e.target ? `<div class="ex-note">Target ${e.target.sets} × ${repStr({ exId: e.exId, reps: e.target.reps })}${timed ? '' : ' · first time — pick a weight you could do for 2 more reps'}</div>` : ''}
    <table class="sets"><thead><tr><th>${t('Set')}</th><th>${t('Previous')}</th><th>${timed ? `+${unit()}` : unit()}</th><th>${timed ? (x.muscle === 'cardio' || x.pattern === 'conditioning' ? 'Min' : 'Sec') : t('Reps')}</th><th></th></tr></thead><tbody>
    ${e.sets.map((s, j) => { const wi = workIdx(e, j); const p = wi >= 0 ? last?.sets[wi] : null; return `<tr class="${s.done ? 'done' : ''}">
      <td class="setno"><button data-act="set-type" data-i="${i}" data-j="${j}">${s.type === 'w' ? '<span class="warm">W</span>' : wi + 1}</button></td>
      <td class="prev">${p ? `<button data-act="use-prev" data-i="${i}" data-j="${j}">${St.setLabel(e.exId, p)}</button>` : '–'}</td>
      <td><input type="number" inputmode="decimal" data-set="${i}:${j}:w" value="${s.w === '' ? '' : Math.round(toDisp(s.w) * 100) / 100}" placeholder="${p ? Math.round(toDisp(p.w) * 10) / 10 || '0' : '0'}"></td>
      <td><input type="number" inputmode="numeric" data-set="${i}:${j}:r" value="${esc(s.r)}" placeholder="${p ? p.r : ph}"></td>
      <td><button class="check" data-act="check" data-i="${i}" data-j="${j}">${icon('check')}</button></td></tr>`; }).join('')}
    </tbody></table>
    <button class="add-set" data-act="add-set" data-i="${i}">${t('+ Add set')}</button></div>`;
}
function restDock() {
  if (!restT) return '';
  const left = Math.max(0, (restT.end - Date.now()) / 1000);
  const frac = restT.total ? left / restT.total : 0;
  const C = 2 * Math.PI * 23;
  return `<div class="rest-dock ${left <= 0 ? 'done' : ''}" id="rest-dock"><div class="ring"><svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="23" stroke="var(--surface-3)" stroke-width="5" fill="none"/><circle id="rest-arc" cx="27" cy="27" r="23" stroke="var(--accent)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg><div class="tm" id="rest-tm">${fmtClock(left)}</div></div>
    <div class="lbl"><div style="font-weight:700" id="rest-lbl">${left <= 0 ? 'Rest over — go!' : 'Resting'}</div><div class="small muted">${esc(ex(S.active?.exercises[restT.exIdx]?.exId).name || '')}</div></div>
    <button class="btn sm" data-act="rest-adj" data-d="-15">−15</button><button class="btn sm" data-act="rest-adj" data-d="15">+15</button><button class="icon-btn" data-act="rest-skip">${icon('x')}</button></div>`;
}
function startRest(exIdx, secs) {
  if (!secs) return;
  restT = { end: Date.now() + secs * 1000, total: secs, exIdx, fired: false };
  if (S.active) { S.active.rest = restT; save(); }
  if (S.settings.notify) N.askNotificationPermission();
}
function stopRest() { restT = null; if (S.active) { S.active.rest = null; save(); } N.cancelRestNotification(); }

// ============================================================ Progress
function renderProgress() {
  const weeks = []; const w0 = St.startOfWeek();
  for (let i = 7; i >= 0; i--) { const w = new Date(w0.getTime() - i * 7 * 864e5); const st = St.weekStats(w); weeks.push({ label: fmtDate(w, { day: 'numeric', month: 'numeric' }), count: st.count, vol: st.volume }); }
  const bw = [...S.bodyweight].sort((a, b) => a.date.localeCompare(b.date));
  const bwPts = bw.slice(-30).map(b => ({ label: fmtDate(b.date + 'T00:00', { day: 'numeric', month: 'short' }), y: Math.round(toDisp(b.kg) * 10) / 10 }));
  const change = bw.length > 1 ? toDisp(bw.at(-1).kg) - toDisp(bw[0].kg) : 0;
  const pbs = St.personalBests().filter(p => !isTimed(p.exId));
  const ms = St.muscleSets(St.weekStats().sessions);
  const maxMs = Math.max(1, ...ms.map(m => m[1]));
  const monthCount = S.sessions.filter(s => new Date(s.start).getMonth() === new Date().getMonth() && new Date(s.start).getFullYear() === new Date().getFullYear()).length;
  const totalVol = S.sessions.reduce((a, s) => a + (s.volume || 0), 0);
  const totalMs = S.sessions.reduce((a, s) => a + (s.end - s.start), 0);
  const badges = Object.keys(S.achievements).length;
  return `<div class="screen">${topbar(t('Progress'), { back: false, right: `<button class="icon-btn" data-go="history">${icon('history')}</button>` })}
    <div class="quick" style="margin:0 0 12px"><button data-go="achievements">${icon('medal')}<span>${badges} badges</span></button><button data-go="body">${icon('ruler')}<span>${t('Measurements')}</span></button><button data-go="body">${icon('camera')}<span>Photos</span></button><button data-go="cardio">${icon('run')}<span>${t('Cardio')}</span></button></div>
    <div class="grid2">
      <div class="stat"><div class="tiny faint">Workouts</div><div class="v">${S.sessions.length}</div><div class="small muted">${monthCount} this month</div></div>
      <div class="stat"><div class="tiny faint">Lifted</div><div class="v">${bigNum(toDisp(totalVol))}<small>${unit()}</small></div><div class="small muted">${fmtDur(totalMs)} trained</div></div>
    </div>

    <div class="section"><div class="section-head"><h2 class="display">${t('Body weight')}</h2><button class="link" data-go="bodyweight">Log ›</button></div>
      <div class="card">${bw.length ? `<div class="row between"><div><span class="big-num" style="font-size:40px">${wFmt(bw.at(-1).kg)}</span> <span class="muted">${unit()}</span></div>${bw.length > 1 ? `<span class="tag ${change <= 0 ? 'accent' : ''}" style="font-size:13px;text-transform:none">${change > 0 ? '+' : ''}${change.toFixed(1)} ${unit()} total</span>` : ''}</div>
        ${bwPts.length > 1 ? `<div style="margin-top:10px">${lineChart(bwPts)}</div>` : `<p class="small muted" style="margin-bottom:0">Log your weight a few times a week to see the trend.</p>`}` :
        `<div class="empty" style="padding:16px">${icon('scale')}<div class="small">No entries yet</div><button class="btn sm primary" style="margin-top:12px" data-act="log-weight">Log weight</button></div>`}</div></div>

    <div class="section"><div class="section-head"><h2 class="display">${t('Workouts per week')}</h2></div><div class="card">${barChart(weeks.map(w => ({ label: w.label, y: w.count })))}</div></div>
    <div class="section"><div class="section-head"><h2 class="display">${t('Weekly volume')}</h2><span class="faint small">${unit()}</span></div><div class="card">${barChart(weeks.map(w => ({ label: w.label, y: Math.round(toDisp(w.vol)) })))}</div></div>

    <div class="section"><div class="section-head"><h2 class="display">${t('Sets this week')}</h2><span class="faint small">by muscle</span></div>
      <div class="card">${ms.length ? ms.map(([m, n]) => `<div class="bar-row"><span class="name">${m}</span><span class="track"><i style="width:${(n / maxMs) * 100}%"></i></span><span class="val">${n}</span></div>`).join('') + `<p class="small faint" style="margin:12px 0 0">10–20 hard sets per muscle per week is a solid range for growth.</p>` : `<div class="small muted">Train this week to see your muscle balance.</div>`}</div></div>

    <div class="section"><div class="section-head"><h2 class="display">${t('Personal records')}</h2><span class="faint small">est. 1RM</span></div>
      ${pbs.length ? `<div class="list">${pbs.slice(0, 12).map(p => `<button class="item" data-go="exercise/${p.exId}"><div class="avatar" style="color:var(--warn)">${icon('trophy')}</div><div class="grow"><div class="t">${esc(ex(p.exId).name)}</div><div class="s">${wFmt(p.w)} ${unit()} × ${p.r} · ${fmtDate(p.ts)}</div></div><span class="num" style="font-size:20px">${wFmt(p.e1rm)}</span></button>`).join('')}</div>` : `<div class="card empty small">${icon('trophy')}Log weighted sets to start setting records.</div>`}
    </div>
  </div>`;
}

function renderBodyweight() {
  const bw = [...S.bodyweight].sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="screen no-tabs">${topbar('Body weight', { right: `<button class="btn sm primary" data-act="log-weight">${icon('plus')} Log</button>` })}
    ${bw.length > 1 ? `<div class="card">${lineChart([...bw].reverse().slice(-60).map(b => ({ label: fmtDate(b.date + 'T00:00'), y: Math.round(toDisp(b.kg) * 10) / 10 })))}</div>` : ''}
    <div class="list section">${bw.map((b, i) => { const prev = bw[i + 1]; const d = prev ? toDisp(b.kg) - toDisp(prev.kg) : 0; return `<div class="item"><div class="grow"><div class="t">${fmtDate(b.date + 'T00:00', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>${prev ? `<div class="s" style="color:${d <= 0 ? 'var(--good)' : 'var(--warn)'}">${d > 0 ? '+' : ''}${d.toFixed(1)} ${unit()}</div>` : ''}</div><span class="num" style="font-size:20px">${wFmt(b.kg)}</span><button class="icon-btn" data-act="bw-del" data-date="${b.date}" style="color:var(--text-3)">${icon('trash')}</button></div>`; }).join('') || '<div class="empty small">No entries</div>'}</div>
  </div>`;
}

// ============================================================ History & session
function renderHistory() {
  const ss = [...S.sessions].sort((a, b) => b.start - a.start);
  const groups = {};
  for (const s of ss) { const k = fmtDate(s.start, { month: 'long', year: 'numeric' }); (groups[k] ||= []).push(s); }
  return `<div class="screen no-tabs">${topbar('History')}
    ${ss.length ? Object.entries(groups).map(([m, list]) => `<div class="section" style="margin-top:14px"><div class="section-head"><h2 class="display" style="font-size:18px">${m}</h2><span class="faint small">${list.length} workout${list.length === 1 ? '' : 's'}</span></div><div class="list">${list.map(sessionItem).join('')}</div></div>`).join('') : `<div class="card empty">${icon('history')}<div>No workouts logged yet.</div></div>`}
  </div>`;
}
function renderSession(id) {
  const s = S.sessions.find(x => x.id === id);
  if (!s) return `<div class="screen no-tabs">${topbar('Workout')}<div class="empty">Not found.</div></div>`;
  return `<div class="screen no-tabs">${topbar('Workout', { right: `<button class="icon-btn" data-act="del-session" data-id="${s.id}" style="color:var(--danger)">${icon('trash')}</button>` })}
    <h1 class="display" style="font-size:30px">${esc(s.name)}</h1><div class="muted small">${fmtDate(s.start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${new Date(s.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
    <div class="grid3" style="margin-top:14px"><div class="stat"><div class="tiny faint">Time</div><div class="v">${fmtDur(s.end - s.start)}</div></div><div class="stat"><div class="tiny faint">Volume</div><div class="v">${bigNum(toDisp(s.volume || 0))}<small>${unit()}</small></div></div><div class="stat"><div class="tiny faint">Sets</div><div class="v">${St.sessionSetCount(s)}</div></div></div>
    ${s.prs?.length ? `<div class="card" style="margin-top:12px;border-color:#4a3a1a"><div class="row">${icon('trophy').replace('<svg', '<svg style="color:var(--warn)"')}<b>${s.prs.length} new record${s.prs.length > 1 ? 's' : ''}</b></div><div class="small muted" style="margin-top:6px">${s.prs.map(p => `${esc(ex(p.exId).name)} — ${p.kind === 'e1rm' ? 'est. 1RM' : 'heaviest'} ${wFmt(p.value)} ${unit()}`).join('<br>')}</div></div>` : ''}
    ${s.exercises.map(e => `<div class="card" style="margin-top:12px"><button class="row" style="width:100%" data-go="exercise/${e.exId}"><b class="accent" style="flex:1;text-align:left">${esc(ex(e.exId).name)}</b>${icon('right').replace('<svg', '<svg style="width:16px;height:16px;color:var(--text-3)"')}</button>
      ${e.sets.map((st, j) => `<div class="row small" style="padding:6px 0;border-top:1px solid var(--line);margin-top:${j ? 0 : 8}px"><span class="num" style="width:26px;color:${st.type === 'w' ? 'var(--warn)' : 'var(--text-3)'}">${st.type === 'w' ? 'W' : j + 1}</span><span style="flex:1">${St.setLabel(e.exId, st)}</span>${!isTimed(e.exId) && st.w ? `<span class="faint">1RM ${wFmt(e1rm(st.w, st.r))}</span>` : ''}</div>`).join('')}</div>`).join('')}
    ${s.notes ? `<div class="card" style="margin-top:12px"><div class="tiny faint">Notes</div><div style="margin-top:6px;white-space:pre-wrap">${esc(s.notes)}</div></div>` : ''}
    <button class="btn primary block section" data-act="repeat" data-id="${s.id}">${icon('refresh')} Repeat this workout</button>
  </div>`;
}

// ============================================================ More / tools / settings
function renderMore() {
  const p = S.profile;
  const item = (go, ic, title, sub) => `<button class="item" data-go="${go}"><div class="avatar">${icon(ic)}</div><div class="grow"><div class="t">${title}</div><div class="s">${sub}</div></div>${icon('right', 'chev')}</button>`;
  const badges = Object.keys(S.achievements).length;
  return `<div class="screen">${topbar(t('More'), { back: false })}
    <div class="card row" style="gap:14px"><div class="avatar txt" style="width:54px;height:54px;font-size:24px;background:var(--accent);color:var(--accent-ink)">${esc(p.name[0] || 'A')}</div><div style="flex:1"><div style="font-weight:700;font-size:18px">${esc(p.name)}</div><div class="small muted">${GOALS[p.goal].label} · ${LEVELS[p.level]} · ${p.days} days/wk</div></div><button class="btn sm ghost" data-act="edit-profile">${t('Edit')}</button></div>
    <button class="card hero press row" style="margin-top:12px;width:100%;text-align:left;gap:14px" data-act="coach"><div class="brand-mark" style="width:46px;height:46px;border-radius:14px">${icon('mic')}</div><div style="flex:1"><b style="font-size:17px">${t('Ask Coach')}</b><div class="small muted">Tap and speak any training doubt</div></div>${icon('right', 'chev')}</button>
    <div class="section"><div class="section-head"><h2 class="display">Train</h2></div><div class="list">
      ${item('fight', 'fist', t('Fight Mode'), 'Boxing & Muay Thai rounds with called combos')}
      ${item('cardio', 'run', t('Cardio'), `${S.cardio.length} sessions logged`)}
      ${item('achievements', 'medal', t('Achievements'), `${badges} of ${St.ACHIEVEMENTS.length} unlocked`)}
    </div></div>
    <div class="section"><div class="section-head"><h2 class="display">Body</h2></div><div class="list">
      ${item('bodyweight', 'scale', t('Body weight log'), `${S.bodyweight.length} entr${S.bodyweight.length === 1 ? 'y' : 'ies'}`)}
      ${item('body', 'ruler', t('Measurements') + ' & photos', `${S.measurements.length} check-ins`)}
    </div></div>
    <div class="section"><div class="section-head"><h2 class="display">${t('Tools')}</h2></div><div class="list">
      ${item('tool/1rm', 'target', t('One-rep max'), 'Estimate your 1RM and training percentages')}
      ${item('tool/plates', 'plates', t('Plate calculator'), 'What to load on each side of the bar')}
      ${item('tool/body', 'heart', t('Calories & macros'), 'BMI, BMR, daily calories and protein')}
      ${item('tool/timer', 'timer', t('Interval timer'), 'Rounds of work and rest — great for HIIT')}
    </div></div>
    <div class="section"><div class="section-head"><h2 class="display">${t('Account')}</h2></div><div class="list">
      ${item('history', 'history', t('Workout history'), `${S.sessions.length} workout${S.sessions.length === 1 ? '' : 's'} logged`)}
      ${item('equipment', 'dumbbell', t('My equipment'), `${St.profileItems().length} items`)}
      ${item('settings', 'settings', t('Settings'), 'Theme, language, reminders, AI coach, backup')}
    </div></div>
    <p class="faint small" style="text-align:center;margin-top:26px">NrXFitz ${St.VERSION} · Made by Renaldi</p>
  </div>`;
}

function renderTool(kind) {
  if (kind === '1rm') {
    const w = ui.t1w ?? '', r = ui.t1r ?? '';
    const est = e1rm(fromDisp(w), r);
    return `<div class="screen no-tabs">${topbar('One-rep max')}
      <div class="grid2"><label class="field"><span>Weight lifted</span><div class="input-unit"><input type="number" inputmode="decimal" data-ui="t1w" value="${esc(w)}" placeholder="80"><em>${unit()}</em></div></label>
      <label class="field" style="margin:0"><span>Reps done</span><input type="number" inputmode="numeric" data-ui="t1r" value="${esc(r)}" placeholder="5"></label></div>
      <div class="card hero" style="margin-top:16px;text-align:center"><div class="tiny accent">Estimated 1RM</div><div class="big-num" style="font-size:64px;margin-top:6px" id="t1-out">${est ? wFmt(est) : '–'}</div><div class="muted">${unit()} · Epley formula</div></div>
      <div class="card" style="margin-top:12px"><table class="pct-table" id="t1-table">${pctRows(est)}</table></div>
      <p class="small faint">Most accurate for sets of 2–10 reps taken close to failure.</p></div>`;
  }
  if (kind === 'plates') {
    const target = ui.ptw ?? '';
    return `<div class="screen no-tabs">${topbar('Plate calculator')}
      <div class="grid2"><label class="field"><span>Target weight</span><div class="input-unit"><input type="number" inputmode="decimal" data-ui="ptw" value="${esc(target)}" placeholder="${unit() === 'kg' ? '100' : '225'}"><em>${unit()}</em></div></label>
      <label class="field" style="margin:0"><span>Bar</span><select data-act-change="bar">${(unit() === 'kg' ? [20, 15, 10] : [45, 35, 25]).map(b => `<option value="${b}" ${Math.round(toDisp(S.settings.barKg)) === b ? 'selected' : ''}>${b} ${unit()}</option>`).join('')}</select></label></div>
      <div id="plate-out" style="margin-top:16px">${plateOut(target)}</div></div>`;
  }
  if (kind === 'body') {
    const p = S.profile; const kg = St.latestWeight() || p.weightKg;
    const hM = p.heightCm / 100; const bmi = kg / (hM * hM);
    const bmr = 10 * kg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'female' ? -161 : 5);
    const act = ui.act ?? 1.55; const tdee = bmr * act;
    const adj = { fat_loss: -500, recomp: -300, muscle: 250, strength: 150 }[p.goal] ?? 0;
    const target = Math.round((tdee + adj) / 10) * 10;
    const refKg = bmi > 27 ? 25 * hM * hM + 0.25 * (kg - 25 * hM * hM) : kg; // adjusted for higher body fat
    const protein = Math.round(refKg * 2), fat = Math.round(target * 0.27 / 9), carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
    const bmiTxt = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obese range';
    return `<div class="screen no-tabs">${topbar('Calories & macros')}
      <p class="muted small" style="margin-top:0">Based on ${wFmt(kg)} ${unit()}, ${p.heightCm} cm, ${p.age} yrs, ${p.sex}. Update in profile.</p>
      <label class="field"><span>Activity level (outside training)</span><select data-act-change="activity">${[[1.375, 'Mostly sitting + 3–4 workouts'], [1.55, 'Lightly active + 4–5 workouts'], [1.725, 'On your feet + 5–6 workouts'], [1.9, 'Physical job + daily training']].map(([v, l]) => `<option value="${v}" ${act == v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="card hero" style="margin-top:14px"><div class="tiny accent">Daily target · ${GOALS[p.goal].label}</div><div class="row" style="align-items:baseline;gap:6px;margin-top:6px"><span class="big-num">${target}</span><span class="muted">kcal</span></div>
        <div class="grid3" style="margin-top:14px"><div><div class="tiny faint">Protein</div><div class="num" style="font-size:24px">${protein}g</div></div><div><div class="tiny faint">Carbs</div><div class="num" style="font-size:24px">${carbs}g</div></div><div><div class="tiny faint">Fat</div><div class="num" style="font-size:24px">${fat}g</div></div></div></div>
      <div class="grid3" style="margin-top:12px"><div class="stat"><div class="tiny faint">BMI</div><div class="v">${bmi.toFixed(1)}</div><div class="small muted">${bmiTxt}</div></div><div class="stat"><div class="tiny faint">BMR</div><div class="v">${Math.round(bmr)}</div><div class="small muted">kcal at rest</div></div><div class="stat"><div class="tiny faint">Maintain</div><div class="v">${Math.round(tdee)}</div><div class="small muted">kcal/day</div></div></div>
      <p class="small faint">Estimates from the Mifflin-St Jeor equation. Adjust by ~150 kcal if your weekly average weight isn't moving the way you want after 2–3 weeks. BMI doesn't account for muscle mass.</p></div>`;
  }
  if (kind === 'timer') {
    const t = ui.it || (ui.it = { work: 180, rest: 60, rounds: 5, running: false });
    return `<div class="screen no-tabs">${topbar('Interval timer')}
      <div class="card hero" style="text-align:center;padding:26px 16px"><div class="tiny accent" id="it-phase">${t.running ? (t.phase === 'work' ? 'Work' : 'Rest') + ` · Round ${t.round}/${t.rounds}` : 'Ready'}</div><div class="big-num" style="font-size:84px;margin-top:8px" id="it-clock">${fmtClock(t.running ? Math.max(0, (t.end - Date.now()) / 1000) : t.work)}</div></div>
      <div class="grid3" style="margin-top:14px">
        <label class="field"><span>Work (s)</span><input type="number" inputmode="numeric" data-it="work" value="${t.work}" ${t.running ? 'disabled' : ''}></label>
        <label class="field" style="margin:0"><span>Rest (s)</span><input type="number" inputmode="numeric" data-it="rest" value="${t.rest}" ${t.running ? 'disabled' : ''}></label>
        <label class="field" style="margin:0"><span>Rounds</span><input type="number" inputmode="numeric" data-it="rounds" value="${t.rounds}" ${t.running ? 'disabled' : ''}></label></div>
      <button class="btn ${t.running ? 'danger' : 'primary'} block" style="margin-top:16px;height:56px" data-act="it-toggle">${t.running ? 'Stop' : `${icon('play')} Start`}</button>
      <p class="small faint">3 min work / 1 min rest is classic boxing rounds. Keep your screen on while it runs.</p></div>`;
  }
  return '';
}
function pctRows(est) {
  return [100, 95, 90, 85, 80, 75, 70, 65, 60].map(p => `<tr><td>${p}%</td><td class="faint small">${({ 100: '1', 95: '2', 90: '3–4', 85: '5–6', 80: '7–8', 75: '9–10', 70: '11–12', 65: '13–15', 60: '16–20' })[p]} reps</td><td>${est ? wFmt(est * p / 100) : '–'} ${unit()}</td></tr>`).join('');
}
function plateOut(targetDisp) {
  const bar = toDisp(S.settings.barKg);
  const t = +targetDisp;
  if (!t) return `<div class="card empty small">Enter a target weight.</div>`;
  if (t < bar) return `<div class="card small muted">Target is lighter than the bar (${bar} ${unit()}).</div>`;
  const plates = unit() === 'kg' ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];
  const colors = { 25: '#E5484D', 20: '#3E7BFA', 15: '#F5C518', 10: '#3DDC97', 5: '#F2F4F7', 2.5: '#A3AAB5', 1.25: '#6B7380', 45: '#3E7BFA', 35: '#F5C518', };
  let side = (t - bar) / 2; const used = [];
  for (const p of plates) while (side >= p - 1e-9) { used.push(p); side -= p; }
  const loaded = bar + used.reduce((a, b) => a + b, 0) * 2;
  const viz = used.map(p => `<div class="plate" style="background:${colors[p] || '#888'};width:${p >= 10 ? 18 : 12}px;height:${Math.max(36, Math.min(110, 30 + p * 3.2))}px">${p}</div>`);
  return `<div class="card"><div class="plate-viz">${[...viz].reverse().join('')}<div class="bar"></div>${viz.join('')}</div>
    <div class="tiny faint" style="text-align:center">Each side</div><div style="text-align:center;font-size:18px;font-weight:700;margin-top:6px">${used.length ? Object.entries(used.reduce((m, p) => (m[p] = (m[p] || 0) + 1, m), {})).map(([p, n]) => `${n} × ${p}`).join(' + ') : 'Just the bar'}</div>
    ${Math.abs(loaded - t) > 0.01 ? `<div class="small" style="text-align:center;color:var(--warn);margin-top:8px">Closest possible: ${Math.round(loaded * 100) / 100} ${unit()}</div>` : ''}</div>`;
}

function renderSettings() {
  const s = S.settings; const r = S.reminders;
  const tg = (key, label, sub) => `<div class="item"><div class="grow"><div class="t">${label}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div><button class="toggle ${s[key] ? 'on' : ''}" data-toggle="${key}"></button></div>`;
  const head = txt => `<div class="section-head"><h2 class="display" style="font-size:18px">${txt}</h2></div>`;
  return `<div class="screen no-tabs">${topbar(t('Settings'))}
    <div class="section" style="margin-top:6px">${head(t('Theme colour'))}<div class="swatches">${Object.entries(THEMES).map(([k, [c]]) => `<button class="swatch ${s.theme === k ? 'on' : ''}" style="background:${c}" data-act="theme" data-v="${k}" aria-label="${k}">${s.theme === k ? icon('check') : ''}</button>`).join('')}</div></div>
    <div class="section">${head(t('Language'))}<div class="seg">${LANGS.map(([k, l]) => `<button data-act="lang" data-v="${k}" class="${s.lang === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="section">${head(t('AI Coach'))}<div class="card">
      <div class="small muted" style="margin-bottom:10px">Works offline for exercise form questions. Add a Claude API key (from console.anthropic.com) to answer <b>any</b> question in English or Tamil. The key stays on this phone.</div>
      <label class="field"><span>Claude API key</span><input id="ai-key" type="password" placeholder="sk-ant-…" value="${esc(s.aiKey)}" autocomplete="off"></label>
      <label class="field"><span>Model</span><select data-act-change="ai-model">${MODELS.map(([v, l]) => `<option value="${v}" ${s.aiModel === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="row" style="margin-top:12px"><button class="btn sm primary" data-act="ai-test">Test key</button><span class="spacer"></span><span class="small muted">Speak answers</span><button class="toggle ${s.aiSpeak ? 'on' : ''}" data-toggle="aiSpeak"></button></div></div></div>
    <div class="section">${head(t('Reminders'))}<div class="card">
      <div class="row"><div style="flex:1"><b>Workout reminders</b><div class="small muted">A nudge on your training days</div></div><button class="toggle ${r.on ? 'on' : ''}" data-act="rem-toggle"></button></div>
      ${r.on ? `<div class="week" style="margin-top:14px">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => `<button class="day ${r.days.includes(i) ? 'done' : ''}" data-act="rem-day" data-v="${i}"><div class="dot">${d}</div></button>`).join('')}</div>
      <label class="field" style="margin-top:12px"><span>Time</span><input type="time" id="rem-time" value="${r.time}"></label>` : ''}</div></div>
    <div class="section">${head(t('Units'))}<div class="seg">${['kg', 'lb'].map(u => `<button data-unit="${u}" class="${s.unit === u ? 'on' : ''}">${u === 'kg' ? 'Kilograms' : 'Pounds'}</button>`).join('')}</div></div>
    <div class="section">${head(t('Rest timer'))}<div class="list">
      <div class="item"><div class="grow"><div class="t">Default rest</div><div class="s">Used for exercises you add yourself</div></div><select data-act-change="rest" style="width:130px;padding:8px 30px 8px 12px">${[[0, `Auto (${St.goalOf().rest}s)`], [45, '45 s'], [60, '1:00'], [90, '1:30'], [120, '2:00'], [150, '2:30'], [180, '3:00'], [240, '4:00']].map(([v, l]) => `<option value="${v}" ${+s.rest === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${tg('autoWarmup', 'Auto warm-up sets', 'Add ramp-up sets to big lifts automatically')}${tg('sound', 'Sound', 'Beep when rest is over')}${tg('vibrate', 'Vibration', 'Buzz on set complete and rest over')}${tg('notify', 'Notification', 'Alert when rest ends with the screen off')}</div></div>
    <div class="section">${head(t('Program'))}<div class="list">
      <button class="item" data-act="edit-profile"><div class="avatar">${icon('user')}</div><div class="grow"><div class="t">${t('Edit profile & goal')}</div><div class="s">Name, body stats, goal, days</div></div>${icon('right', 'chev')}</button>
      <button class="item" data-go="equipment"><div class="avatar">${icon('dumbbell')}</div><div class="grow"><div class="t">${t('My equipment')}</div><div class="s">Tick what you own</div></div>${icon('right', 'chev')}</button>
      ${St.inDeload() ? `<button class="item" data-act="deload-end"><div class="avatar">${icon('x')}</div><div class="grow"><div class="t">End deload week early</div></div></button>` : `<button class="item" data-act="deload-start"><div class="avatar">${icon('refresh')}</div><div class="grow"><div class="t">${t('Start deload week')}</div><div class="s">7 days at ~60% to recover</div></div></button>`}
      <button class="item" data-act="regen"><div class="avatar">${icon('refresh')}</div><div class="grow"><div class="t">${t('Rebuild program')}</div><div class="s">Generate a fresh plan from your profile</div></div>${icon('right', 'chev')}</button></div></div>
    <div class="section">${head(t('Data'))}<div class="list">
      <button class="item" data-act="export"><div class="avatar">${icon('upload')}</div><div class="grow"><div class="t">${t('Back up data')}</div><div class="s">Save a file to Drive, WhatsApp or anywhere</div></div>${icon('right', 'chev')}</button>
      <button class="item" data-act="import"><div class="avatar">${icon('download')}</div><div class="grow"><div class="t">${t('Restore backup')}</div><div class="s">Load a backup file</div></div>${icon('right', 'chev')}</button>
      <button class="item" data-act="reset"><div class="avatar" style="color:var(--danger)">${icon('trash')}</div><div class="grow"><div class="t" style="color:var(--danger)">${t('Reset everything')}</div><div class="s">Delete all workouts and start over</div></div></button></div></div>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
    <p class="faint small" style="text-align:center;margin-top:26px">NrXFitz ${St.VERSION}</p>
  </div>`;
}

// ============================================================ sheets
let sheetClose = null;
function openSheet(html, { full = false, onClose = null } = {}) {
  closeSheet(true);
  $ov.innerHTML = `<div class="scrim" data-sheet-close></div><div class="sheet ${full ? 'full' : ''}">${full ? '' : '<div class="grab"></div>'}${html}</div>`;
  sheetClose = onClose; document.body.style.overflow = 'hidden';
}
function closeSheet(silent = false) {
  if (!$ov.innerHTML) return false;
  $ov.innerHTML = ''; document.body.style.overflow = '';
  const cb = sheetClose; sheetClose = null; if (cb && !silent) cb();
  return true;
}
function confirmSheet(title, body, okLabel, onOk, danger = false) {
  openSheet(`<h2 class="display" style="font-size:24px;margin:4px 0 8px">${esc(title)}</h2><p class="muted" style="margin:0 0 18px">${body}</p><div class="row"><button class="btn ghost" style="flex:1" data-sheet-close>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" style="flex:1" id="confirm-ok">${esc(okLabel)}</button></div>`);
  document.getElementById('confirm-ok').onclick = () => { closeSheet(true); onOk(); };
}
let toastT = null;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2200);
}

// Exercise picker
let pick = null; // { selected:Set, onDone, q, f }
function openPicker(onDone, title = 'Add exercises') {
  pick = { selected: new Set(), onDone, q: '', f: 'all', title };
  renderPicker();
}
function renderPicker() {
  const q = pick.q.toLowerCase();
  const list = St.allExercises().filter(e => (pick.f === 'all' || e.muscle === pick.f) && (!q || e.name.toLowerCase().includes(q)));
  const first = !$ov.querySelector('.picker');
  const body = `<div class="picker"><div class="sheet-head"><button class="icon-btn" data-sheet-close>${icon('x')}</button><div class="title">${esc(pick.title)}</div><button class="btn sm" data-act="new-exercise">+ Custom</button></div>
    <input id="pick-search" placeholder="Search" value="${esc(pick.q)}" style="margin-bottom:10px">
    <div class="chips">${['all', ...MUSCLES].map(m => `<button class="chip ${pick.f === m ? 'on' : ''}" data-pickf="${m}">${cap(m)}</button>`).join('')}</div>
    <div class="list" id="pick-list" style="margin-top:10px">${exListItems(list, 'pick', pick.selected)}</div>
    <div style="position:sticky;bottom:-20px;background:var(--surface);padding:12px 0 8px;margin-top:8px"><button class="btn primary block" data-act="pick-done" ${pick.selected.size ? '' : 'disabled'}>Add ${pick.selected.size || ''} exercise${pick.selected.size === 1 ? '' : 's'}</button></div></div>`;
  if (first) openSheet(body, { full: true, onClose: () => { pick = null; } });
  else { $ov.querySelector('.sheet').innerHTML = body; }
}
function refreshPickList() {
  const q = pick.q.toLowerCase();
  const list = St.allExercises().filter(e => (pick.f === 'all' || e.muscle === pick.f) && (!q || e.name.toLowerCase().includes(q)));
  document.getElementById('pick-list').innerHTML = exListItems(list, 'pick', pick.selected);
  const b = $ov.querySelector('[data-act="pick-done"]');
  b.disabled = !pick.selected.size; b.textContent = `Add ${pick.selected.size || ''} exercise${pick.selected.size === 1 ? '' : 's'}`;
}

function openNewExercise(after) {
  const keepPick = pick;
  const html = `<div class="sheet-head"><div class="title">New exercise</div></div>
    <label class="field"><span>Name</span><input id="nx-name" placeholder="e.g. Landmine Press" maxlength="40"></label>
    <label class="field"><span>Main muscle</span><select id="nx-muscle">${MUSCLES.map(m => `<option value="${m}">${cap(m)}</option>`).join('')}</select></label>
    <label class="field"><span>Equipment</span><select id="nx-eq">${EQUIPMENT.map(m => `<option value="${m}">${cap(m)}</option>`).join('')}</select></label>
    <div class="row" style="margin-top:18px"><button class="btn ghost" style="flex:1" id="nx-cancel">Cancel</button><button class="btn primary" style="flex:1" id="nx-save">Create</button></div>`;
  openSheet(html);
  const back = () => { if (keepPick) { pick = keepPick; $ov.innerHTML = ''; renderPicker(); } else closeSheet(true); };
  document.getElementById('nx-cancel').onclick = back;
  document.getElementById('nx-save').onclick = () => {
    const name = document.getElementById('nx-name').value.trim(); if (!name) { toast('Give it a name'); return; }
    const e = { id: 'c_' + St.uid(), name, muscle: document.getElementById('nx-muscle').value, secondary: '', equipment: document.getElementById('nx-eq').value, pattern: 'custom', cues: [], custom: true };
    S.customExercises.push(e); St.clearExCache(); save();
    if (keepPick) keepPick.selected.add(e.id);
    back(); if (!keepPick) render(); after?.(e); toast('Exercise created');
  };
  setTimeout(() => document.getElementById('nx-name')?.focus(), 250);
}

function openLogWeight() {
  const lw = St.latestWeight();
  openSheet(`<h2 class="display" style="font-size:24px;margin:4px 0 14px">Log body weight</h2>
    <div class="grid2"><label class="field"><span>Weight</span><div class="input-unit"><input id="bw-val" type="number" inputmode="decimal" value="${lw ? Math.round(toDisp(lw) * 10) / 10 : ''}" style="font-size:20px;font-weight:700"><em>${unit()}</em></div></label>
    <label class="field" style="margin:0"><span>Date</span><input id="bw-date" type="date" value="${St.todayKey()}" max="${St.todayKey()}"></label></div>
    <button class="btn primary block" style="margin-top:18px" id="bw-save">Save</button>`);
  const inp = document.getElementById('bw-val'); setTimeout(() => { inp.focus(); inp.select(); }, 250);
  document.getElementById('bw-save').onclick = () => {
    const v = +inp.value; const d = document.getElementById('bw-date').value || St.todayKey();
    if (!v || v < 20 || v > 700) { toast('Enter a valid weight'); return; }
    S.bodyweight = S.bodyweight.filter(b => b.date !== d); S.bodyweight.push({ date: d, kg: fromDisp(v) });
    save(); closeSheet(true); render(); toast('Weight logged');
  };
}

function openEditProfile() {
  const p = { ...S.profile };
  const u = unit();
  openSheet(`<div class="sheet-head"><div class="title">Profile</div><button class="icon-btn" data-sheet-close>${icon('x')}</button></div>
    <label class="field"><span>Name</span><input id="pf-name" value="${esc(p.name)}" maxlength="24"></label>
    <div class="grid3" style="margin-top:14px"><label class="field"><span>Age</span><input id="pf-age" type="number" inputmode="numeric" value="${esc(p.age)}"></label><label class="field" style="margin:0"><span>Height cm</span><input id="pf-h" type="number" inputmode="decimal" value="${esc(p.heightCm)}"></label><label class="field" style="margin:0"><span>Sex</span><select id="pf-sex">${['male', 'female'].map(x => `<option ${p.sex === x ? 'selected' : ''} value="${x}">${cap(x)}</option>`).join('')}</select></label></div>
    <label class="field" style="margin-top:14px"><span>Goal</span><select id="pf-goal">${Object.entries(GOALS).map(([k, g]) => `<option value="${k}" ${p.goal === k ? 'selected' : ''}>${g.label}</option>`).join('')}</select></label>
    <label class="field"><span>Experience</span><select id="pf-level">${Object.entries(LEVELS).map(([k, l]) => `<option value="${k}" ${p.level === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="field"><span>Equipment</span><select id="pf-eq">${Object.entries(EQUIPMENT_PROFILES).map(([k, e]) => `<option value="${k}" ${p.equipment === k ? 'selected' : ''}>${e.label}</option>`).join('')}</select></label>
    <label class="field"><span>Days per week</span><select id="pf-days">${[2, 3, 4, 5, 6].map(d => `<option ${+p.days === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
    <p class="small faint">Changing goal, equipment or days rebuilds your program days. Custom routines and history are kept. Body weight is updated from the weight log (${u}).</p>
    <button class="btn primary block" id="pf-save" style="margin-top:8px">Save</button>`);
  document.getElementById('pf-save').onclick = () => {
    const v = id => document.getElementById(id).value;
    const next = { ...p, name: v('pf-name').trim() || p.name, age: +v('pf-age') || p.age, heightCm: +v('pf-h') || p.heightCm, sex: v('pf-sex'), goal: v('pf-goal'), level: v('pf-level'), equipment: v('pf-eq'), days: +v('pf-days') };
    const rebuild = ['goal', 'level', 'equipment', 'days'].some(k => next[k] != p[k]);
    S.profile = next; if (rebuild) { S.program = St.generateProgram(next); S.programIndex = 0; }
    save(); closeSheet(true); render(); toast(rebuild ? 'Profile saved — program rebuilt' : 'Profile saved');
  };
}

function openExMenu(i) {
  const a = S.active; const e = a.exercises[i];
  openSheet(`<h2 class="display" style="font-size:22px;margin:4px 0 12px">${esc(ex(e.exId).name)}</h2>
    <div class="list">
      <button class="item" data-act="m-rest" data-i="${i}"><div class="avatar">${icon('timer')}</div><div class="grow"><div class="t">Rest time</div><div class="s">${fmtClock(e.rest)} between sets</div></div></button>
      ${isTimed(e.exId) ? '' : `<button class="item" data-act="m-warmup" data-i="${i}"><div class="avatar">${icon('flame')}</div><div class="grow"><div class="t">Add warm-up sets</div><div class="s">Auto ramp-up from your working weight</div></div></button>`}
      ${i < a.exercises.length - 1 ? `<button class="item" data-act="m-superset" data-i="${i}"><div class="avatar">${icon('link')}</div><div class="grow"><div class="t">${e.ss ? 'Remove superset' : 'Superset with next exercise'}</div><div class="s">${e.ss ? 'Rest normally between sets' : `Pair with ${esc(ex(a.exercises[i + 1].exId).name)}, no rest between them`}</div></div></button>` : ''}
      <button class="item" data-act="m-swap" data-i="${i}"><div class="avatar">${icon('swap')}</div><div class="grow"><div class="t">Replace exercise</div></div></button>
      <button class="item" data-act="coach" data-ex="${e.exId}"><div class="avatar">${icon('mic')}</div><div class="grow"><div class="t">Ask the coach</div><div class="s">Form, weight, pain — any doubt</div></div></button>
      ${i > 0 ? `<button class="item" data-act="m-move" data-i="${i}" data-d="-1"><div class="avatar">${icon('up')}</div><div class="grow"><div class="t">Move up</div></div></button>` : ''}
      ${i < a.exercises.length - 1 ? `<button class="item" data-act="m-move" data-i="${i}" data-d="1"><div class="avatar">${icon('down')}</div><div class="grow"><div class="t">Move down</div></div></button>` : ''}
      ${e.sets.length > 1 ? `<button class="item" data-act="m-delset" data-i="${i}"><div class="avatar">${icon('x')}</div><div class="grow"><div class="t">Remove last set</div></div></button>` : ''}
      <button class="item" data-act="m-remove" data-i="${i}"><div class="avatar" style="color:var(--danger)">${icon('trash')}</div><div class="grow"><div class="t" style="color:var(--danger)">Remove exercise</div></div></button>
    </div>`);
}

function showSummary(sess) {
  const prs = sess.prs || [];
  openSheet(`<div style="text-align:center;padding:10px 0 6px"><div class="brand-mark" style="width:64px;height:64px;border-radius:20px;margin:0 auto">${icon('trophy').replace('<svg', '<svg style="width:34px;height:34px"')}</div>
    <h2 class="display" style="font-size:34px;margin-top:16px">Workout complete</h2><p class="muted" style="margin:6px 0 0">${esc(sess.name)} · ${fmtDate(sess.start, { weekday: 'long' })}</p></div>
    <div class="grid3" style="margin-top:18px"><div class="stat"><div class="tiny faint">Time</div><div class="v">${fmtDur(sess.end - sess.start)}</div></div><div class="stat"><div class="tiny faint">Volume</div><div class="v">${bigNum(toDisp(sess.volume))}<small>${unit()}</small></div></div><div class="stat"><div class="tiny faint">Sets</div><div class="v">${St.sessionSetCount(sess)}</div></div></div>
    ${prs.length ? `<div class="card" style="margin-top:12px;border-color:#4a3a1a"><div class="row" style="color:var(--warn)">${icon('trophy')}<b>${prs.length} new personal record${prs.length > 1 ? 's' : ''}!</b></div>${prs.map(p => `<div class="row small" style="padding:8px 0 0"><span style="flex:1">${esc(ex(p.exId).name)}</span><b>${wFmt(p.value)} ${unit()}</b></div>`).join('')}</div>` : ''}
    <p class="small muted" style="text-align:center">Workout #${S.sessions.length} logged. ${St.weekStats().count} of ${S.profile.days} this week.</p>
    <button class="btn primary block" data-sheet-close style="margin-top:8px">Done</button>`);
}

// ============================================================ Coach (voice AI)
let coachEx = null, coachBusy = false;
const COACH_CHIPS = ['How do I squat deeper?', 'Why do my knees hurt on lunges?', 'How much protein do I need?', 'How do I lose belly fat?', 'Best Muay Thai conditioning?', 'How heavy should I lift?'];
function openCoach(exId = null) {
  coachEx = exId;
  const e = exId ? ex(exId) : null;
  const ai = !!S.settings.aiKey;
  openSheet(`<div class="coach">
    <div class="sheet-head"><button class="icon-btn" data-sheet-close>${icon('x')}</button><div class="title">NrX Coach</div><button class="icon-btn" data-act="coach-speak">${icon(S.settings.aiSpeak ? 'speaker' : 'mute')}</button><button class="icon-btn" data-act="coach-clear">${icon('refresh')}</button></div>
    <div class="coach-status ${ai ? 'on' : ''}">${ai ? `${icon('sparkle')} AI coach on` : `${icon('book')} Offline mode · <button class="link" data-go="settings" style="color:inherit;text-decoration:underline">add AI key</button> for any question`}${e ? ` · about <b>${esc(e.name)}</b>` : ''}</div>
    <div class="coach-log" id="coach-log"></div>
    <div class="chips coach-chips">${(e ? [`How do I do ${e.name}?`, `What muscles does ${e.name} work?`, 'How heavy should I go?', 'Sets and reps for my goal?'] : COACH_CHIPS).map(c => `<button class="chip" data-act="coach-chip">${esc(c)}</button>`).join('')}</div>
    <div class="coach-bar"><input id="coach-input" placeholder="${t('Type your question')}" autocomplete="off"><button class="icon-btn send" data-act="coach-send">${icon('send')}</button></div>
    <button class="mic-btn" data-act="coach-mic" id="mic-btn"><span class="mic-ring"></span>${icon('mic')}<span id="mic-lbl">${t('Tap to speak')}</span></button>
  </div>`, { full: true, onClose: () => { N.stopSpeaking(); } });
  renderCoachLog();
}
function renderCoachLog(pending = false) {
  const log = document.getElementById('coach-log'); if (!log) return;
  const h = chatHistory();
  log.innerHTML = (h.length ? '' : `<div class="bubble bot">Hi ${esc(S.profile.name)}! I'm your coach. Tap the mic and ask me anything about your training — form, pain, sets, diet.</div>`) +
    h.map(m => `<div class="bubble ${m.role === 'user' ? 'me' : 'bot'}">${esc(m.content)}</div>`).join('') +
    (pending ? `<div class="bubble bot typing"><i></i><i></i><i></i></div>` : '');
  log.scrollTop = log.scrollHeight;
  document.querySelector('.coach-chips')?.classList.toggle('hide', h.length > 0);
}
async function coachAsk(q) {
  q = (q || '').trim(); if (!q || coachBusy) return;
  coachBusy = true; N.stopSpeaking();
  chatHistory().push({ role: 'user', content: q }); renderCoachLog(true); chatHistory().pop();
  const ans = await askCoach(q, coachEx);
  coachBusy = false; S.coachAsked = (S.coachAsked || 0) + 1; save();
  renderCoachLog();
  if (S.settings.aiSpeak) N.speak(ans, /[஀-௿]/.test(ans) ? 'ta-IN' : 'en-IN');
  notifyAchievements();
}
async function coachListen() {
  const btn = document.getElementById('mic-btn'), lbl = document.getElementById('mic-lbl');
  N.stopSpeaking(); btn?.classList.add('live'); if (lbl) lbl.textContent = t('Listening…');
  try {
    const text = await N.listen(S.settings.lang === 'ta' ? 'ta-IN' : 'en-IN');
    btn?.classList.remove('live'); if (lbl) lbl.textContent = t('Tap to speak');
    if (text) coachAsk(text); else toast('Didn’t catch that — try again');
  } catch (err) { btn?.classList.remove('live'); if (lbl) lbl.textContent = t('Tap to speak'); toast(err.message || 'Voice input failed'); }
}

// ============================================================ Form demo sheet
function openForm(exId) {
  const e = ex(exId);
  openSheet(`<h2 class="display" style="font-size:24px;margin:2px 0 6px">${esc(e.name)}</h2><div class="anim-card big">${animSvg(animFor(exId, e.muscle))}</div>
    ${e.cues?.length ? `<ol class="cue-list" style="margin-top:8px">${e.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol>` : ''}
    <div class="row" style="margin-top:12px"><button class="btn ghost" style="flex:1" data-act="coach" data-ex="${exId}">${icon('mic')} Ask coach</button><button class="btn primary" style="flex:1" data-sheet-close>Got it</button></div>`);
  startAnims();
}

// ============================================================ Habits & logs sheets
function openProteinSheet() {
  const foods = [['Egg', 6], ['Glass of milk', 8], ['Bowl of dal', 9], ['Curd (200 g)', 7], ['Paneer (100 g)', 18], ['Chicken (100 g)', 27], ['Soya chunks (50 g)', 26], ['Whey scoop', 24], ['Fish (100 g)', 22], ['Peanuts (30 g)', 8]];
  openSheet(`<h2 class="display" style="font-size:24px;margin:4px 0 4px">Add protein</h2><p class="small muted" style="margin:0 0 12px">Today: ${St.habit().protein} / ${St.proteinTarget()} g</p>
    <div class="grid2">${foods.map(([n, g]) => `<button class="choice" style="margin:0;padding:12px" data-act="protein-quick" data-g="${g}"><span style="flex:1"><b>${n}</b><span class="small muted" style="display:block">${g} g</span></span>${icon('plus', 'accent')}</button>`).join('')}</div>
    <div class="row" style="margin-top:12px"><input id="pq" type="number" inputmode="numeric" placeholder="Custom grams"><button class="btn primary" id="pq-add">Add</button></div>`);
  document.getElementById('pq-add').onclick = () => { const g = +document.getElementById('pq').value; if (g > 0) act('protein-quick', { g }); };
}
function openCardioSheet() {
  openSheet(`<h2 class="display" style="font-size:24px;margin:4px 0 12px">${t('Log cardio')}</h2>
    <div class="chips" style="margin-bottom:12px">${Object.entries(St.CARDIO_TYPES).map(([k, c], i) => `<button class="chip ${i === 1 ? 'on' : ''}" data-ctype="${k}">${c.label}</button>`).join('')}</div>
    <div class="grid3" id="c-fields"><label class="field"><span>Minutes</span><input id="c-min" type="number" inputmode="numeric" placeholder="30"></label><label class="field" style="margin:0"><span>Distance km</span><input id="c-km" type="number" inputmode="decimal" placeholder="2.5"></label><label class="field" style="margin:0"><span>Steps</span><input id="c-steps" type="number" inputmode="numeric" placeholder="optional"></label></div>
    <div class="small muted" id="c-kcal" style="margin-top:10px">≈ 0 kcal</div>
    <button class="btn primary block" style="margin-top:14px" id="c-save">Save</button>`);
  let type = 'incline';
  const upd = () => { const kc = St.cardioKcal(type, +document.getElementById('c-min').value, +document.getElementById('c-steps').value); document.getElementById('c-kcal').textContent = `≈ ${kc} kcal burned`; };
  $ov.querySelectorAll('[data-ctype]').forEach(b => b.onclick = () => { type = b.dataset.ctype; $ov.querySelectorAll('[data-ctype]').forEach(x => x.classList.toggle('on', x === b)); upd(); });
  $ov.querySelectorAll('#c-fields input').forEach(i => i.oninput = upd);
  document.getElementById('c-save').onclick = () => {
    const mins = +document.getElementById('c-min').value || 0, km = +document.getElementById('c-km').value || 0, steps = +document.getElementById('c-steps').value || 0;
    if (!mins && !steps) { toast('Enter minutes or steps'); return; }
    S.cardio.push({ id: St.uid(), date: St.todayKey(), type, mins, km, steps, kcal: St.cardioKcal(type, mins, steps) });
    save(); closeSheet(true); render(); toast('Cardio logged'); notifyAchievements();
  };
}
const MEAS = [['waist', 'Waist'], ['chest', 'Chest'], ['arm', 'Arm'], ['thigh', 'Thigh'], ['hips', 'Hips'], ['neck', 'Neck']];
function openMeasureSheet() {
  const last = [...S.measurements].sort((a, b) => b.date.localeCompare(a.date))[0] || {};
  openSheet(`<h2 class="display" style="font-size:24px;margin:4px 0 4px">${t('Log measurements')}</h2><p class="small muted" style="margin:0 0 12px">In centimetres. Measure in the morning, relaxed.</p>
    <div class="grid3">${MEAS.map(([k, l], i) => `<label class="field" style="margin:0"><span>${l}</span><input data-meas="${k}" type="number" inputmode="decimal" value="${last[k] ?? ''}"></label>`).join('')}</div>
    <button class="btn primary block" style="margin-top:16px" id="m-save">Save</button>`);
  document.getElementById('m-save').onclick = () => {
    const m = { date: St.todayKey() }; let any = false;
    $ov.querySelectorAll('[data-meas]').forEach(i => { if (i.value) { m[i.dataset.meas] = +i.value; any = true; } });
    if (!any) { toast('Enter at least one measurement'); return; }
    S.measurements = S.measurements.filter(x => x.date !== m.date); S.measurements.push(m); save(); closeSheet(true); render(); toast('Measurements saved'); notifyAchievements();
  };
}
async function openPhoto(id) {
  const p = (await Ph.listPhotos()).find(x => x.id === id); if (!p) return;
  openSheet(`<div class="sheet-head"><button class="icon-btn" data-sheet-close>${icon('x')}</button><div class="title">${fmtDate(p.ts, { day: 'numeric', month: 'short', year: 'numeric' })}</div><button class="icon-btn" data-act="photo-del" data-id="${p.id}" style="color:var(--danger)">${icon('trash')}</button></div>
    <img src="${p.data}" style="width:100%;border-radius:14px;display:block">${p.weight ? `<p class="muted small" style="text-align:center">${wFmt(p.weight)} ${unit()} that day</p>` : ''}`, { full: true });
}

// ============================================================ Celebrations & achievements
function celebrate() {
  const c = document.createElement('div'); c.className = 'confetti';
  const colors = ['var(--accent)', '#5AB4FF', '#FFB547', '#FF5A5F', '#3DDC97'];
  c.innerHTML = Array.from({ length: 36 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${colors[i % 5]};animation-delay:${Math.random() * 0.3}s;animation-duration:${1.2 + Math.random()}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join('');
  document.body.appendChild(c); setTimeout(() => c.remove(), 2600);
}
function notifyAchievements() {
  const fresh = St.checkAchievements();
  fresh.forEach((a, k) => setTimeout(() => { badgeToast(a); N.haptic('heavy'); celebrate(); }, 600 + k * 2600));
}
function badgeToast(a) {
  document.querySelector('.badge-toast')?.remove();
  const el = document.createElement('div'); el.className = 'badge-toast';
  el.innerHTML = `<span class="em">${a[3]}</span><div><div class="tiny accent">Achievement unlocked</div><b>${esc(a[1])}</b><div class="small muted">${esc(a[2])}</div></div>`;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2500);
}
function renderAchievements() {
  const got = St.ACHIEVEMENTS.filter(a => S.achievements[a[0]]).length;
  return `<div class="screen no-tabs">${topbar(t('Achievements'))}
    <div class="card hero" style="text-align:center"><div class="big-num">${got}<span class="muted" style="font-size:24px"> / ${St.ACHIEVEMENTS.length}</span></div><div class="muted small">badges unlocked</div><div class="habit-bar" style="margin-top:12px"><i style="width:${got / St.ACHIEVEMENTS.length * 100}%"></i></div></div>
    <div class="badges">${St.ACHIEVEMENTS.map(a => { const ts = S.achievements[a[0]]; return `<div class="badge ${ts ? 'got' : ''}"><div class="em">${a[3]}</div><b>${esc(a[1])}</b><div class="small muted">${esc(a[2])}</div>${ts ? `<div class="tiny accent" style="margin-top:4px">${fmtDate(ts)}</div>` : ''}</div>`; }).join('')}</div>
  </div>`;
}

// ============================================================ Body: measurements & photos
let photoCache = null;
function renderBody() {
  const ms = [...S.measurements].sort((a, b) => a.date.localeCompare(b.date));
  const latest = ms.at(-1), first = ms[0];
  if (!photoCache) Ph.listPhotos().then(p => { photoCache = p; if (route()[0] === 'body') render(); }).catch(() => { photoCache = []; });
  const photos = photoCache || [];
  return `<div class="screen no-tabs">${topbar(t('Measurements'), { right: `<button class="btn sm primary" data-act="log-measure">${icon('plus')} Log</button>` })}
    ${latest ? `<div class="grid3">${MEAS.filter(([k]) => latest[k]).map(([k, l]) => { const d = first && first !== latest && first[k] ? latest[k] - first[k] : 0; return `<div class="stat"><div class="tiny faint">${l}</div><div class="v">${latest[k]}<small>cm</small></div>${d ? `<div class="small" style="color:${(k === 'waist' || k === 'hips' || k === 'neck') === d < 0 ? 'var(--good)' : 'var(--warn)'}">${d > 0 ? '+' : ''}${d.toFixed(1)} cm</div>` : '<div class="small faint">start</div>'}</div>`; }).join('')}</div>
      ${ms.filter(m => m.waist).length > 1 ? `<div class="card" style="margin-top:12px"><div class="tiny faint" style="margin-bottom:6px">Waist (cm)</div>${lineChart(ms.filter(m => m.waist).map(m => ({ label: fmtDate(m.date + 'T00:00'), y: m.waist })))}</div>` : ''}
      <div class="list" style="margin-top:12px">${[...ms].reverse().map(m => `<div class="item"><div class="grow"><div class="t">${fmtDate(m.date + 'T00:00', { day: 'numeric', month: 'short', year: 'numeric' })}</div><div class="s">${MEAS.filter(([k]) => m[k]).map(([k, l]) => `${l} ${m[k]}`).join(' · ')}</div></div><button class="icon-btn" data-act="measure-del" data-date="${m.date}" style="color:var(--text-3)">${icon('trash')}</button></div>`).join('')}</div>` :
      `<div class="card empty">${icon('ruler')}<div style="font-weight:600;color:var(--text)">No measurements yet</div><div class="small">The scale lies — your waist doesn't. Track it every 2 weeks.</div><button class="btn sm primary" style="margin-top:12px" data-act="log-measure">${t('Log measurements')}</button></div>`}
    <div class="section"><div class="section-head"><h2 class="display">${t('Progress photos')}</h2><button class="link" data-act="photo-add">+ ${t('Add photo')}</button></div>
      ${photos.length ? `<div class="photos">${photos.map(p => `<button data-act="photo-view" data-id="${p.id}"><img src="${p.data}" alt=""><span>${fmtDate(p.ts)}</span></button>`).join('')}</div>` : `<div class="card empty">${icon('camera')}<div class="small">Same pose, same light, every 2–4 weeks. Photos stay private on this phone.</div><button class="btn sm primary" style="margin-top:12px" data-act="photo-add">${t('Add photo')}</button></div>`}
    </div>
    <input type="file" id="photo-file" accept="image/*" hidden>
  </div>`;
}

// ============================================================ Cardio log
function renderCardio() {
  const list = [...S.cardio].sort((a, b) => b.date.localeCompare(a.date));
  const wk = St.startOfWeek(); const week = S.cardio.filter(c => new Date(c.date + 'T00:00') >= wk);
  return `<div class="screen no-tabs">${topbar(t('Cardio'), { right: `<button class="btn sm primary" data-act="log-cardio">${icon('plus')} Log</button>` })}
    <div class="grid3"><div class="stat"><div class="tiny faint">This week</div><div class="v">${week.reduce((a, c) => a + c.mins, 0)}<small>min</small></div></div><div class="stat"><div class="tiny faint">Distance</div><div class="v">${week.reduce((a, c) => a + (c.km || 0), 0).toFixed(1)}<small>km</small></div></div><div class="stat"><div class="tiny faint">Burned</div><div class="v">${bigNum(week.reduce((a, c) => a + (c.kcal || 0), 0))}<small>kcal</small></div></div></div>
    <div class="list section">${list.map(c => `<div class="item"><div class="avatar">${icon(c.type === 'boxing' ? 'fist' : 'run')}</div><div class="grow"><div class="t">${St.CARDIO_TYPES[c.type]?.label || c.type}</div><div class="s">${fmtDate(c.date + 'T00:00', { weekday: 'short', day: 'numeric', month: 'short' })} · ${[c.mins ? c.mins + ' min' : '', c.km ? c.km + ' km' : '', c.steps ? c.steps.toLocaleString() + ' steps' : '', c.kcal + ' kcal'].filter(Boolean).join(' · ')}</div></div><button class="icon-btn" data-act="cardio-del" data-id="${c.id}" style="color:var(--text-3)">${icon('trash')}</button></div>`).join('') || `<div class="empty small">No cardio logged yet.</div>`}</div>
  </div>`;
}

// ============================================================ Fight mode
function renderFight() {
  const f = fight; const running = f.running;
  const left = running ? Math.max(0, (f.end - Date.now()) / 1000) : f.work;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-act="fight-set" data-k="${k}" data-v="${v}" class="${f[k] == v ? 'on' : ''}" ${running ? 'disabled' : ''}>${l}</button>`).join('')}</div>`;
  return `<div class="screen no-tabs">${topbar(t('Fight Mode'), { right: `<button class="icon-btn" data-act="fight-voice">${icon(f.voice ? 'speaker' : 'mute')}</button>` })}
    <div class="fight-ring ${running ? 'live ' + f.phase : ''}">
      <div class="tiny" id="fight-phase">${running ? (f.phase === 'prep' ? t('Get ready') : f.phase === 'work' ? `${t('Round')} ${f.round} / ${f.rounds}` : `${t('Rest')} · next ${t('Round')} ${f.round + 1}`) : f.done ? 'Session complete 🥊' : `${f.rounds} × ${fmtClock(f.work)} rounds`}</div>
      <div class="fight-clock" id="fight-clock">${fmtClock(left)}</div>
      <div class="fight-call" id="fight-call">${running && f.phase === 'work' ? esc(f.lastCall || '') : running ? '' : f.style === 'muaythai' ? 'Muay Thai' : 'Boxing'}</div>
    </div>
    ${running ? '' : `<div class="stack" style="margin-top:16px">
      ${seg('style', [['muaythai', 'Muay Thai'], ['boxing', 'Boxing']])}
      ${seg('level', [['basic', 'Basic combos'], ['pro', 'Pro combos']])}
      <div class="grid3"><label class="field"><span>${t('Rounds')}</span><select data-fight="rounds">${[2, 3, 4, 5, 6, 8, 10, 12].map(v => `<option ${f.rounds === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field" style="margin:0"><span>${t('Round')}</span><select data-fight="work">${[[60, '1:00'], [90, '1:30'], [120, '2:00'], [180, '3:00'], [300, '5:00']].map(([v, l]) => `<option value="${v}" ${f.work === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field" style="margin:0"><span>${t('Rest')}</span><select data-fight="rest">${[[30, '0:30'], [45, '0:45'], [60, '1:00'], [90, '1:30']].map(([v, l]) => `<option value="${v}" ${f.rest === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <label class="field"><span>Call a combo every</span><select data-fight="every">${[[3, '3 s — fast'], [5, '5 s'], [6, '6 s'], [8, '8 s'], [12, '12 s — slow']].map(([v, l]) => `<option value="${v}" ${f.every === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>`}
    <button class="btn ${running ? 'danger' : 'primary'} block" style="margin-top:18px;height:58px;font-size:17px" data-act="${running ? 'fight-stop' : 'fight-start'}">${running ? t('Stop') : `${icon('play')} ${t('Start')}`}</button>
    ${running ? '' : `<div class="card section"><div class="tiny faint" style="margin-bottom:8px">Combos you'll hear</div><div class="small muted">${COMBOS[f.style][f.level].map(esc).join(' · ')}</div></div>
      <p class="small faint">Bell starts and ends each round, double knock = 10 seconds left. Keep the screen on and phone volume up.</p>`}
  </div>`;
}

// ============================================================ Equipment builder
function renderEquipment() {
  const items = new Set(St.profileItems());
  return `<div class="screen no-tabs">${topbar(t('My equipment'))}
    <p class="muted" style="margin-top:0">Tick exactly what you have. Your program only uses exercises you can do with it.</p>
    <div class="chips" style="margin-bottom:14px">${['gym', 'home_db', 'bodyweight'].map(k => `<button class="chip ${S.profile.equipment === k ? 'on' : ''}" data-act="eq-preset" data-v="${k}">${EQUIPMENT_PROFILES[k].label}</button>`).join('')}</div>
    <div class="list">${EQUIP_ITEMS.map(([k, l]) => `<button class="item" data-act="eq-item" data-v="${k}"><div class="grow"><div class="t">${l}</div></div><span class="check" style="margin:0;${items.has(k) ? 'background:var(--accent);color:var(--accent-ink)' : ''}">${items.has(k) ? icon('check') : ''}</span></button>`).join('')}</div>
    <label class="field section"><span>Heaviest dumbbell you own (optional)</span><div class="input-unit"><input type="number" inputmode="decimal" data-prof="dbMax" value="${S.profile.dbMax ? Math.round(toDisp(S.profile.dbMax)) : ''}" placeholder="e.g. ${unit() === 'kg' ? '13' : '30'}"><em>${unit()}</em></div></label>
    <p class="small faint">When your weights are maxed out, NrXFitz suggests more reps or slower tempo instead.</p>
    <button class="btn primary block" style="margin-top:12px" data-act="eq-apply">${icon('refresh')} Rebuild my program</button>
  </div>`;
}

// ============================================================ theme, reminders, widget
const THEMES = { lime: ['#C8F135', '#12160A'], red: ['#FF4D4F', '#1A0505'], blue: ['#4DA3FF', '#04121F'], gold: ['#F5C542', '#1A1404'], purple: ['#A98BFF', '#100A1F'], orange: ['#FF8A3D', '#1A0C02'] };
function applyTheme() {
  const [a, ink] = THEMES[S.settings.theme] || THEMES.lime;
  const r = document.documentElement.style;
  r.setProperty('--accent', a); r.setProperty('--accent-ink', ink);
  const n = parseInt(a.slice(1), 16); r.setProperty('--accent-soft', `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},.13)`);
}
async function syncReminders(announce = false) {
  const r = S.reminders;
  const ok = await N.scheduleReminders(r.on ? r.days : [], r.time, `Time to train, ${S.profile?.name || 'champ'} 💪`, St.nextProgramDay() ? `Today: ${St.nextProgramDay().name}. Let's go!` : 'Your workout is waiting.');
  if (announce && r.on) toast(ok || !N.isNative ? 'Reminders set' : 'Allow notifications to get reminders');
}
function updateWidget() {
  const next = St.nextProgramDay();
  N.pushWidget({ name: S.profile?.name || '', streak: St.streakWeeks(), week: St.weekStats().count, target: S.profile?.days || 0, next: next ? next.name : 'Rest day', accent: (THEMES[S.settings.theme] || THEMES.lime)[0] });
}

// ============================================================ events
document.addEventListener('click', async e => {
  N.unlockAudio();
  const t = e.target.closest('[data-go],[data-back],[data-act],[data-onb-next],[data-onb-back],[data-draft],[data-ditem],[data-exfilter],[data-pick],[data-pickf],[data-toggle],[data-unit],[data-sheet-close]');
  if (!t) return;
  const d = t.dataset;
  if (d.sheetClose !== undefined) { closeSheet(); return; }
  if (d.go) { if ($ov.innerHTML) closeSheet(true); go(d.go); return; }
  if (d.back !== undefined) { goBack(); return; }
  if (d.draft) { const v = isNaN(+d.val) ? d.val : +d.val; draft[d.draft] = v; if (d.draft === 'unit') { /* keep kg internally */ } render(); return; }
  if (d.onbNext !== undefined) { if (onboardStep === 1) draft.name = document.getElementById('onb-name').value.trim(); if (onboardStep >= ONB_STEPS) finishOnboarding(); else { onboardStep++; render(); window.scrollTo(0, 0); } return; }
  if (d.onbBack !== undefined) { if (onboardStep === 1) draft.name = document.getElementById('onb-name')?.value.trim() || draft.name; onboardStep = Math.max(0, onboardStep - 1); render(); return; }
  if (d.ditem) { const it = new Set(draft.items || []); it.has(d.ditem) ? it.delete(d.ditem) : it.add(d.ditem); draft.items = [...it]; render(); return; }
  if (d.exfilter) { ui.exFilter = d.exfilter; render(); return; }
  if (d.pickf) { pick.f = d.pickf; $ov.querySelectorAll('[data-pickf]').forEach(b => b.classList.toggle('on', b.dataset.pickf === pick.f)); refreshPickList(); return; }
  if (d.pick) { pick.single ? (pick.selected = new Set([d.pick])) : (pick.selected.has(d.pick) ? pick.selected.delete(d.pick) : pick.selected.add(d.pick)); refreshPickList(); N.haptic(); return; }
  if (d.toggle) { S.settings[d.toggle] = !S.settings[d.toggle]; save(); t.classList.toggle('on'); if (d.toggle === 'notify' && S.settings.notify) N.askNotificationPermission(); return; }
  if (d.unit) { S.settings.unit = d.unit; save(); render(); return; }
  if (d.act) await act(d.act, d, t);
});

async function act(a, d, el) {
  const A = S.active; const i = +d.i, j = +d.j;
  switch (a) {
    case 'start-routine': {
      const r = St.findRoutine(d.id); if (!r) return;
      const begin = () => { St.startWorkout(r); restT = null; go('workout'); N.haptic('medium'); };
      if (A) confirmSheet('Workout in progress', `You already have <b>${esc(A.name)}</b> running. Discard it and start ${esc(r.name)}?`, 'Discard & start', begin, true); else begin();
      break;
    }
    case 'start-empty': {
      const begin = () => { St.startWorkout(null); restT = null; go('workout'); setTimeout(() => act('w-add', {}), 150); };
      if (A) go('workout'); else begin();
      break;
    }
    case 'repeat': {
      const s = S.sessions.find(x => x.id === d.id); if (!s) return;
      const r = s.routineId && St.findRoutine(s.routineId);
      const routine = r || { id: null, name: s.name, exercises: s.exercises.map(e => ({ exId: e.exId, sets: workingSets(e.sets).length || e.sets.length, reps: [8, 12], rest: St.restDefault() })) };
      const begin = () => { St.startWorkout(routine); restT = null; go('workout'); };
      if (A) confirmSheet('Workout in progress', 'Discard the current workout and start this one?', 'Discard & start', begin, true); else begin();
      break;
    }
    case 'skip-day': S.programIndex++; save(); render(); toast('Skipped to the next day'); break;
    case 'log-weight': openLogWeight(); break;
    case 'bw-del': S.bodyweight = S.bodyweight.filter(b => b.date !== d.date); save(); render(); break;
    case 'edit-profile': openEditProfile(); break;
    case 'regen': confirmSheet('Rebuild program?', 'Your program days will be regenerated from your profile. Any edits to program days are replaced. History and custom routines are kept.', 'Rebuild', () => { S.program = St.generateProgram(S.profile); S.programIndex = 0; save(); render(); toast('New program ready'); }); break;
    case 'new-routine': { const r = { id: 'r_' + St.uid(), name: 'My Routine', exercises: [], _isProgram: false }; editing = r; go('routine/' + r.id); setTimeout(() => act('r-add', {}), 200); break; }
    case 'new-exercise': openNewExercise(); break;
    case 'del-custom-ex': confirmSheet('Delete exercise?', 'It will be removed from your library. Past workouts keep their logged sets.', 'Delete', () => { S.customExercises = S.customExercises.filter(x => x.id !== d.id); St.clearExCache(); save(); goBack(); }, true); break;
    case 'del-session': confirmSheet('Delete workout?', 'This permanently removes it from your history and stats.', 'Delete', () => { S.sessions = S.sessions.filter(x => x.id !== d.id); save(); goBack(); toast('Workout deleted'); }, true); break;

    // routine editor
    case 'r-move': { const k = i + +d.d; [editing.exercises[i], editing.exercises[k]] = [editing.exercises[k], editing.exercises[i]]; render(); break; }
    case 'r-del': editing.exercises.splice(i, 1); render(); break;
    case 'r-add': openPicker(ids => { const g = St.goalOf(); ids.forEach(id => editing.exercises.push({ exId: id, sets: 3, reps: isTimed(id) ? [10, 20] : [...g.reps].map((v, k) => k === 0 ? Math.max(v, 6) : Math.max(v, 10)), rest: St.restDefault() })); render(); }); break;
    case 'save-routine': {
      const r = editing; if (!r.name.trim()) { toast('Name your routine'); return; }
      const clean = { id: r.id, name: r.name.trim(), focus: r.focus, exercises: r.exercises };
      if (r._isProgram) { const k = S.program.days.findIndex(x => x.id === r.id); S.program.days[k] = clean; }
      else { const k = S.routines.findIndex(x => x.id === r.id); if (k >= 0) S.routines[k] = clean; else S.routines.push(clean); }
      save(); editing = null; toast('Saved'); goBack(); break;
    }
    case 'r-delete-routine': confirmSheet('Delete routine?', 'History from this routine is kept.', 'Delete', () => { S.routines = S.routines.filter(x => x.id !== editing.id); editing = null; save(); go('plan', true); }, true); break;

    // workout
    case 'check': {
      const e = A.exercises[i], s = e.sets[j];
      if (!s.done) {
        const wi = workIdx(e, j); const p = wi >= 0 ? St.lastPerformance(e.exId)?.sets[wi] : null;
        if (s.r === '' || s.r == null) s.r = p ? p.r : (e.target ? e.target.reps[0] : '');
        if (s.w === '' && p) s.w = p.w;
        if (s.r === '' || +s.r <= 0) { toast(isTimed(e.exId) ? 'Enter the time' : 'Enter your reps'); return; }
        s.done = true; N.haptic('medium');
        if (S.settings.vibrate) N.vibrate(25);
        // carry weight forward to the next empty set
        const nx = e.sets[j + 1]; if (nx && !nx.done && (nx.w === '' || nx.w == null)) nx.w = s.w;
        const isLastOverall = A.exercises.every(x => x.sets.every(y => y.done));
        if (isLastOverall) stopRest();
        else if (e.ss && A.exercises[i + 1] && A.exercises[i + 1].sets.some(y => !y.done)) { stopRest(); toast('Superset → ' + ex(A.exercises[i + 1].exId).name); }
        else if (s.type === 'w') startRest(i, 45);
        else { const prev = i > 0 && A.exercises[i - 1]?.ss ? A.exercises[i - 1] : null; startRest(i, Math.max(e.rest, prev?.rest || 0)); }
      } else { s.done = false; }
      save(); render(); break;
    }
    case 'use-prev': { const e = A.exercises[i]; const wi = workIdx(e, j); const p = wi >= 0 ? St.lastPerformance(e.exId)?.sets[wi] : null; if (p) { e.sets[j].w = p.w; e.sets[j].r = p.r; save(); render(); } break; }
    case 'set-type': { const s = A.exercises[i].sets[j]; s.type = s.type === 'w' ? 'n' : 'w'; save(); render(); break; }
    case 'add-set': { const e = A.exercises[i]; const last = e.sets.at(-1); e.sets.push({ w: last ? last.w : '', r: '', done: false, type: 'n' }); save(); render(); break; }
    case 'ex-menu': openExMenu(i); break;
    case 'm-move': { const k = i + +d.d; [A.exercises[i], A.exercises[k]] = [A.exercises[k], A.exercises[i]]; save(); closeSheet(true); render(); break; }
    case 'm-warmup': { const e = A.exercises[i]; if (!(+e.sets.find(x => x.type !== 'w')?.w)) { closeSheet(true); toast('Enter your working weight first'); return; } St.addWarmups(e); save(); closeSheet(true); render(); toast('Warm-up sets added'); break; }
    case 'm-superset': A.exercises[i].ss = !A.exercises[i].ss; if (A.exercises[i].ss && i > 0 && A.exercises[i - 1].ss) A.exercises[i - 1].ss = false; if (A.exercises[i + 1]?.ss) A.exercises[i + 1].ss = false; save(); closeSheet(true); render(); break;
    case 'form': openForm(d.id); break;
    case 'coach': openCoach(d.ex || (route()[0] === 'exercise' ? route()[1] : null)); break;
    case 'coach-mic': coachListen(); break;
    case 'coach-send': { const inp = document.getElementById('coach-input'); coachAsk(inp.value); inp.value = ''; break; }
    case 'coach-chip': coachAsk(el.textContent); break;
    case 'coach-speak': S.settings.aiSpeak = !S.settings.aiSpeak; save(); if (!S.settings.aiSpeak) N.stopSpeaking(); el.innerHTML = icon(S.settings.aiSpeak ? 'speaker' : 'mute'); break;
    case 'coach-clear': resetChat(); renderCoachLog(); break;
    case 'water': { const h = St.habit(); h.water = Math.max(0, h.water + +d.d); save(); render(); if (h.water === St.WATER_GOAL && +d.d > 0) { toast('💧 Water goal hit!'); celebrate(); } break; }
    case 'protein': { const h = St.habit(); h.protein = Math.max(0, h.protein + +d.d); save(); render(); break; }
    case 'protein-add': openProteinSheet(); break;
    case 'protein-quick': { const h = St.habit(); h.protein += +d.g; save(); closeSheet(true); render(); toast(`+${d.g} g protein`); if (h.protein >= St.proteinTarget() && h.protein - +d.g < St.proteinTarget()) celebrate(); break; }
    case 'deload-start': St.startDeload(); render(); toast('Deload week started — go lighter, recover, come back stronger'); break;
    case 'deload-dismiss': S.deloadDismissed = Date.now(); save(); render(); break;
    case 'deload-end': S.deloadUntil = 0; save(); render(); break;
    case 'log-cardio': openCardioSheet(); break;
    case 'cardio-del': S.cardio = S.cardio.filter(c => c.id !== d.id); save(); render(); break;
    case 'log-measure': openMeasureSheet(); break;
    case 'measure-del': S.measurements = S.measurements.filter(m => m.date !== d.date); save(); render(); break;
    case 'photo-add': document.getElementById('photo-file').click(); break;
    case 'photo-view': openPhoto(d.id); break;
    case 'photo-del': confirmSheet('Delete photo?', 'This removes it from your phone.', 'Delete', async () => { await Ph.deletePhoto(d.id); photoCache = null; render(); }, true); break;
    case 'fight-start': N.unlockAudio(); startFight(); render(); break;
    case 'fight-stop': stopFight(); render(); break;
    case 'fight-set': fight[d.k] = isNaN(+d.v) ? d.v : +d.v; render(); break;
    case 'fight-voice': fight.voice = !fight.voice; render(); break;
    case 'theme': S.settings.theme = d.v; save(); applyTheme(); render(); break;
    case 'lang': S.settings.lang = d.v; save(); render(); break;
    case 'rem-toggle': S.reminders.on = !S.reminders.on; save(); await syncReminders(true); render(); break;
    case 'rem-day': { const k = +d.v; const ds = S.reminders.days; S.reminders.days = ds.includes(k) ? ds.filter(x => x !== k) : [...ds, k].sort(); save(); await syncReminders(); render(); break; }
    case 'eq-item': { const it = new Set(S.profile.items || St.profileItems()); it.has(d.v) ? it.delete(d.v) : it.add(d.v); S.profile.items = [...it]; S.profile.equipment = 'custom'; save(); render(); break; }
    case 'eq-preset': S.profile.equipment = d.v; S.profile.items = [...EQUIPMENT_PROFILES[d.v].items]; save(); render(); break;
    case 'eq-apply': S.program = St.generateProgram(S.profile); S.programIndex = 0; save(); toast('Program rebuilt for your equipment'); go('plan'); break;
    case 'ai-test': { const b = el; b.disabled = true; b.textContent = 'Testing…'; const k = document.getElementById('ai-key').value.trim(); S.settings.aiKey = k; save(); const ans = await askCoach('Say hi in one short sentence.'); resetChat(); b.disabled = false; b.textContent = 'Test key'; toast(/rejected|error|could not/i.test(ans) ? 'Key not working — check it' : '✅ AI coach is connected'); break; }
    case 'm-delset': A.exercises[i].sets.pop(); save(); closeSheet(true); render(); break;
    case 'm-remove': A.exercises.splice(i, 1); save(); closeSheet(true); render(); break;
    case 'm-rest': {
      const e = A.exercises[i];
      openSheet(`<h2 class="display" style="font-size:22px;margin:4px 0 12px">Rest time</h2><div class="grid3">${[30, 45, 60, 75, 90, 120, 150, 180, 240].map(v => `<button class="chip ${e.rest === v ? 'on' : ''}" style="height:46px;justify-content:center;font-size:15px" data-act="m-rest-set" data-i="${i}" data-v="${v}">${fmtClock(v)}</button>`).join('')}</div>`);
      break;
    }
    case 'm-rest-set': A.exercises[i].rest = +d.v; save(); closeSheet(true); render(); break;
    case 'm-swap': closeSheet(true); openPicker(ids => { const e = A.exercises[i]; const ne = St.buildExercise(ids[0], e.target); A.exercises[i] = ne; save(); render(); }, 'Replace with'); pick.single = true; break;
    case 'w-add': openPicker(ids => { ids.forEach(id => S.active.exercises.push(St.buildExercise(id, null))); save(); render(); }); break;
    case 'add-to-active': S.active.exercises.push(St.buildExercise(d.id, null)); save(); toast('Added to workout'); go('workout'); break;
    case 'pick-done': { const ids = [...pick.selected]; const cb = pick.onDone; sheetClose = null; closeSheet(true); pick = null; cb(ids); break; }
    case 'rest-adj': if (restT) { restT.end += +d.d * 1000; restT.total = Math.max(restT.total + +d.d, 1); restT.fired = false; updateTicker(); } break;
    case 'rest-skip': stopRest(); document.getElementById('rest-dock')?.remove(); break;
    case 'finish': {
      const pending = A.exercises.reduce((n, e) => n + e.sets.filter(s => !s.done).length, 0);
      const doneN = A.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
      if (!doneN) { confirmSheet('Nothing logged yet', 'Tick off at least one set to save this workout, or discard it.', 'Discard workout', () => { S.active = null; stopRest(); save(true); go('today', true); }, true); return; }
      const doFinish = () => { stopRest(); N.keepAwake(false); const sess = St.finishWorkout(); go('today', true); if (sess) setTimeout(() => { showSummary(sess); N.haptic('heavy'); celebrate(); updateWidget(); setTimeout(notifyAchievements, 900); }, 120); };
      if (pending) confirmSheet('Finish workout?', `${pending} unfinished set${pending > 1 ? 's' : ''} will be dropped.`, 'Finish', doFinish); else doFinish();
      break;
    }
    case 'discard': confirmSheet('Discard workout?', 'Nothing from this session will be saved.', 'Discard', () => { S.active = null; stopRest(); N.keepAwake(false); save(true); go('today', true); }, true); break;

    // interval timer
    case 'it-toggle': {
      const it = ui.it;
      if (it.running) { it.running = false; N.keepAwake(false); }
      else { it.running = true; it.round = 1; it.phase = 'work'; it.end = Date.now() + it.work * 1000; N.beep(1); N.keepAwake(true); }
      render(); break;
    }

    // data
    case 'export': {
      const json = JSON.stringify({ app: 'NrXFitz', version: St.VERSION, exportedAt: new Date().toISOString(), data: S }, null, 1);
      try { await N.exportJSON(`nrxfitz-backup-${St.todayKey()}.json`, json); toast('Backup ready'); } catch (err) { if (!/cancel/i.test(err?.message || '')) toast('Backup failed: ' + (err?.message || err)); }
      break;
    }
    case 'import': document.getElementById('import-file').click(); break;
    case 'reset': confirmSheet('Reset everything?', 'All workouts, routines, body weight entries and settings will be permanently deleted from this phone.', 'Delete all', () => { St.resetAll(); onboardStep = 0; restT = null; location.hash = ''; render(); }, true); break;
  }
}

function goBack() {
  if (closeSheet()) return;
  const [r] = route();
  if (r === 'routine') editing = null;
  if (TABS.some(tb => tb[0] === r)) return false;
  if (history.length > 1) history.back(); else go('today', true);
  return true;
}

// inputs
document.addEventListener('input', e => {
  const t = e.target; const d = t.dataset;
  if (d.set) { const [i, j, f] = d.set.split(':'); const s = S.active.exercises[+i].sets[+j]; s[f] = f === 'w' ? (t.value === '' ? '' : fromDisp(t.value)) : t.value; save(); return; }
  if (d.dfield) { if (d.dfield === 'weightDisp') draft.weightKg = t.value ? (draft.unit === 'lb' ? t.value / St.LB : +t.value) : ''; else draft[d.dfield] = t.value; const b = document.querySelector('[data-onb-next]'); if (b) b.disabled = !(draft.age && draft.heightCm && draft.weightKg); return; }
  if (d.rfield) { editing[d.rfield] = t.value; return; }
  if (d.rex) { const [i, f] = d.rex.split(':'); const e = editing.exercises[+i]; const v = Math.max(0, +t.value || 0); if (f === 'lo') e.reps[0] = v; else if (f === 'hi') e.reps[1] = v; else e[f] = f === 'sets' ? Math.max(1, Math.min(10, v || 1)) : v; return; }
  if (d.ui) { ui[d.ui] = t.value; if (d.ui === 't1w' || d.ui === 't1r') { const est = e1rm(fromDisp(ui.t1w), ui.t1r); document.getElementById('t1-out').textContent = est ? wFmt(est) : '–'; document.getElementById('t1-table').innerHTML = pctRows(est); } if (d.ui === 'ptw') document.getElementById('plate-out').innerHTML = plateOut(t.value); return; }
  if (d.it) { ui.it[d.it] = Math.max(1, +t.value || 1); return; }
  if (t.id === 'ex-search') { ui.exQuery = t.value; const q = t.value.toLowerCase(); document.getElementById('ex-list').innerHTML = exListItems(St.allExercises().filter(x => (ui.exFilter === 'all' || x.muscle === ui.exFilter) && (!q || x.name.toLowerCase().includes(q) || x.equipment.includes(q))), 'go'); return; }
  if (t.id === 'pick-search') { pick.q = t.value; refreshPickList(); return; }
  if (t.id === 'w-notes') { S.active.notes = t.value; save(); return; }
  if (t.id === 'ai-key') { S.settings.aiKey = t.value.trim(); save(); return; }
  if (t.id === 'coach-input') return;
  if (t.dataset.prof === 'dbMax') { S.profile.dbMax = t.value ? fromDisp(+t.value) : 0; save(); return; }
  if (t.id === 'onb-name') { draft.name = t.value; }
});
document.addEventListener('change', async e => {
  const t = e.target; const k = t.dataset.actChange;
  if (k === 'rest') { S.settings.rest = +t.value; save(); }
  if (k === 'bar') { S.settings.barKg = fromDisp(+t.value); save(); document.getElementById('plate-out').innerHTML = plateOut(ui.ptw); }
  if (k === 'activity') { ui.act = +t.value; render(); }
  if (k === 'ai-model') { S.settings.aiModel = t.value; save(); }
  if (t.dataset.fight) { fight[t.dataset.fight] = +t.value; }
  if (t.id === 'rem-time') { S.reminders.time = t.value || '18:00'; save(); syncReminders(true); }
  if (t.id === 'photo-file' && t.files[0]) {
    try { const data = await Ph.shrinkImage(t.files[0]); await Ph.addPhoto({ id: St.uid(), ts: Date.now(), data, weight: St.latestWeight() }); photoCache = null; render(); toast('Photo saved privately'); }
    catch (err) { toast(err.message); }
    t.value = '';
  }
  if (t.id === 'import-file' && t.files[0]) {
    try {
      const obj = JSON.parse(await t.files[0].text()); const data = obj.data || obj;
      if (!data || !Array.isArray(data.sessions) || !data.settings) throw new Error('Not a NrXFitz backup');
      confirmSheet('Restore backup?', `This replaces everything on this phone with the backup (${data.sessions.length} workouts).`, 'Restore', () => { St.replaceState(data); St.clearExCache(); restT = null; render(); toast('Backup restored'); }, true);
    } catch (err) { toast('Could not read file: ' + err.message); }
    t.value = '';
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'onb-name') document.querySelector('[data-onb-next]')?.click(); if (e.key === 'Enter' && e.target.id === 'coach-input') { coachAsk(e.target.value); e.target.value = ''; } });

// ============================================================ ticker
function updateTicker() {
  document.querySelectorAll('[data-elapsed]').forEach(el => { if (S.active) el.textContent = fmtClock((Date.now() - S.active.start) / 1000); });
  if (restT) {
    const left = (restT.end - Date.now()) / 1000;
    const tm = document.getElementById('rest-tm');
    if (tm) {
      tm.textContent = fmtClock(Math.max(0, left));
      const C = 2 * Math.PI * 23; const arc = document.getElementById('rest-arc');
      if (arc) arc.setAttribute('stroke-dashoffset', C * (1 - Math.max(0, left) / restT.total));
      const dock = document.getElementById('rest-dock'); dock?.classList.toggle('done', left <= 0);
      const lbl = document.getElementById('rest-lbl'); if (lbl) lbl.textContent = left <= 0 ? 'Rest over — go!' : 'Resting';
    }
    if (left <= 0 && !restT.fired) {
      restT.fired = true;
      if (S.settings.sound) N.beep(3);
      if (S.settings.vibrate) N.vibrate([200, 100, 200]);
      N.cancelRestNotification();
    }
    if (left < -20) { restT = null; document.getElementById('rest-dock')?.remove(); if (S.active) { S.active.rest = null; save(); } }
  }
  if (fight.running) {
    const changed = tickFight();
    if (route()[0] === 'fight') {
      if (changed || !fight.running) render();
      else { const c = document.getElementById('fight-clock'); if (c) c.textContent = fmtClock(Math.max(0, (fight.end - Date.now()) / 1000)); const call = document.getElementById('fight-call'); if (call && fight.phase === 'work') call.textContent = fight.lastCall || ''; }
    }
    if (!fight.running && fight.done) { S.fightDone = (S.fightDone || 0) + 1; save(); fight.done = false; setTimeout(notifyAchievements, 1500); setTimeout(celebrate, 400); }
  }
  const it = ui.it;
  if (it?.running) {
    let left = (it.end - Date.now()) / 1000;
    if (left <= 0) {
      if (it.phase === 'work' && it.round < it.rounds) { it.phase = 'rest'; it.end = Date.now() + it.rest * 1000; N.beep(2); N.vibrate(300); }
      else if (it.phase === 'rest') { it.phase = 'work'; it.round++; it.end = Date.now() + it.work * 1000; N.beep(1); N.vibrate([150, 80, 150]); }
      else { it.running = false; N.beep(4); N.vibrate([300, 100, 300, 100, 300]); N.keepAwake(false); if (route()[1] === 'timer') render(); toast('Done — great work'); return; }
      left = (it.end - Date.now()) / 1000;
    }
    const c = document.getElementById('it-clock'); if (c) c.textContent = fmtClock(left);
    const ph = document.getElementById('it-phase'); if (ph) ph.textContent = `${it.phase === 'work' ? 'Work' : 'Rest'} · Round ${it.round}/${it.rounds}`;
  }
}
setInterval(updateTicker, 250);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (restT && S.settings.notify && restT.end > Date.now()) N.scheduleRestNotification(restT.end); }
  else { N.cancelRestNotification(); if (route()[0] === 'workout' && S.active) N.keepAwake(true); }
});

function afterRender(r) {
  startAnims();
  if (r === 'workout' && S.active) N.keepAwake(true);
}

// ============================================================ boot
if (S.active?.rest && S.active.rest.end > Date.now() - 15000) restT = S.active.rest;
applyTheme();
if (S.profile) { updateWidget(); setTimeout(notifyAchievements, 1200); }
N.setupNativeChrome(exit => { const handled = goBack(); if (handled === false) { if (route()[0] !== 'today') go('today'); else exit(); } });
render();
