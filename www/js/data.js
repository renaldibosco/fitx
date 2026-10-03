// Noora — exercise library and program templates
// Row: [id, name, primary muscle, secondary muscles, equipment, pattern, coaching cues ("|" separated)]
const RAW = [
  // ---- Chest / horizontal push
  ['bb_bench', 'Barbell Bench Press', 'chest', 'triceps, shoulders', 'barbell', 'h_push', 'Eyes under the bar, feet planted, shoulder blades pinched|Lower the bar to mid-chest with elbows ~45°|Press up and slightly back to lockout'],
  ['db_bench', 'Dumbbell Bench Press', 'chest', 'triceps, shoulders', 'dumbbell', 'h_push', 'Kick the dumbbells up from your knees as you lie back|Lower until a deep stretch at chest level|Press up, bringing the bells close at the top'],
  ['db_floor_press', 'Dumbbell Floor Press', 'chest', 'triceps', 'dumbbell', 'h_push', 'Lie on the floor, knees bent|Lower until upper arms touch the floor, pause|Press up powerfully — great when no bench is available'],
  ['incline_bb', 'Incline Barbell Press', 'chest', 'shoulders, triceps', 'barbell', 'h_push', 'Bench at 30–45°|Lower to upper chest|Drive up keeping wrists stacked over elbows'],
  ['incline_db', 'Incline Dumbbell Press', 'chest', 'shoulders, triceps', 'dumbbell', 'h_push', 'Bench at 30–45°|Lower with control to upper chest|Press up without clanging the bells'],
  ['pushup', 'Push-up', 'chest', 'triceps, shoulders, core', 'bodyweight', 'h_push', 'Hands just outside shoulders, body in one straight line|Lower chest to a fist above the floor|Push the floor away; elevate hands to make it easier'],
  ['decline_pushup', 'Decline Push-up', 'chest', 'shoulders, triceps', 'bodyweight', 'h_push', 'Feet on a bench or bed|Keep hips in line with the body|Lower under control and press back up'],
  ['dips', 'Dips', 'chest', 'triceps, shoulders', 'bodyweight', 'h_push', 'Lean slightly forward for chest focus|Lower until shoulders are just below elbows|Drive up to full lockout'],
  ['machine_chest', 'Machine Chest Press', 'chest', 'triceps', 'machine', 'h_push', 'Set seat so handles are at mid-chest|Press out without locking hard|Return slowly to a full stretch'],
  ['db_fly', 'Dumbbell Fly', 'chest', 'shoulders', 'dumbbell', 'fly', 'Slight bend in the elbows, fixed throughout|Open wide until a stretch across the chest|Hug a big tree to bring the bells back up'],
  ['cable_fly', 'Cable Fly', 'chest', 'shoulders', 'cable', 'fly', 'Pulleys at shoulder height, step forward|Sweep hands together in an arc|Squeeze for a second, return slowly'],
  ['band_fly', 'Band Chest Fly', 'chest', 'shoulders', 'band', 'fly', 'Anchor the band behind you|Bring arms together in an arc|Control the band on the way back'],
  // ---- Back / pulls
  ['pullup', 'Pull-up', 'back', 'biceps, forearms', 'bodyweight', 'v_pull', 'Overhand grip just outside shoulders|Pull elbows down to your ribs, chest to the bar|Lower to a full hang every rep'],
  ['chinup', 'Chin-up', 'back', 'biceps', 'bodyweight', 'v_pull', 'Underhand grip shoulder-width|Drive elbows down and back|Chin clears the bar, lower slowly'],
  ['lat_pulldown', 'Lat Pulldown', 'back', 'biceps', 'cable', 'v_pull', 'Grip slightly wider than shoulders|Pull the bar to upper chest, lean back slightly|Let the arms fully extend at the top'],
  ['band_pulldown', 'Band Lat Pulldown', 'back', 'biceps', 'band', 'v_pull', 'Anchor the band high (door anchor)|Kneel and pull elbows to your sides|Control the return'],
  ['bb_row', 'Barbell Row', 'back', 'biceps, rear delts', 'barbell', 'h_pull', 'Hinge to ~45°, flat back|Row the bar to your lower ribs|Lower with control, no jerking'],
  ['db_row', 'One-arm Dumbbell Row', 'back', 'biceps, rear delts', 'dumbbell', 'h_pull', 'One hand and knee on a bench or chair|Row the bell toward your hip|Full stretch at the bottom'],
  ['db_row_2', 'Chest-supported DB Row', 'back', 'rear delts, biceps', 'dumbbell', 'h_pull', 'Lie face-down on an incline bench|Row both bells, squeezing shoulder blades|Lower to a full stretch'],
  ['cable_row', 'Seated Cable Row', 'back', 'biceps', 'cable', 'h_pull', 'Sit tall, slight knee bend|Pull the handle to your stomach|Let the shoulders reach forward on the return'],
  ['inverted_row', 'Inverted Row', 'back', 'biceps, core', 'bodyweight', 'h_pull', 'Under a sturdy table or low bar|Body straight, pull chest to the edge|Lower under control'],
  ['band_row', 'Band Row', 'back', 'biceps', 'band', 'h_pull', 'Anchor at chest height|Pull elbows back past your torso|Hold the squeeze for a second'],
  ['machine_row', 'Machine Row', 'back', 'biceps', 'machine', 'h_pull', 'Chest against the pad|Drive elbows back|Full stretch forward'],
  // ---- Shoulders
  ['ohp', 'Overhead Press', 'shoulders', 'triceps, core', 'barbell', 'v_push', 'Bar on front delts, glutes tight|Press straight up, head through at the top|Lower back to collarbone'],
  ['db_ohp', 'Seated Dumbbell Press', 'shoulders', 'triceps', 'dumbbell', 'v_push', 'Bells at ear level, palms forward|Press up until arms are straight|Lower to just below the ears'],
  ['arnold', 'Arnold Press', 'shoulders', 'triceps', 'dumbbell', 'v_push', 'Start palms facing you at chin height|Rotate palms out as you press|Reverse the rotation on the way down'],
  ['pike_pushup', 'Pike Push-up', 'shoulders', 'triceps', 'bodyweight', 'v_push', 'Hips high, body in an inverted V|Lower the top of your head toward the floor|Press back up; elevate feet to progress'],
  ['band_ohp', 'Band Overhead Press', 'shoulders', 'triceps', 'band', 'v_push', 'Stand on the band|Press handles overhead|Control back to shoulders'],
  ['lat_raise', 'Lateral Raise', 'shoulders', '', 'dumbbell', 'lat_raise', 'Slight forward lean, soft elbows|Raise out to shoulder height, lead with elbows|Lower slowly — no swinging'],
  ['cable_lat_raise', 'Cable Lateral Raise', 'shoulders', '', 'cable', 'lat_raise', 'Pulley at the lowest setting|Raise the arm out to shoulder height|Slow 2–3 second lowering'],
  ['band_lat_raise', 'Band Lateral Raise', 'shoulders', '', 'band', 'lat_raise', 'Stand on the band|Raise arms out to the sides|Control the return'],
  ['rear_fly', 'Rear Delt Fly', 'shoulders', 'back', 'dumbbell', 'rear_delt', 'Hinge forward, chest near parallel|Open arms out wide, pinkies up|Pause, then lower slowly'],
  ['face_pull', 'Face Pull', 'shoulders', 'back', 'cable', 'rear_delt', 'Rope at face height|Pull toward your forehead, elbows high|Rotate hands back at the end'],
  ['band_pull_apart', 'Band Pull-apart', 'shoulders', 'back', 'band', 'rear_delt', 'Arms straight at chest height|Pull the band apart to your chest|Squeeze shoulder blades together'],
  // ---- Arms
  ['bb_curl', 'Barbell Curl', 'biceps', 'forearms', 'barbell', 'biceps', 'Elbows pinned to your sides|Curl without swinging the torso|Lower slowly to full extension'],
  ['db_curl', 'Dumbbell Curl', 'biceps', 'forearms', 'dumbbell', 'biceps', 'Palms up, elbows still|Curl and squeeze at the top|3-second lowering'],
  ['hammer_curl', 'Hammer Curl', 'biceps', 'forearms', 'dumbbell', 'biceps', 'Neutral grip (thumbs up)|Curl up without moving the elbows|Lower under control'],
  ['cable_curl', 'Cable Curl', 'biceps', 'forearms', 'cable', 'biceps', 'Low pulley, straight bar|Curl to the shoulders|Constant tension on the way down'],
  ['band_curl', 'Band Curl', 'biceps', '', 'band', 'biceps', 'Stand on the band|Curl up, elbows fixed|Slow negative'],
  ['skullcrusher', 'Lying Triceps Extension', 'triceps', '', 'dumbbell', 'triceps', 'Lie down, arms vertical|Bend only at the elbows, lowering beside your head|Extend back to vertical'],
  ['oh_tri_ext', 'Overhead Triceps Extension', 'triceps', '', 'dumbbell', 'triceps', 'Hold one bell overhead with both hands|Lower behind the head, elbows pointing up|Extend fully'],
  ['pushdown', 'Triceps Pushdown', 'triceps', '', 'cable', 'triceps', 'Elbows pinned to sides|Push down to full lockout|Let it rise to ~90° only'],
  ['diamond_pushup', 'Diamond Push-up', 'triceps', 'chest', 'bodyweight', 'triceps', 'Hands together under the chest|Elbows track back along the body|Lower and press'],
  ['bench_dip', 'Bench Dip', 'triceps', 'chest', 'bodyweight', 'triceps', 'Hands on a bench or chair behind you|Lower until elbows reach 90°|Press back up'],
  ['band_pushdown', 'Band Pushdown', 'triceps', '', 'band', 'triceps', 'Anchor high|Elbows fixed at your sides|Push to lockout'],
  // ---- Legs
  ['bb_squat', 'Back Squat', 'quads', 'glutes, core', 'barbell', 'squat', 'Bar on upper back, brace your core|Sit down between your heels, knees track toes|Drive up through the whole foot'],
  ['front_squat', 'Front Squat', 'quads', 'core, glutes', 'barbell', 'squat', 'Bar on front delts, elbows high|Stay upright as you descend|Drive up, elbows stay up'],
  ['goblet_squat', 'Goblet Squat', 'quads', 'glutes, core', 'dumbbell', 'squat', 'Hold one bell at your chest|Squat deep between your knees|Stand tall, squeeze glutes'],
  ['bw_squat', 'Bodyweight Squat', 'quads', 'glutes', 'bodyweight', 'squat', 'Feet shoulder-width|Sit back and down, arms forward|Stand up fully'],
  ['leg_press', 'Leg Press', 'quads', 'glutes', 'machine', 'squat', 'Feet mid-platform, shoulder-width|Lower until knees near chest, back flat|Press without locking the knees'],
  ['bss', 'Bulgarian Split Squat', 'quads', 'glutes', 'dumbbell', 'lunge', 'Rear foot on a bench|Drop straight down, front shin fairly vertical|Drive through the front heel'],
  ['db_lunge', 'Dumbbell Reverse Lunge', 'quads', 'glutes', 'dumbbell', 'lunge', 'Step back into the lunge|Back knee hovers above the floor|Push through the front foot to return'],
  ['bw_lunge', 'Reverse Lunge', 'quads', 'glutes', 'bodyweight', 'lunge', 'Step back softly|Both knees to ~90°|Return to standing'],
  ['step_up', 'Step-up', 'quads', 'glutes', 'dumbbell', 'lunge', 'Whole foot on a sturdy box/step|Drive up through the top leg only|Lower slowly'],
  ['deadlift', 'Deadlift', 'hamstrings', 'glutes, back, core', 'barbell', 'hinge', 'Bar over mid-foot, hips hinge back|Flat back, take slack out of the bar|Push the floor away, lock out with glutes'],
  ['rdl', 'Romanian Deadlift', 'hamstrings', 'glutes, back', 'barbell', 'hinge', 'Soft knees, push hips back|Bar slides down the thighs to mid-shin|Squeeze glutes to stand'],
  ['db_rdl', 'Dumbbell Romanian Deadlift', 'hamstrings', 'glutes', 'dumbbell', 'hinge', 'Bells in front of the thighs|Hinge until a strong hamstring stretch|Drive hips forward to stand'],
  ['sl_rdl', 'Single-leg RDL', 'hamstrings', 'glutes, core', 'bodyweight', 'hinge', 'Balance on one leg|Hinge forward, back leg rises behind|Return under control'],
  ['kb_swing', 'Kettlebell Swing', 'glutes', 'hamstrings, core', 'kettlebell', 'hinge', 'Hike the bell back between your legs|Snap the hips forward|Bell floats to chest height'],
  ['hip_thrust', 'Hip Thrust', 'glutes', 'hamstrings', 'barbell', 'glute', 'Upper back on a bench, bar on hips|Drive hips up to full extension|Chin tucked, ribs down'],
  ['db_hip_thrust', 'Dumbbell Hip Thrust', 'glutes', 'hamstrings', 'dumbbell', 'glute', 'Bell on the hips, shoulders on bench|Drive up and squeeze hard|Lower slowly'],
  ['glute_bridge', 'Glute Bridge', 'glutes', 'hamstrings', 'bodyweight', 'glute', 'Lie on your back, knees bent|Drive through heels to lift hips|Hold 1 second at the top'],
  ['leg_ext', 'Leg Extension', 'quads', '', 'machine', 'leg_ext', 'Pad on lower shins|Extend to straight legs|Lower under control'],
  ['leg_curl', 'Leg Curl', 'hamstrings', '', 'machine', 'leg_curl', 'Pad just above the heels|Curl as far as possible|Slow return'],
  ['nordic', 'Nordic Curl (assisted)', 'hamstrings', '', 'bodyweight', 'leg_curl', 'Anchor your heels|Lower your body forward slowly|Catch with hands, push back up'],
  ['db_leg_curl', 'Dumbbell Leg Curl', 'hamstrings', '', 'dumbbell', 'leg_curl', 'Lie face-down, bell between feet|Curl heels toward glutes|Lower slowly'],
  ['calf_raise', 'Standing Calf Raise', 'calves', '', 'bodyweight', 'calves', 'Balls of feet on a step|Rise as high as possible, pause|Lower into a deep stretch'],
  ['db_calf_raise', 'Dumbbell Calf Raise', 'calves', '', 'dumbbell', 'calves', 'Hold a bell, one foot on a step|Full range up and down|Pause at the top'],
  ['machine_calf', 'Machine Calf Raise', 'calves', '', 'machine', 'calves', 'Shoulders under pads|Full stretch at the bottom|Drive up, pause'],
  // ---- Core
  ['plank', 'Plank', 'core', 'shoulders', 'bodyweight', 'core', 'Forearms under shoulders|Squeeze glutes, ribs down|Breathe — log seconds as reps'],
  ['side_plank', 'Side Plank', 'core', '', 'bodyweight', 'core', 'Elbow under shoulder|Hips high in a straight line|Log seconds per side as reps'],
  ['hanging_raise', 'Hanging Knee Raise', 'core', 'forearms', 'bodyweight', 'core', 'Hang from a bar|Curl knees toward chest, tilt pelvis|Lower without swinging'],
  ['dead_bug', 'Dead Bug', 'core', '', 'bodyweight', 'core', 'Lower back pressed into floor|Extend opposite arm and leg slowly|Alternate sides'],
  ['crunch', 'Crunch', 'core', '', 'bodyweight', 'core', 'Knees bent, hands by temples|Curl ribs toward pelvis|Lower slowly'],
  ['cable_crunch', 'Cable Crunch', 'core', '', 'cable', 'core', 'Kneel, rope by your head|Crunch down, rounding the spine|Return slowly'],
  ['russian_twist', 'Russian Twist', 'core', '', 'dumbbell', 'core', 'Lean back, feet down or up|Rotate the bell side to side|Count each side as one rep'],
  ['mountain_climber', 'Mountain Climber', 'core', 'shoulders', 'bodyweight', 'conditioning', 'Push-up position|Drive knees toward chest alternately|Keep hips low — quiet feet'],
  // ---- Cardio / conditioning
  ['treadmill_walk', 'Incline Treadmill Walk', 'cardio', 'glutes, calves', 'cardio', 'cardio', 'Incline 6–12%, brisk pace|Don\'t hold the rails|Log minutes as reps'],
  ['treadmill_run', 'Treadmill Intervals', 'cardio', 'quads', 'cardio', 'cardio', '1 min fast / 1–2 min easy|Repeat for the target time|Log minutes as reps'],
  ['bike', 'Stationary Bike', 'cardio', 'quads', 'cardio', 'cardio', 'Moderate resistance|Steady pace you can talk at|Log minutes as reps'],
  ['jump_rope', 'Jump Rope', 'cardio', 'calves', 'cardio', 'conditioning', 'Light on the balls of your feet|Wrists turn the rope|Log minutes as reps'],
  ['shadow_box', 'Shadow Boxing', 'cardio', 'shoulders, core', 'bodyweight', 'conditioning', 'Fighting stance, hands up|Jab, cross, hooks — stay light|Log minutes as reps'],
  ['farmer_walk', 'Farmer\'s Carry', 'forearms', 'core, traps', 'dumbbell', 'conditioning', 'Heavy bells at your sides|Walk tall with short steps|Log seconds as reps'],
  ['db_shrug', 'Dumbbell Shrug', 'back', 'forearms', 'dumbbell', 'h_pull', 'Bells at your sides|Shrug straight up toward the ears|Pause, lower slowly'],
];

