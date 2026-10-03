// NrXFitz — UI language (English / தமிழ்). Exercise names stay in English, like in any gym.
import { S } from './store.js';

const TA = {
  'Today': 'இன்று', 'Plan': 'திட்டம்', 'Exercises': 'பயிற்சிகள்', 'Progress': 'முன்னேற்றம்', 'More': 'மேலும்',
  'Good morning': 'காலை வணக்கம்', 'Good afternoon': 'மதிய வணக்கம்', 'Good evening': 'மாலை வணக்கம்',
  'This week': 'இந்த வாரம்', 'workouts': 'பயிற்சிகள்', 'wk streak': 'வார தொடர்', 'Up next': 'அடுத்தது', 'Day': 'நாள்', 'of': '/',
  'Start workout': 'பயிற்சியைத் தொடங்கு', 'Resume workout': 'பயிற்சியைத் தொடர்', 'In progress': 'நடைபெறுகிறது', 'Skip': 'தவிர்',
  'Volume': 'அளவு', 'Weight': 'எடை', 'All-time': 'மொத்தம்', 'sessions': 'அமர்வுகள்',
  'Empty workout': 'புதிய பயிற்சி', 'Log weight': 'எடை பதிவு', 'Recent': 'சமீபத்தியவை', 'See all': 'அனைத்தும்',
  'No workouts yet': 'இன்னும் பயிற்சிகள் இல்லை', 'Your first session will show up here.': 'உங்கள் முதல் பயிற்சி இங்கே தோன்றும்.',
  'Water': 'தண்ணீர்', 'Protein': 'புரதம்', 'glasses': 'கிளாஸ்', 'Cardio': 'கார்டியோ', 'Fight Mode': 'சண்டை பயிற்சி',
  'Ask Coach': 'பயிற்சியாளரிடம் கேள்', 'Your program': 'உங்கள் திட்டம்', 'Rebuild program': 'திட்டத்தை மீண்டும் உருவாக்கு',
  'Program days': 'திட்ட நாட்கள்', 'My routines': 'என் பயிற்சிகள்', 'Fight training': 'சண்டை பயிற்சிகள்', 'Next': 'அடுத்து',
  'Finish': 'முடி', 'Add exercises': 'பயிற்சிகளைச் சேர்', 'Notes': 'குறிப்புகள்', 'Discard workout': 'பயிற்சியை நீக்கு',
  'Set': 'செட்', 'Previous': 'முந்தையது', 'Reps': 'முறை', '+ Add set': '+ செட் சேர்', 'Resting': 'ஓய்வு', 'Rest over — go!': 'ஓய்வு முடிந்தது — தொடங்கு!',
  'Workouts': 'பயிற்சிகள்', 'Lifted': 'தூக்கியது', 'Body weight': 'உடல் எடை', 'Workouts per week': 'வாரத்திற்கு பயிற்சிகள்', 'Weekly volume': 'வார அளவு',
  'Sets this week': 'இந்த வார செட்கள்', 'Personal records': 'தனிப்பட்ட சாதனைகள்', 'Achievements': 'சாதனைப் பதக்கங்கள்', 'Measurements': 'உடல் அளவுகள்', 'Progress photos': 'முன்னேற்ற புகைப்படங்கள்',
  'Tools': 'கருவிகள்', 'Account': 'கணக்கு', 'Settings': 'அமைப்புகள்', 'Workout history': 'பயிற்சி வரலாறு', 'Body weight log': 'உடல் எடை பதிவு',
  'One-rep max': 'ஒரு முறை அதிகபட்சம்', 'Plate calculator': 'பிளேட் கணக்கீடு', 'Calories & macros': 'கலோரி & ஊட்டச்சத்து', 'Interval timer': 'இடைவெளி டைமர்',
  'Units': 'அலகுகள்', 'Rest timer': 'ஓய்வு டைமர்', 'Language': 'மொழி', 'Theme colour': 'தீம் நிறம்', 'Reminders': 'நினைவூட்டல்கள்', 'AI Coach': 'AI பயிற்சியாளர்',
  'Data': 'தரவு', 'Back up data': 'தரவை சேமி', 'Restore backup': 'காப்பை மீட்டெடு', 'Reset everything': 'அனைத்தையும் அழி', 'Program': 'திட்டம்',
  'Edit profile & goal': 'சுயவிவரம் & இலக்கை மாற்று', 'My equipment': 'என் உபகரணங்கள்', 'Save': 'சேமி', 'Cancel': 'ரத்து', 'Done': 'முடிந்தது', 'Edit': 'மாற்று',
  'How to': 'எப்படி செய்வது', 'History': 'வரலாறு', 'Exercise': 'பயிற்சி', 'Workout complete': 'பயிற்சி முடிந்தது', 'Time': 'நேரம்', 'Sets': 'செட்கள்',
  'Tap to speak': 'பேச தட்டவும்', 'Listening…': 'கேட்கிறது…', 'Thinking…': 'யோசிக்கிறது…', 'Type your question': 'உங்கள் கேள்வியை எழுதுங்கள்',
  'Deload week': 'ஓய்வு வாரம்', 'Start deload week': 'ஓய்வு வாரத்தைத் தொடங்கு', 'Not now': 'இப்போது வேண்டாம்',
  'Search exercises': 'பயிற்சிகளைத் தேடு', 'All': 'அனைத்தும்', 'Rounds': 'சுற்றுகள்', 'Round': 'சுற்று', 'Work': 'வேலை', 'Rest': 'ஓய்வு', 'Start': 'தொடங்கு', 'Stop': 'நிறுத்து',
  'Get ready': 'தயாராகுங்கள்', 'Log cardio': 'கார்டியோ பதிவு', 'Add photo': 'புகைப்படம் சேர்', 'Log measurements': 'அளவுகளைப் பதிவு செய்',
};

export function t(s) { return S.settings?.lang === 'ta' ? (TA[s] || s) : s; }
export const LANGS = [['en', 'English'], ['ta', 'தமிழ் (Tamil)']];
