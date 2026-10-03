// NrXFitz — animated form demos (forward-kinematics stick figure, side or front view)
// Angles in degrees. Limbs: 0 = pointing straight down, +90 = pointing forward (+x), 180 = straight up.
// Torso t: 0 = upright, +90 = leaning fully forward, -90 = lying back.
const L = { torso: 30, thigh: 22, shin: 22, ua: 15, fa: 14, head: 6.2 };
const FLOOR = 92;
const rad = d => d * Math.PI / 180;
const limb = (p, a, len) => [p[0] + len * Math.sin(rad(a)), p[1] + len * Math.cos(rad(a))];

const STAND = { hx: 60, hy: 46, t: 0, th1: 0, sh1: 0, th2: 0, sh2: 0, ua1: 6, fa1: 6, ua2: -4, fa2: -4 };
const P = (a, b, o = {}) => ({ a: { ...STAND, ...a }, b: { ...STAND, ...a, ...b }, ...o });

export const ANIMS = {
  squat: P({ ua1: 40, fa1: 160, ua2: 40, fa2: 160 }, { t: 32, th1: 98, sh1: -28, th2: 98, sh2: -28, ua1: 70, fa1: 170, ua2: 70, fa2: 170 }, { anchor: 'feet', eq: 'db1' }),
  bb_squat: P({ ua1: 150, fa1: 30, ua2: 150, fa2: 30 }, { t: 30, th1: 98, sh1: -28, th2: 98, sh2: -28, ua1: 170, fa1: 50, ua2: 170, fa2: 50 }, { anchor: 'feet', eq: 'bbBack' }),
  hinge: P({ ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { t: 78, th1: 18, sh1: -6, th2: 18, sh2: -6, ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { anchor: 'feet', eq: 'bb' }),
  hinge_db: P({ ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { t: 78, th1: 18, sh1: -6, th2: 18, sh2: -6, ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { anchor: 'feet', eq: 'db' }),
  lunge: P({ th2: -6, sh2: -6 }, { th1: 84, sh1: -2, th2: -24, sh2: -84 }, { anchor: 'foot1', eq: 'db' }),
  bench: P({ hx: 78, hy: 60, t: -90, th1: 70, sh1: 0, th2: 70, sh2: 0, ua1: 180, fa1: 180, ua2: 180, fa2: 180 }, { ua1: 96, fa1: 180, ua2: 96, fa2: 180 }, { eq: 'bbBench', prop: 'bench' }),
  bench_db: P({ hx: 78, hy: 60, t: -90, th1: 70, sh1: 0, th2: 70, sh2: 0, ua1: 180, fa1: 180, ua2: 180, fa2: 180 }, { ua1: 100, fa1: 175, ua2: 100, fa2: 175 }, { eq: 'db', prop: 'bench' }),
  pushup: P({ t: 74, th1: -74, sh1: -74, th2: -74, sh2: -74, ua1: -2, fa1: -2, ua2: -2, fa2: -2 }, { t: 86, th1: -86, sh1: -86, th2: -86, sh2: -86, ua1: -64, fa1: 22, ua2: -64, fa2: 22 }, { anchor: 'feetL' }),
  plank: P({ t: 84, th1: -84, sh1: -84, th2: -84, sh2: -84, ua1: -4, fa1: 88, ua2: -4, fa2: 88 }, { t: 82, th1: -82, sh1: -82, th2: -82, sh2: -82 }, { anchor: 'feetL', speed: 0.5 }),
  dips: P({ ua1: -8, fa1: 172, ua2: -8, fa2: 172, th1: 30, sh1: -40, th2: 30, sh2: -40 }, { t: 18, ua1: -78, fa1: 170, ua2: -78, fa2: 170, th1: 30, sh1: -40, th2: 30, sh2: -40 }, { anchor: 'hands', prop: 'dip' }),
  ohp: P({ ua1: 20, fa1: 176, ua2: 20, fa2: 176 }, { ua1: 180, fa1: 180, ua2: 180, fa2: 180 }, { anchor: 'feet', eq: 'bbFront' }),
  ohp_db: P({ ua1: 20, fa1: 176, ua2: 20, fa2: 176 }, { ua1: 180, fa1: 180, ua2: 180, fa2: 180 }, { anchor: 'feet', eq: 'db' }),
  row: P({ t: 62, th1: 22, sh1: -12, th2: 22, sh2: -12, ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { ua1: -108, fa1: 0, ua2: -108, fa2: 0 }, { anchor: 'feet', eq: 'db' }),
  row_bb: P({ t: 62, th1: 22, sh1: -12, th2: 22, sh2: -12, ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { ua1: -100, fa1: 0, ua2: -100, fa2: 0 }, { anchor: 'feet', eq: 'bb' }),
  pullup: P({ ua1: 176, fa1: 180, ua2: 176, fa2: 180, th1: 8, sh1: -24, th2: 8, sh2: -24 }, { ua1: 12, fa1: 172, ua2: 12, fa2: 172 }, { anchor: 'hands', prop: 'bar' }),
  hang_raise: P({ ua1: 180, fa1: 180, ua2: 180, fa2: 180, th1: 2, sh1: 0, th2: 2, sh2: 0 }, { th1: 100, sh1: 6, th2: 100, sh2: 6 }, { anchor: 'hands', prop: 'bar' }),
  curl: P({ ua1: 0, fa1: 4, ua2: 0, fa2: 4 }, { ua1: 8, fa1: 148, ua2: 8, fa2: 148 }, { anchor: 'feet', eq: 'db' }),
  curl_bb: P({ ua1: 0, fa1: 4, ua2: 0, fa2: 4 }, { ua1: 8, fa1: 148, ua2: 8, fa2: 148 }, { anchor: 'feet', eq: 'bbFront' }),
  tri: P({ ua1: 172, fa1: 8, ua2: 172, fa2: 8 }, { ua1: 172, fa1: 176, ua2: 172, fa2: 176 }, { anchor: 'feet', eq: 'db1' }),
  pushdown: P({ ua1: 4, fa1: 120, ua2: 4, fa2: 120, t: 8 }, { ua1: 4, fa1: 6, ua2: 4, fa2: 6, t: 8 }, { anchor: 'feet' }),
  raise: { front: true, a: { arm: 12 }, b: { arm: 86 }, eq: 'db' },
  fly: { front: true, a: { arm: 84 }, b: { arm: 168 }, eq: 'db' },
  calf: P({ ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { lift: 5 }, { anchor: 'feet', eq: 'db', speed: 1.4 }),
  crunch: P({ hx: 66, hy: 86, t: -90, th1: 140, sh1: 22, th2: 140, sh2: 22, ua1: -120, fa1: -170, ua2: -120, fa2: -170 }, { t: -52, ua1: -150, fa1: 160, ua2: -150, fa2: 160 }, {}),
  bridge: P({ hx: 66, hy: 86, t: -90, th1: 136, sh1: 12, th2: 136, sh2: 12, ua1: -90, fa1: -90, ua2: -90, fa2: -90 }, { hy: 72, t: -66, th1: 100, sh1: 2, th2: 100, sh2: 2, ua1: -66, fa1: -66, ua2: -66, fa2: -66 }, {}),
  leg_ext: P({ hx: 52, hy: 66, t: -6, th1: 90, sh1: 2, th2: 90, sh2: 2, ua1: 10, fa1: 10, ua2: 10, fa2: 10 }, { sh1: 88, sh2: 88 }, { prop: 'chair' }),
  leg_curl: P({}, { th1: -8, sh1: -112 }, { anchor: 'foot2' }),
  run: P({ th1: 34, sh1: 0, th2: -26, sh2: -56, ua1: -34, fa1: 62, ua2: 34, fa2: 104, t: 8 }, { th1: -26, sh1: -56, th2: 34, sh2: 0, ua1: 34, fa1: 104, ua2: -34, fa2: 62 }, { anchor: 'low', speed: 2.2, prop: 'tread' }),
  punch: P({ th1: 16, sh1: 8, th2: -14, sh2: -10, t: 8, ua1: 30, fa1: 160, ua2: 26, fa2: 168 }, { ua1: 88, fa1: 92 }, { anchor: 'feet', speed: 2.4 }),
  knee: P({ t: -8, ua1: 70, fa1: 150, ua2: 70, fa2: 150 }, { t: -16, th1: 112, sh1: -24, ua1: 30, fa1: 40, ua2: 30, fa2: 40 }, { anchor: 'foot2', speed: 1.6 }),
  kick: P({ t: -4, ua1: 50, fa1: 160, ua2: 50, fa2: 160 }, { t: -28, th1: 96, sh1: 92, ua1: -20, fa1: 30 }, { anchor: 'foot2', speed: 1.5 }),
  swing: P({ t: 66, th1: 22, sh1: -10, th2: 22, sh2: -10, ua1: -24, fa1: -24, ua2: -24, fa2: -24 }, { t: 0, th1: 0, sh1: 0, th2: 0, sh2: 0, ua1: 94, fa1: 94, ua2: 94, fa2: 94 }, { anchor: 'feet', eq: 'kb' }),
  side_plank: P({ t: 76, th1: -76, sh1: -76, th2: -76, sh2: -76, ua1: -4, fa1: 88, ua2: 170, fa2: 170 }, { t: 72, th1: -72, sh1: -72, th2: -72, sh2: -72 }, { anchor: 'feetL', speed: 0.5 }),
  shrug: P({ ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { lift: 0, shrug: 4 }, { anchor: 'feet', eq: 'db', speed: 1.4 }),
  carry: P({ th1: 18, sh1: 4, th2: -14, sh2: -14, ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { th1: -14, sh1: -14, th2: 18, sh2: 4 }, { anchor: 'low', eq: 'db', speed: 1.6 }),
  mountain: P({ t: 72, th1: 70, sh1: -60, th2: -72, sh2: -72, ua1: 0, fa1: 0, ua2: 0, fa2: 0 }, { th1: -72, sh1: -72, th2: 70, sh2: -60 }, { anchor: 'hands', prop: 'floorHands', speed: 2.2 }),
};

const BY_ID = {
  bb_squat: 'bb_squat', front_squat: 'bb_squat', leg_press: 'squat', bw_squat: 'squat', goblet_squat: 'squat',
  deadlift: 'hinge', rdl: 'hinge', db_rdl: 'hinge_db', sl_rdl: 'hinge_db', kb_swing: 'swing',
  bss: 'lunge', db_lunge: 'lunge', bw_lunge: 'lunge', step_up: 'lunge',
  bb_bench: 'bench', incline_bb: 'bench', db_bench: 'bench_db', incline_db: 'bench_db', db_floor_press: 'bench_db', machine_chest: 'bench_db',
  pushup: 'pushup', decline_pushup: 'pushup', diamond_pushup: 'pushup', pike_pushup: 'pushup', dips: 'dips', bench_dip: 'dips',
  ohp: 'ohp', db_ohp: 'ohp_db', arnold: 'ohp_db', band_ohp: 'ohp_db',
  bb_row: 'row_bb', db_row: 'row', db_row_2: 'row', cable_row: 'row', inverted_row: 'row', band_row: 'row', machine_row: 'row', db_shrug: 'shrug',
  pullup: 'pullup', chinup: 'pullup', lat_pulldown: 'pullup', band_pulldown: 'pullup', hanging_raise: 'hang_raise',
  bb_curl: 'curl_bb', db_curl: 'curl', hammer_curl: 'curl', cable_curl: 'curl', band_curl: 'curl',
  skullcrusher: 'tri', oh_tri_ext: 'tri', pushdown: 'pushdown', band_pushdown: 'pushdown',
  lat_raise: 'raise', cable_lat_raise: 'raise', band_lat_raise: 'raise', rear_fly: 'raise', face_pull: 'row', band_pull_apart: 'fly',
  db_fly: 'fly', cable_fly: 'fly', band_fly: 'fly',
  hip_thrust: 'bridge', db_hip_thrust: 'bridge', glute_bridge: 'bridge',
  leg_ext: 'leg_ext', leg_curl: 'leg_curl', db_leg_curl: 'leg_curl', nordic: 'leg_curl',
  calf_raise: 'calf', db_calf_raise: 'calf', machine_calf: 'calf',
  plank: 'plank', side_plank: 'side_plank', dead_bug: 'crunch', crunch: 'crunch', cable_crunch: 'crunch', russian_twist: 'crunch', mountain_climber: 'mountain',
  treadmill_walk: 'run', treadmill_run: 'run', bike: 'run', jump_rope: 'calf', shadow_box: 'punch', farmer_walk: 'carry',
  thai_knees: 'knee', teep_kick: 'kick', round_kick: 'kick', heavy_bag: 'punch', sprawl: 'pushup', wall_sit: 'squat',
};
const BY_MUSCLE = { chest: 'pushup', back: 'row', shoulders: 'ohp_db', biceps: 'curl', triceps: 'tri', quads: 'squat', hamstrings: 'hinge_db', glutes: 'bridge', calves: 'calf', core: 'crunch', forearms: 'carry', cardio: 'run' };
export const animFor = (exId, muscle) => BY_ID[exId] || BY_MUSCLE[muscle] || 'squat';

const lerp = (a, b, k) => a + (b - a) * k;
function pose(spec, k) {
  const o = {}; for (const key of new Set([...Object.keys(spec.a), ...Object.keys(spec.b)])) o[key] = lerp(spec.a[key] ?? spec.b[key] ?? 0, spec.b[key] ?? spec.a[key] ?? 0, k); return o;
}

function solveSide(p, anchor) {
  let H = [p.hx, p.hy];
  const sh = p.shrug || 0;
  const build = (H) => {
    const S = [H[0] + L.torso * Math.sin(rad(p.t)), H[1] - L.torso * Math.cos(rad(p.t)) - sh];
    const Hd = [S[0] + (L.head + 2) * Math.sin(rad(p.t)), S[1] - (L.head + 2) * Math.cos(rad(p.t)) + sh];
    const K1 = limb(H, p.th1, L.thigh), A1 = limb(K1, p.sh1, L.shin);
    const K2 = limb(H, p.th2, L.thigh), A2 = limb(K2, p.sh2, L.shin);
    const E1 = limb(S, p.ua1, L.ua), W1 = limb(E1, p.fa1, L.fa);
    const E2 = limb(S, p.ua2, L.ua), W2 = limb(E2, p.fa2, L.fa);
    return { H, S, Hd, K1, A1, K2, A2, E1, W1, E2, W2 };
  };
  let j = build(H);
  let dx = 0, dy = 0;
  if (anchor === 'feet') { dy = FLOOR - 3 - Math.max(j.A1[1], j.A2[1]) - (p.lift || 0); dx = 56 - (j.A1[0] + j.A2[0]) / 2; }
  else if (anchor === 'feetL') { dy = FLOOR - 3 - Math.max(j.A1[1], j.A2[1]); dx = 16 - Math.min(j.A1[0], j.A2[0]); }
  else if (anchor === 'foot1') { dy = FLOOR - 3 - j.A1[1]; dx = 70 - j.A1[0]; }
  else if (anchor === 'foot2') { dy = FLOOR - 3 - j.A2[1]; dx = 54 - j.A2[0]; }
  else if (anchor === 'low') { dy = FLOOR - 3 - Math.max(j.A1[1], j.A2[1]); }
  else if (anchor === 'hands') { const ty = spec_prop === 'floorHands' ? FLOOR - 3 : spec_prop === 'dip' ? 44 : 11; dy = ty - j.W1[1]; dx = (spec_prop === 'floorHands' ? 80 : 62) - j.W1[0]; }
  if (dx || dy) { H = [H[0] + dx, H[1] + dy]; j = build(H); }
  return j;
}
let spec_prop = null;

const seg = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
const foot = (A, sh) => [A[0] + 6 * Math.cos(rad(sh)), A[1] - 6 * Math.sin(rad(sh))];

function propSvg(prop) {
  if (prop === 'bench') return `<rect x="30" y="64" width="54" height="5" rx="2" fill="var(--surface-3)"/><rect x="38" y="69" width="4" height="23" fill="var(--surface-3)"/><rect x="72" y="69" width="4" height="23" fill="var(--surface-3)"/>`;
  if (prop === 'bar') return `<rect x="22" y="9" width="80" height="4" rx="2" fill="var(--text-3)"/>`;
  if (prop === 'dip') return `<rect x="50" y="44" width="26" height="4" rx="2" fill="var(--text-3)"/><rect x="72" y="44" width="4" height="48" fill="var(--surface-3)"/>`;
  if (prop === 'chair') return `<rect x="36" y="69" width="28" height="5" rx="2" fill="var(--surface-3)"/><rect x="38" y="74" width="4" height="18" fill="var(--surface-3)"/><rect x="34" y="40" width="5" height="34" rx="2" fill="var(--surface-3)"/>`;
  if (prop === 'tread') return `<rect x="22" y="${FLOOR - 1}" width="80" height="5" rx="2.5" fill="var(--surface-3)"/><rect x="94" y="54" width="4" height="38" rx="2" fill="var(--surface-3)"/>`;
  return '';
}

export function animSvg(name) {
  return `<svg class="anim-fig" data-anim="${name}" viewBox="0 0 120 100" aria-hidden="true"><line x1="6" y1="${FLOOR}" x2="114" y2="${FLOOR}" stroke="var(--line)" stroke-width="1.5"/><g class="ap">${propSvg(ANIMS[name]?.prop)}</g><g class="af" fill="none" stroke-linecap="round" stroke-linejoin="round"></g></svg>`;
}

function frame(el, k) {
  const name = el.dataset.anim; const spec = ANIMS[name]; if (!spec) return;
  const g = el.querySelector('.af');
  const ink = 'var(--accent)', far = 'var(--text-3)';
  const p = pose(spec, k);
  if (spec.front) {
    const H = [60, 52], S = [60, 26], Hd = [60, 17];
    const arm = side => { const a = side * p.arm; const sx = 60 + side * 8; const E = limb([sx, 28], a, L.ua), W = limb(E, a, L.fa); return { s: [sx, 28], E, W }; };
    const l = arm(-1), r = arm(1);
    let eqs = '';
    if (spec.eq === 'db') for (const W of [l.W, r.W]) eqs += `<rect x="${W[0] - 5}" y="${W[1] - 2}" width="10" height="4" rx="1.5" fill="var(--text)"/>`;
    g.innerHTML = `<path d="M54 52L52 ${FLOOR - 3}M66 52L68 ${FLOOR - 3}" stroke="${ink}" stroke-width="6"/><path d="M60 52L60 26M52 28H68" stroke="${ink}" stroke-width="7"/><path d="${seg(l.s, l.E)}${seg(l.E, l.W)}${seg(r.s, r.E)}${seg(r.E, r.W)}" stroke="${ink}" stroke-width="5"/><circle cx="${Hd[0]}" cy="${Hd[1]}" r="${L.head}" fill="${ink}"/>${eqs}`;
    return;
  }
  spec_prop = spec.prop;
  const j = solveSide(p, spec.anchor);
  let eq = '';
  const dumb = W => `<g transform="translate(${W[0].toFixed(1)} ${W[1].toFixed(1)})"><rect x="-6" y="-2.2" width="12" height="4.4" rx="1.5" fill="var(--text)"/><rect x="-7" y="-4" width="3" height="8" rx="1" fill="var(--text)"/><rect x="4" y="-4" width="3" height="8" rx="1" fill="var(--text)"/></g>`;
  if (spec.eq === 'db') eq = dumb(j.W2) + dumb(j.W1);
  else if (spec.eq === 'db1') eq = dumb([(j.W1[0] + j.W2[0]) / 2, (j.W1[1] + j.W2[1]) / 2]);
  else if (spec.eq === 'kb') eq = `<circle cx="${j.W1[0]}" cy="${j.W1[1] + 5}" r="5" fill="var(--text)"/>`;
  else if (spec.eq && spec.eq.startsWith('bb')) { const W = spec.eq === 'bbBack' ? [j.S[0] - 2, j.S[1] + 2] : j.W1; eq = `<circle cx="${W[0].toFixed(1)}" cy="${W[1].toFixed(1)}" r="9" fill="none" stroke="var(--text)" stroke-width="3.5"/><circle cx="${W[0].toFixed(1)}" cy="${W[1].toFixed(1)}" r="2" fill="var(--text)"/>`; }
  g.innerHTML =
    `<path d="${seg(j.H, j.K2)}${seg(j.K2, j.A2)}${seg(j.A2, foot(j.A2, p.sh2))}" stroke="${far}" stroke-width="5.5"/>` +
    `<path d="${seg(j.S, j.E2)}${seg(j.E2, j.W2)}" stroke="${far}" stroke-width="4.5"/>` +
    `<path d="${seg(j.H, j.S)}" stroke="${ink}" stroke-width="8"/>` +
    `<path d="${seg(j.H, j.K1)}${seg(j.K1, j.A1)}${seg(j.A1, foot(j.A1, p.sh1))}" stroke="${ink}" stroke-width="6"/>` +
    `<circle cx="${j.Hd[0].toFixed(1)}" cy="${j.Hd[1].toFixed(1)}" r="${L.head}" fill="${ink}"/>` + eq +
    `<path d="${seg(j.S, j.E1)}${seg(j.E1, j.W1)}" stroke="${ink}" stroke-width="5"/>`;
}

let raf = null; const t0 = performance.now();
function loop(now) {
  const els = document.querySelectorAll('.anim-fig');
  if (!els.length) { raf = null; return; }
  els.forEach(el => {
    const spec = ANIMS[el.dataset.anim]; const sp = spec?.speed || 1;
    const ph = ((now - t0) / 1000) * sp / 2.4;
    const k = 0.5 - 0.5 * Math.cos(ph * 2 * Math.PI);
    frame(el, k);
  });
  raf = requestAnimationFrame(loop);
}
export function startAnims() { if (!raf && document.querySelector('.anim-fig')) raf = requestAnimationFrame(loop); }
export const _frame = frame;