export const TIMED = new Set(['plank', 'side_plank', 'treadmill_walk', 'treadmill_run', 'bike', 'jump_rope', 'shadow_box', 'farmer_walk', 'mountain_climber']);
export const BODYWEIGHT_EQ = new Set(['bodyweight']);

export const EXERCISES = RAW.map(([id, name, muscle, secondary, equipment, pattern, cues]) => ({
  id, name, muscle, secondary, equipment, pattern, cues: cues.split('|'), custom: false,
}));

export const MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'forearms', 'cardio'];
export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'kettlebell', 'band', 'bodyweight', 'cardio'];

export const EQUIPMENT_PROFILES = {
  gym: { label: 'Full gym', desc: 'Barbells, machines, cables', eq: ['barbell', 'dumbbell', 'machine', 'cable', 'kettlebell', 'band', 'bodyweight', 'cardio'] },
  home_db: { label: 'Home – dumbbells', desc: 'Dumbbells, bench/chair, bodyweight', eq: ['dumbbell', 'bodyweight', 'band', 'cardio'] },
  bodyweight: { label: 'Bodyweight only', desc: 'No equipment needed', eq: ['bodyweight'] },
};

export const GOALS = {
  fat_loss: { label: 'Lose fat', desc: 'Keep muscle, burn fat, build conditioning', sets: 3, reps: [12, 15], rest: 60, finisher: true },
  recomp: { label: 'Recomposition', desc: 'Lose fat and build muscle together', sets: 3, reps: [8, 12], rest: 90, finisher: true },
  muscle: { label: 'Build muscle', desc: 'Hypertrophy-focused volume', sets: 4, reps: [8, 12], rest: 90, finisher: false },
  strength: { label: 'Get stronger', desc: 'Heavy compound lifts, lower reps', sets: 5, reps: [3, 6], rest: 180, finisher: false },
};

