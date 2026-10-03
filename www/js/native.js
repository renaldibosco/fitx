// NrXFitz — native bridges with web fallbacks
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
    await SH.share({ title: 'NrXFitz backup', text: 'NrXFitz workout backup', url: r.uri, dialogTitle: 'Save or send your backup' });
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

// ---------- voice
export async function speak(text, lang = 'en-IN', rate = 1.0) {
  if (!text) return;
  const TTS = plug('TextToSpeech');
  try {
    if (isNative && TTS) { await TTS.stop().catch(() => {}); await TTS.speak({ text, lang, rate, pitch: 1.0, volume: 1.0, category: 'playback' }); return; }
    if ('speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate; speechSynthesis.speak(u); }
  } catch (e) { console.warn('tts', e); }
}
export async function stopSpeaking() {
  try { const TTS = plug('TextToSpeech'); if (isNative && TTS) await TTS.stop(); else window.speechSynthesis?.cancel(); } catch (e) { /* ignore */ }
}
export function canListen() {
  return (isNative && !!plug('SpeechRecognition')) || !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
export async function listen(lang = 'en-IN') {
  const SR = plug('SpeechRecognition');
  if (isNative && SR) {
    const av = await SR.available().catch(() => ({ available: false }));
    if (!av.available) throw new Error('Speech recognition is not available on this phone. Install or update the Google app.');
    const perm = await SR.checkPermissions().catch(() => ({}));
    if (perm.speechRecognition !== 'granted') { const r = await SR.requestPermissions(); if (r.speechRecognition !== 'granted') throw new Error('Microphone permission denied'); }
    const res = await SR.start({ language: lang, maxResults: 1, prompt: 'Ask your coach…', partialResults: false, popup: true });
    return (res?.matches || [])[0] || '';
  }
  const W = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!W) throw new Error('Voice input is not supported here — type your question instead.');
  return new Promise((resolve, reject) => {
    const r = new W(); r.lang = lang; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = e => resolve(e.results[0][0].transcript); r.onerror = e => reject(new Error(e.error)); r.onend = () => resolve('');
    r.start();
  });
}

// ---------- http (native bypasses CORS)
export async function postJSON(url, headers, body) {
  const H = plug('CapacitorHttp');
  if (isNative && H) {
    const r = await H.request({ method: 'POST', url, headers: { 'content-type': 'application/json', ...headers }, data: body, connectTimeout: 20000, readTimeout: 45000 });
    return { status: r.status, data: typeof r.data === 'string' ? JSON.parse(r.data || '{}') : r.data };
  }
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

// ---------- reminders
const REMIND_BASE = 7100;
export async function scheduleReminders(days, time, title, body) {
  const LN = plug('LocalNotifications'); if (!isNative || !LN) return false;
  try {
    const p = await LN.checkPermissions(); if (p.display !== 'granted') { const r = await LN.requestPermissions(); if (r.display !== 'granted') return false; }
    await LN.cancel({ notifications: [1, 2, 3, 4, 5, 6, 7].map(i => ({ id: REMIND_BASE + i })) }).catch(() => {});
    if (!days.length) return true;
    const [hour, minute] = time.split(':').map(Number);
    // Capacitor weekday: 1 = Sunday … 7 = Saturday; ours: 0 = Monday … 6 = Sunday
    const notifications = days.map(d => { const wd = d === 6 ? 1 : d + 2; return { id: REMIND_BASE + wd, title, body, schedule: { on: { weekday: wd, hour, minute }, allowWhileIdle: true } }; });
    await LN.schedule({ notifications });
    return true;
  } catch (e) { console.warn(e); return false; }
}

// ---------- widget data (read by the Android home-screen widget)
export async function pushWidget(data) {
  try {
    const Pref = plug('Preferences'); const WB = plug('WidgetBridge');
    if (!isNative || !Pref) return;
    await Pref.set({ key: 'widget', value: JSON.stringify(data) });
    if (WB) await WB.refresh().catch(() => {});
  } catch (e) { /* ignore */ }
}
