// NrXFitz — AI coach: Claude when a key is set, built-in knowledge offline
import { S, ex, allExercises, goalOf, latestWeight, wFmt, unit, exHistory, setLabel } from './store.js';
import { GOALS, LEVELS, EQUIPMENT_PROFILES } from './data.js';
import { postJSON } from './native.js';

export const MODELS = [
  ['claude-haiku-4-5', 'Haiku 4.5 — fastest'],
  ['claude-sonnet-4-5', 'Sonnet 4.5 — smarter'],
];

let history = []; // [{role, content}]
export function resetChat() { history = []; }
export function chatHistory() { return history; }

function profileContext(exId) {
  const p = S.profile || {};
  const lines = [
    `Name: ${p.name || 'athlete'}; goal: ${GOALS[p.goal]?.label || '-'}; level: ${LEVELS[p.level] || '-'}; equipment: ${EQUIPMENT_PROFILES[p.equipment]?.label || 'custom home setup'}; trains ${p.days || '?'} days/week.`,
    `Body: ${p.sex || '-'}, ${p.age || '?'} yrs, ${p.heightCm || '?'} cm, ${latestWeight() ? wFmt(latestWeight()) + ' ' + unit() : '?'}. Units: ${unit()}.`,
  ];
  const recent = [...S.sessions].sort((a, b) => b.start - a.start).slice(0, 3);
  if (recent.length) lines.push('Recent workouts: ' + recent.map(s => `${new Date(s.start).toDateString()} ${s.name}: ` + s.exercises.slice(0, 5).map(e => `${ex(e.exId).name} ${e.sets.map(st => setLabel(e.exId, st)).join('/')}`).join('; ')).join(' | '));
  if (exId) {
    const e = ex(exId); const h = exHistory(exId).slice(-3);
    lines.push(`They are asking from the "${e.name}" screen (${e.muscle}, ${e.equipment}). Form cues in app: ${e.cues.join('; ')}.` + (h.length ? ` Their last sets: ${h.map(x => x.sets.map(s => setLabel(exId, s)).join('/')).join(' | ')}.` : ''));
  }
  if (S.active) lines.push(`Currently mid-workout: ${S.active.name}.`);
  return lines.join('\n');
}

const SYSTEM = `You are "NrX Coach", the built-in voice coach of the NrXFitz gym app. You are an expert, friendly strength & conditioning coach (also knows Muay Thai/boxing conditioning and nutrition basics).
Answer the user's doubts about exercise form, technique, which muscles work, sets/reps/rest, progression, soreness, warm-ups, home training, cardio and diet basics.
Style: your reply is read aloud, so write plain conversational text with no markdown, no bullet symbols, no emojis. Keep it short: 2–5 sentences, under 90 words, unless they ask for a full plan. Lead with the direct answer, then 1–3 practical cues.
Safety: if they mention sharp pain, joint pain that persists, chest pain, dizziness or injury, tell them to stop that exercise and see a doctor or physiotherapist; never diagnose. No extreme diets or unsafe weight-loss advice.
If they write in Tamil, answer in simple Tamil. Use their profile below to personalise.`;