export const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

// Preferred exercise per pattern, ordered by priority; first available wins
export const PATTERN_PREFS = {
  squat: ['bb_squat', 'leg_press', 'goblet_squat', 'bw_squat'],
  squat2: ['front_squat', 'leg_press', 'goblet_squat', 'bw_squat'],
  hinge: ['deadlift', 'db_rdl', 'kb_swing', 'sl_rdl'],
  hinge2: ['rdl', 'db_rdl', 'kb_swing', 'sl_rdl'],
  lunge: ['bss', 'db_lunge', 'bw_lunge'],
  h_push: ['bb_bench', 'db_bench', 'pushup'],
  h_push2: ['incline_db', 'incline_bb', 'db_floor_press', 'decline_pushup'],
  v_push: ['ohp', 'db_ohp', 'band_ohp', 'pike_pushup'],
  h_pull: ['bb_row', 'db_row', 'band_row', 'inverted_row'],
  h_pull2: ['cable_row', 'db_row_2', 'band_row', 'inverted_row'],
  v_pull: ['pullup', 'lat_pulldown', 'band_pulldown', 'chinup'],
  fly: ['cable_fly', 'db_fly', 'band_fly', 'decline_pushup'],
  lat_raise: ['lat_raise', 'cable_lat_raise', 'band_lat_raise', 'pike_pushup'],
  rear_delt: ['face_pull', 'rear_fly', 'band_pull_apart', 'inverted_row'],
  biceps: ['db_curl', 'bb_curl', 'band_curl', 'chinup'],
  biceps2: ['hammer_curl', 'cable_curl', 'band_curl', 'chinup'],
  triceps: ['pushdown', 'oh_tri_ext', 'band_pushdown', 'diamond_pushup'],
  triceps2: ['skullcrusher', 'oh_tri_ext', 'bench_dip', 'diamond_pushup'],
  glute: ['hip_thrust', 'db_hip_thrust', 'glute_bridge'],
  leg_curl: ['leg_curl', 'db_leg_curl', 'nordic'],
  leg_ext: ['leg_ext', 'step_up', 'bw_lunge'],
  calves: ['machine_calf', 'db_calf_raise', 'calf_raise'],
  core: ['hanging_raise', 'cable_crunch', 'dead_bug', 'crunch'],
  core2: ['plank', 'side_plank', 'dead_bug'],
  cardio: ['treadmill_walk', 'bike', 'shadow_box', 'jump_rope'],
  conditioning: ['kb_swing', 'mountain_climber', 'shadow_box', 'jump_rope'],
};

