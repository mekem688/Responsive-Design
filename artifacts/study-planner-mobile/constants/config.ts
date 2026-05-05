export const SB_URL = "https://bxpatupsirntpwkkrjas.supabase.co";
export const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cGF0dXBzaXJudHB3a2tyamFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDEzMjAsImV4cCI6MjA5MTUxNzMyMH0.cDkJIBYIdNJHhmQqQVJbiooO17ERBQ9z0Icf7zaXyFg";

export const POMO_WORK = 25 * 60;
export const POMO_SHORT = 5 * 60;
export const POMO_LONG = 15 * 60;

export const CAT_LABELS: Record<string, string> = {
  etude: "Étude",
  revision: "Révision",
  exercice: "Exercice",
  lecture: "Lecture",
  projet: "Projet",
};

export const CAT_COLORS: Record<string, string> = {
  etude: "#4f8ef7",
  revision: "#7c5cbf",
  exercice: "#34c77b",
  lecture: "#f59e0b",
  projet: "#ef4444",
};

export const PRIO_LABELS: Record<string, string> = {
  haute: "Urgent",
  normale: "Normal",
  basse: "Optionnel",
};

export const PRIO_COLORS: Record<string, string> = {
  haute: "#ef4444",
  normale: "#f59e0b",
  basse: "#34c77b",
};

export const QUOTES = [
  {
    text: "Le succès, c'est tomber sept fois et se relever huit.",
    author: "Proverbe japonais",
  },
  {
    text: "L'éducation est l'arme la plus puissante pour changer le monde.",
    author: "Nelson Mandela",
  },
  {
    text: "Investir dans la connaissance paie le meilleur intérêt.",
    author: "Benjamin Franklin",
  },
  {
    text: "La discipline est le pont entre les objectifs et les accomplissements.",
    author: "Jim Rohn",
  },
  {
    text: "Chaque expert a été un débutant un jour.",
    author: "Helen Hayes",
  },
  {
    text: "Votre futur se crée aujourd'hui, pas demain.",
    author: "Robert T. Kiyosaki",
  },
  {
    text: "Ne comptez pas les jours, faites que les jours comptent.",
    author: "Muhammad Ali",
  },
];

export const BADGES_DEF = [
  { id: "first_task", icon: "🎯", name: "Premier pas", desc: "Compléter sa première tâche" },
  { id: "streak_3", icon: "🔥", name: "En feu", desc: "3 jours consécutifs" },
  { id: "streak_7", icon: "💫", name: "Régulier", desc: "7 jours consécutifs" },
  { id: "streak_30", icon: "🌟", name: "Légende", desc: "30 jours consécutifs" },
  { id: "tasks_10", icon: "📚", name: "Studieux", desc: "10 tâches complétées" },
  { id: "tasks_50", icon: "🎓", name: "Diplômé", desc: "50 tâches complétées" },
  { id: "pomo_10", icon: "🍅", name: "Tomate", desc: "10 Pomodoros complétés" },
  { id: "pomo_25", icon: "🏆", name: "Pomodoro Pro", desc: "25 Pomodoros complétés" },
  { id: "study_5h", icon: "⚡", name: "Productif", desc: "5h de travail au total" },
  { id: "study_20h", icon: "🚀", name: "Surhumain", desc: "20h de travail au total" },
];