export async function askCoach(question, exId = null) {
  question = (question || '').trim(); if (!question) return '';
  history.push({ role: 'user', content: question });
  let answer;
  const key = S.settings.aiKey?.trim();
  if (key) {
    try {
      const r = await postJSON('https://api.anthropic.com/v1/messages', {
        'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
      }, { model: S.settings.aiModel || MODELS[0][0], max_tokens: 500, system: SYSTEM + '\n\nUser profile:\n' + profileContext(exId), messages: history.slice(-10) });
      if (r.status >= 200 && r.status < 300) answer = (r.data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
      else if (r.status === 401) answer = 'Your Claude API key was rejected. Check it in Settings, under AI Coach. Meanwhile, here is what I know offline. ' + offlineAnswer(question, exId);
      else answer = `The AI service returned an error (${r.status}${r.data?.error?.message ? ': ' + r.data.error.message : ''}). Offline answer: ` + offlineAnswer(question, exId);
    } catch (e) {
      answer = 'I could not reach the AI right now, so here is my offline answer. ' + offlineAnswer(question, exId);
    }
  } else answer = offlineAnswer(question, exId);
  answer = answer.replace(/\*\*?|#+ /g, '');
  history.push({ role: 'assistant', content: answer });
  return answer;
}

// ---------------------------------------------------------------- offline brain
const has = (q, ...ws) => ws.some(w => q.includes(w));
function findExercise(q) {
  let best = null, score = 0;
  for (const e of allExercises()) {
    const name = e.name.toLowerCase().replace(/[()']/g, '');
    if (q.includes(name)) { const s = name.length + 100; if (s > score) { best = e; score = s; } continue; }
    const words = name.split(/[\s-]+/).filter(w => w.length > 3);
    const hit = words.filter(w => q.includes(w)).length;
    if (hit && hit / words.length >= 0.5 && hit * 10 > score) { best = e; score = hit * 10; }
  }
  const alias = { 'pushup': 'pushup', 'push up': 'pushup', 'pullup': 'pullup', 'pull up': 'pullup', 'bench': 'bb_bench', 'squat': 'bb_squat', 'deadlift': 'deadlift', 'rdl': 'rdl', 'curl': 'db_curl', 'plank': 'plank', 'lunge': 'db_lunge', 'shoulder press': 'db_ohp', 'row': 'db_row', 'dip': 'dips', 'hip thrust': 'hip_thrust' };
  if (!best) for (const [k, id] of Object.entries(alias)) if (q.includes(k)) { best = ex(id); break; }
  return best;
}

export function offlineAnswer(question, exId) {
  const q = ' ' + question.toLowerCase() + ' ';
  const g = goalOf(); const p = S.profile || {};
  const e = findExercise(q) || (exId && has(q, 'this', 'it ', 'form', 'how', 'muscle', 'weight', 'reps') ? ex(exId) : null);
  if (/[஀-௿]/.test(question)) return 'Tamil answers need the AI coach. Add your Claude API key in Settings, under AI Coach, and ask again — I will reply in Tamil.';
  if (has(q, 'pain', 'hurt', 'injur', 'sharp', 'chest pain', 'dizzy')) return 'Stop the exercise that causes pain. Mild muscle burning is normal, but sharp or joint pain is not. Try a lighter weight and a smaller range, and if pain stays more than a few days or is sharp, see a doctor or physiotherapist before training that area again.';
  if (e && has(q, 'muscle', 'work', 'target')) return `${e.name} mainly trains your ${e.muscle}${e.secondary ? ', with help from ' + e.secondary : ''}.`;
  if (e && has(q, 'how many', 'sets', 'reps')) return `For ${e.name} with your ${g.label.toLowerCase()} goal, do ${g.sets} sets of ${g.reps[0]} to ${g.reps[1]} reps, resting about ${g.rest} seconds. When you hit ${g.reps[1]} reps on every set, add a little weight next time.`;
  if (e && has(q, 'heavy', 'weight', 'how much')) return `Pick a weight for ${e.name} where the last 2 reps are hard but your form stays clean — about 2 reps left in the tank. If you can do more than ${g.reps[1]} reps easily, go heavier next set.`;
  if (e) return `${e.name}: ${e.cues.join('. ')}. It works your ${e.muscle}${e.secondary ? ' and ' + e.secondary : ''}. Move slowly on the way down and keep good form before adding weight.`;
  if (has(q, 'sore', 'doms', 'stiff')) return 'Soreness 1 to 3 days after training is normal, especially with new exercises. Keep moving: light walking, easy sets and good sleep help. You can train a sore muscle lightly, but if soreness is sharp or in a joint, rest it.';
  if (has(q, 'warm')) return 'Warm up for 5 minutes with brisk walking or the treadmill, then do 2 to 3 light sets of your first exercise: about half weight for 10 reps, then 70 percent for 5. Use the warm-up button in the workout menu to add these automatically.';
  if (has(q, 'rest', 'break between')) return `Rest about ${g.rest} seconds between sets for your goal. Heavy compound lifts like squats can take 2 to 3 minutes; small exercises like curls need 60 to 90 seconds.`;
  if (has(q, 'protein')) { const kg = latestWeight() || 70; return `Aim for roughly ${Math.round(Math.min(kg, 25 * Math.pow((p.heightCm || 175) / 100, 2) + 0.25 * Math.max(0, kg - 25 * Math.pow((p.heightCm || 175) / 100, 2))) * 1.8)} grams of protein a day, spread over 3 to 4 meals. Good sources: eggs, chicken, fish, paneer, curd, dal, soya chunks and milk. The Calories and Macros tool gives your exact targets.`; }
  if (has(q, 'lose fat', 'fat loss', 'weight loss', 'lose weight', 'belly', 'reduce')) return 'Fat loss comes from a small daily calorie deficit, about 300 to 500 calories, plus lifting to keep muscle and lots of walking. Eat high protein, cut sugary drinks and fried snacks, sleep 7 to 8 hours, and aim to lose about half to one percent of your body weight per week.';
  if (has(q, 'build muscle', 'gain muscle', 'bulk', 'size', 'bigger')) return 'To build muscle: train each muscle twice a week with 10 to 20 hard sets, add weight or reps over time, eat enough protein, and sleep well. Progress is slow but steady — log every workout so you can see it.';
  if (has(q, 'plateau', 'stuck', 'not improving', 'stall')) return 'If a lift is stuck for 2 to 3 weeks, take a deload week: about 60 percent of your weights with fewer sets. Then build back up. Also check your sleep and food. NrXFitz will suggest a deload automatically when it sees you stall.';
  if (has(q, 'breath')) return 'Take a big breath into your belly and brace before each rep, hold it through the hardest part, then breathe out at the top. For light sets, breathe in on the way down and out as you push.';
  if (has(q, 'cardio', 'treadmill', 'walk', 'run')) return 'Do 2 to 4 cardio sessions a week. Incline walking on the treadmill is joint-friendly and great for fat loss: 20 to 40 minutes at a pace where you can still talk. Do cardio after lifting or on separate days.';
  if (has(q, 'muay thai', 'boxing', 'punch', 'kick', 'fight', 'knee strike')) return 'For fight fitness, mix shadow boxing rounds, knee strikes and teeps with strength training twice a week. Keep your hands up, chin down, and turn your hips into every strike. Try Fight Mode for timed rounds with called combos.';
  if (has(q, 'creatine', 'supplement', 'whey')) return 'Supplements are optional. Whey protein is just convenient protein. Creatine monohydrate, 3 to 5 grams a day, is the best-researched for strength. Check with a doctor first if you have kidney or other health issues.';
  if (has(q, 'stretch', 'mobility', 'flexib')) return 'Do dynamic movements before training, like leg swings and arm circles, and save longer static stretches of 30 seconds for after training or rest days.';
  if (has(q, 'sleep')) return 'Aim for 7 to 9 hours of sleep. Muscle is built while you recover, and poor sleep makes you weaker and hungrier.';
  if (has(q, 'how often', 'days a week', 'frequency')) return `You are set for ${p.days || 3} days a week, which is great. Train each muscle about twice a week and keep at least one full rest day.`;
  if (has(q, ' hi ', 'hello', ' hey ')) return `Hey ${p.name || 'there'}! Ask me anything about your training — form, sets, soreness or food.`;
  return 'Offline I can explain any exercise in the app — try "how do I do a goblet squat?" or ask about sets, rest, soreness, protein or fat loss. For any question at all, turn on the full AI coach: add your Claude API key in Settings, under AI Coach.';
}