// Split templates: [day name, focus, [pattern slots]]
export const SPLITS = {
  2: { name: 'Full Body A/B', days: [
    ['Full Body A', 'Squat · Push · Pull', ['squat', 'h_push', 'h_pull', 'v_push', 'hinge2', 'core']],
    ['Full Body B', 'Hinge · Press · Pull', ['hinge', 'v_pull', 'h_push2', 'lunge', 'lat_raise', 'core2']],
  ] },
  3: { name: 'Full Body ×3', days: [
    ['Full Body A', 'Squat · Push · Pull', ['squat', 'h_push', 'h_pull', 'lat_raise', 'biceps', 'core']],
    ['Full Body B', 'Hinge · Press · Pull', ['hinge', 'v_push', 'v_pull', 'lunge', 'triceps', 'core2']],
    ['Full Body C', 'Legs · Upper volume', ['squat2', 'h_push2', 'h_pull2', 'glute', 'rear_delt', 'calves']],
  ] },
  4: { name: 'Upper / Lower', days: [
    ['Upper A', 'Strength focus', ['h_push', 'h_pull', 'v_push', 'v_pull', 'biceps', 'triceps']],
    ['Lower A', 'Squat focus', ['squat', 'hinge2', 'lunge', 'leg_curl', 'calves', 'core']],
    ['Upper B', 'Volume focus', ['h_push2', 'h_pull2', 'lat_raise', 'fly', 'biceps2', 'triceps2']],
    ['Lower B', 'Hinge focus', ['hinge', 'squat2', 'glute', 'leg_ext', 'calves', 'core2']],
  ] },
  5: { name: 'PPL + Upper/Lower', days: [
    ['Push', 'Chest · Shoulders · Triceps', ['h_push', 'v_push', 'h_push2', 'lat_raise', 'triceps']],
    ['Pull', 'Back · Biceps', ['v_pull', 'h_pull', 'h_pull2', 'rear_delt', 'biceps']],
    ['Legs', 'Quads · Hamstrings · Glutes', ['squat', 'hinge2', 'lunge', 'leg_curl', 'calves']],
    ['Upper', 'Full upper body', ['h_push2', 'v_pull', 'v_push', 'h_pull', 'biceps2', 'triceps2']],
    ['Lower', 'Posterior chain', ['hinge', 'squat2', 'glute', 'leg_ext', 'core']],
  ] },
  6: { name: 'Push / Pull / Legs ×2', days: [
    ['Push A', 'Chest focus', ['h_push', 'v_push', 'fly', 'lat_raise', 'triceps']],
    ['Pull A', 'Width focus', ['v_pull', 'h_pull', 'rear_delt', 'biceps', 'core']],
    ['Legs A', 'Quad focus', ['squat', 'hinge2', 'leg_ext', 'leg_curl', 'calves']],
    ['Push B', 'Shoulder focus', ['v_push', 'h_push2', 'lat_raise', 'fly', 'triceps2']],
    ['Pull B', 'Thickness focus', ['h_pull', 'v_pull', 'h_pull2', 'rear_delt', 'biceps2']],
    ['Legs B', 'Glute & hamstring focus', ['hinge', 'lunge', 'glute', 'leg_curl', 'core2']],
  ] },
};
