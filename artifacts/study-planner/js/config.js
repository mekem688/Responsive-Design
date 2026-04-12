/* ═══════════════════════════════════════════
   CONFIG — constantes, labels, citations
═══════════════════════════════════════════ */

var SB_URL = "https://bxpatupsirntpwkkrjas.supabase.co";
var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cGF0dXBzaXJudHB3a2tyamFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDEzMjAsImV4cCI6MjA5MTUxNzMyMH0.cDkJIBYIdNJHhmQqQVJbiooO17ERBQ9z0Icf7zaXyFg";

/* Pomodoro */
var POMO_WORK  = 25 * 60;
var POMO_SHORT =  5 * 60;
var POMO_LONG  = 15 * 60;
var CIRC = 2 * Math.PI * 70; /* circonférence du ring SVG (r=70) */

/* Catégories */
var CAT_LABELS = {
  etude:    '📖 Étude',
  revision: '🔄 Révision',
  exercice: '✏️ Exercice',
  lecture:  '📚 Lecture',
  projet:   '💼 Projet'
};
var CAT_COLORS = {
  etude:    '#4f8ef7',
  revision: '#7c5cbf',
  exercice: '#34c77b',
  lecture:  '#f59e0b',
  projet:   '#ef4444'
};
var PRIO_SCORE = { haute: 3, normale: 2, basse: 1 };

/* Citations motivantes */
var QUOTES = [
  { text: "Le succès, c'est tomber sept fois et se relever huit.", author: "Proverbe japonais" },
  { text: "L'éducation est l'arme la plus puissante pour changer le monde.", author: "Nelson Mandela" },
  { text: "Investir dans la connaissance paie le meilleur intérêt.", author: "Benjamin Franklin" },
  { text: "La discipline est le pont entre les objectifs et les accomplissements.", author: "Jim Rohn" },
  { text: "L'apprentissage, c'est comme ramer à contre-courant : dès qu'on arrête, on recule.", author: "Proverbe chinois" },
  { text: "Chaque expert a été un débutant un jour.", author: "Helen Hayes" },
  { text: "La connaissance s'acquiert par l'expérience, tout le reste n'est que de l'information.", author: "Albert Einstein" },
  { text: "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.", author: "Sénèque" },
  { text: "Votre futur se crée aujourd'hui, pas demain.", author: "Robert T. Kiyosaki" },
  { text: "Les limites existent seulement dans l'esprit. Si tu utilises ton esprit, les limites disparaissent.", author: "Arnold Schwarzenegger" },
  { text: "La vie est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre.", author: "Albert Einstein" },
  { text: "Ne comptez pas les jours, faites que les jours comptent.", author: "Muhammad Ali" }
];

/* Définitions des badges */
var BADGES_DEF = [
  {
    id: 'first_task',
    icon: '🎯',
    name: 'Premier pas',
    desc: 'Compléter sa première tâche'
  },
  {
    id: 'streak_3',
    icon: '🔥',
    name: 'En feu',
    desc: '3 jours consécutifs de travail'
  },
  {
    id: 'streak_7',
    icon: '💫',
    name: 'Régulier',
    desc: '7 jours consécutifs de travail'
  },
  {
    id: 'streak_30',
    icon: '🌟',
    name: 'Légende',
    desc: '30 jours consécutifs de travail'
  },
  {
    id: 'tasks_10',
    icon: '📚',
    name: 'Studieux',
    desc: '10 tâches complétées'
  },
  {
    id: 'tasks_50',
    icon: '🎓',
    name: 'Diplômé',
    desc: '50 tâches complétées'
  },
  {
    id: 'pomo_10',
    icon: '🍅',
    name: 'Tomate',
    desc: '10 Pomodoros complétés'
  },
  {
    id: 'pomo_25',
    icon: '🏆',
    name: 'Pomodoro Pro',
    desc: '25 Pomodoros complétés'
  },
  {
    id: 'study_5h',
    icon: '⚡',
    name: 'Productif',
    desc: '5h de travail au total'
  },
  {
    id: 'study_20h',
    icon: '🚀',
    name: 'Surhumain',
    desc: '20h de travail au total'
  }
];
