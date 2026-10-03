// Noora — native bridges with web fallbacks
const Cap = window.Capacitor;
export const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
const plug = name => (Cap && Cap.Plugins && Cap.Plugins[name]) || null;

export async function haptic(kind = 'light') {
  try {
    const H = plug('Haptics');
    if (isNative && H) { kind === 'heavy' ? await H.notification({ type: 'SUCCESS' }) : await H.impact({ style: kind === 'medium' ? 'MEDIUM' : 'LIGHT' }); return; }
    navigator.vibrate?.(kind === 'heavy' ? [80, 60, 80] : 12);
  } catch (e) { /* ignore */ }
}
export function vibrate(pattern) { try { navigator.vibrate?.(pattern); } catch (e) { /* ignore */ } }

let actx = null;
export function unlockAudio() {
  try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { /* ignore */ }
}
export function beep(times = 3) {
  try {
    unlockAudio(); if (!actx) return;
    const t0 = actx.currentTime;
    for (let i = 0; i < times; i++) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = i === times - 1 ? 1320 : 880;
      const t = t0 + i * 0.22;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.2);
    }
  } catch (e) { /* ignore */ }
}

const REST_NOTIF_ID = 4242;
let notifAsked = false;
export async function scheduleRestNotification(atMs) {
  const LN = plug('LocalNotifications'); if (!isNative || !LN) return;
  try {
    if (!notifAsked) { notifAsked = true; const p = await LN.checkPermissions(); if (p.display !== 'granted') await LN.requestPermissions(); }
    await LN.cancel({ notifications: [{ id: REST_NOTIF_ID }] }).catch(() => {});
    if (atMs <= Date.now() + 1000) return;
    await LN.schedule({ notifications: [{ id: REST_NOTIF_ID, title: 'Rest over — next set', body: 'Time to lift. Let’s go.', schedule: { at: new Date(atMs), allowWhileIdle: true } }] });
  } catch (e) { console.warn(e); }
}
export async function cancelRestNotification() {
  const LN = plug('LocalNotifications'); if (!isNative || !LN) return;
  try { await LN.cancel({ notifications: [{ id: REST_NOTIF_ID }] }); } catch (e) { /* ignore */ }
}
export async function askNotificationPermission() {
  const LN = plug('LocalNotifications'); if (!isNative || !LN) return;
  try { const p = await LN.checkPermissions(); if (p.display !== 'granted') await LN.requestPermissions(); notifAsked = true; } catch (e) { /* ignore */ }
}

export async function exportJSON(filename, text) {
  const FS = plug('Filesystem'), SH = plug('Share');
  if (isNative && FS && SH) {
    const r = await FS.writeFile({ path: filename, data: text, directory: 'CACHE', encoding: 'utf8' });
    await SH.share({ title: 'Noora backup', text: 'Noora workout backup', url: r.uri, dialogTitle: 'Save or send your backup' });
    return true;
  }
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  return true;
}

let wakeLock = null;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener?.('release', () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { /* not supported */ }
}

export async function setupNativeChrome(onBack) {
  if (!isNative) return;
  try {
    const SB = plug('StatusBar');
    if (SB) { await SB.setBackgroundColor({ color: '#0A0B0D' }); await SB.setStyle({ style: 'DARK' }); }
  } catch (e) { /* ignore */ }
  try { const App = plug('App'); App && App.addListener('backButton', () => onBack(() => App.exitApp())); } catch (e) { /* ignore */ }
}
