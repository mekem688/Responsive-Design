import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BADGES_DEF, SB_KEY, SB_URL } from "@/constants/config";

export interface Task {
  id: string | number;
  title: string;
  start_time?: string | null;
  end_time?: string | null;
  category: string;
  priority: string;
  done: boolean;
  user_id?: string;
}

export interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

export interface Session {
  id: number;
  taskId: string | number;
  taskTitle: string;
  category: string;
  duration: number;
  type: "pomodoro" | "timed" | "free";
  date: string;
}

export interface Streak {
  count: number;
  lastDate: string;
}

interface AppContextType {
  token: string | null;
  userId: string | null;
  userEmail: string | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  tasks: Task[];
  tasksLoading: boolean;
  loadTasks: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (id: string | number, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string | number) => Promise<void>;
  toggleTask: (id: string | number, done: boolean) => Promise<void>;
  sessions: Session[];
  recordSession: (
    task: Task,
    duration: number,
    type: Session["type"]
  ) => void;
  clearSessions: () => void;
  streak: Streak;
  updateStreak: () => void;
  pomoTotal: number;
  incrementPomoTotal: () => void;
  getSubtasks: (taskId: string | number) => SubTask[];
  saveSubtasks: (taskId: string | number, subs: SubTask[]) => void;
  getNote: (taskId: string | number) => string;
  saveNote: (taskId: string | number, note: string) => void;
  dailyGoalHours: number;
  weeklyGoalPomos: number;
  setGoals: (daily: number, weeklyPomos: number) => void;
  unlockedBadges: string[];
  checkBadges: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function sbHeaders(token?: string | null) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SB_KEY,
    Prefer: "return=representation",
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [streak, setStreak] = useState<Streak>({ count: 0, lastDate: "" });
  const [pomoTotal, setPomoTotal] = useState(0);
  const [dailyGoalHours, setDailyGoalHours] = useState(2);
  const [weeklyGoalPomos, setWeeklyGoalPomos] = useState(20);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);

  const subtasksCache = useRef<Record<string, SubTask[]>>({});
  const notesCache = useRef<Record<string, string>>({});

  const uKey = useCallback(
    (key: string) => `sp_${userId ?? "anon"}_${key}`,
    [userId]
  );

  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem("sp_token");
      const storedUserId = await AsyncStorage.getItem("sp_user_id");
      const storedEmail = await AsyncStorage.getItem("sp_user_email");
      if (storedToken && storedUserId) {
        setToken(storedToken);
        setUserId(storedUserId);
        setUserEmail(storedEmail);
      }
      setAuthLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const s = await AsyncStorage.getItem(uKey("sessions"));
      if (s) setSessions(JSON.parse(s));

      const sk = await AsyncStorage.getItem(uKey("streak"));
      if (sk) setStreak(JSON.parse(sk));

      const pt = await AsyncStorage.getItem(uKey("pomo_total"));
      if (pt) setPomoTotal(Number(pt));

      const dg = await AsyncStorage.getItem(uKey("goal_daily"));
      if (dg) setDailyGoalHours(Number(dg));

      const wg = await AsyncStorage.getItem(uKey("goal_weekly"));
      if (wg) setWeeklyGoalPomos(Number(wg));

      const ub = await AsyncStorage.getItem(uKey("badges"));
      if (ub) setUnlockedBadges(JSON.parse(ub));
    })();
  }, [userId, uKey]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(
      `${SB_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: sbHeaders(),
        body: JSON.stringify({ email, password }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description ?? data.msg ?? "Erreur de connexion");
    await AsyncStorage.setItem("sp_token", data.access_token);
    await AsyncStorage.setItem("sp_user_id", data.user.id);
    await AsyncStorage.setItem("sp_user_email", data.user.email ?? "");
    setToken(data.access_token);
    setUserId(data.user.id);
    setUserEmail(data.user.email ?? "");
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${SB_URL}/auth/v1/signup`, {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description ?? data.msg ?? "Erreur d'inscription");
    if (data.access_token) {
      await AsyncStorage.setItem("sp_token", data.access_token);
      await AsyncStorage.setItem("sp_user_id", data.user.id);
      await AsyncStorage.setItem("sp_user_email", data.user.email ?? "");
      setToken(data.access_token);
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? "");
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(["sp_token", "sp_user_id", "sp_user_email"]);
    setToken(null);
    setUserId(null);
    setUserEmail(null);
    setTasks([]);
    setSessions([]);
    setStreak({ count: 0, lastDate: "" });
    setPomoTotal(0);
    setUnlockedBadges([]);
    subtasksCache.current = {};
    notesCache.current = {};
  }, []);

  const loadTasks = useCallback(async () => {
    if (!token || !userId) return;
    setTasksLoading(true);
    try {
      const res = await fetch(
        `${SB_URL}/rest/v1/tasks?user_id=eq.${userId}&order=start_time.asc`,
        { headers: sbHeaders(token) }
      );
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setTasks(data);
    } finally {
      setTasksLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (token && userId) loadTasks();
  }, [token, userId, loadTasks]);

  const createTask = useCallback(
    async (data: Partial<Task>) => {
      if (!token || !userId) return;
      const res = await fetch(`${SB_URL}/rest/v1/tasks`, {
        method: "POST",
        headers: sbHeaders(token),
        body: JSON.stringify({ ...data, user_id: userId, done: false }),
      });
      if (!res.ok) throw new Error("Erreur création");
      const [created] = await res.json();
      setTasks((prev) => [...prev, created]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [token, userId]
  );

  const updateTask = useCallback(
    async (id: string | number, data: Partial<Task>) => {
      if (!token) return;
      const res = await fetch(`${SB_URL}/rest/v1/tasks?id=eq.${id}`, {
        method: "PATCH",
        headers: sbHeaders(token),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
      const [updated] = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    },
    [token]
  );

  const deleteTask = useCallback(
    async (id: string | number) => {
      if (!token) return;
      await fetch(`${SB_URL}/rest/v1/tasks?id=eq.${id}`, {
        method: "DELETE",
        headers: sbHeaders(token),
      });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [token]
  );

  const toggleTask = useCallback(
    async (id: string | number, done: boolean) => {
      if (!token) return;
      const res = await fetch(`${SB_URL}/rest/v1/tasks?id=eq.${id}`, {
        method: "PATCH",
        headers: sbHeaders(token),
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error("Erreur toggle");
      const [updated] = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (done) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [token]
  );

  const recordSession = useCallback(
    (task: Task, duration: number, type: Session["type"]) => {
      const session: Session = {
        id: Date.now(),
        taskId: task.id,
        taskTitle: task.title,
        category: task.category,
        duration,
        type,
        date: new Date().toISOString(),
      };
      setSessions((prev) => {
        const next = [session, ...prev].slice(0, 200);
        AsyncStorage.setItem(uKey("sessions"), JSON.stringify(next));
        return next;
      });
    },
    [uKey]
  );

  const clearSessions = useCallback(() => {
    setSessions([]);
    AsyncStorage.removeItem(uKey("sessions"));
  }, [uKey]);

  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    setStreak((prev) => {
      let next: Streak;
      if (prev.lastDate === today) {
        next = prev;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isConsecutive = prev.lastDate === yesterday.toDateString();
        next = {
          count: isConsecutive ? prev.count + 1 : 1,
          lastDate: today,
        };
      }
      AsyncStorage.setItem(uKey("streak"), JSON.stringify(next));
      return next;
    });
  }, [uKey]);

  const incrementPomoTotal = useCallback(() => {
    setPomoTotal((prev) => {
      const next = prev + 1;
      AsyncStorage.setItem(uKey("pomo_total"), String(next));
      return next;
    });
  }, [uKey]);

  const getSubtasks = useCallback(
    (taskId: string | number): SubTask[] => {
      return subtasksCache.current[String(taskId)] ?? [];
    },
    []
  );

  const saveSubtasks = useCallback(
    (taskId: string | number, subs: SubTask[]) => {
      subtasksCache.current[String(taskId)] = subs;
      AsyncStorage.setItem(uKey(`subtasks_${taskId}`), JSON.stringify(subs));
    },
    [uKey]
  );

  const loadSubtasksForTask = useCallback(
    async (taskId: string | number) => {
      const stored = await AsyncStorage.getItem(uKey(`subtasks_${taskId}`));
      if (stored) subtasksCache.current[String(taskId)] = JSON.parse(stored);
    },
    [uKey]
  );

  useEffect(() => {
    tasks.forEach((t) => loadSubtasksForTask(t.id));
  }, [tasks, loadSubtasksForTask]);

  const getNote = useCallback((taskId: string | number): string => {
    return notesCache.current[String(taskId)] ?? "";
  }, []);

  const saveNote = useCallback(
    (taskId: string | number, note: string) => {
      notesCache.current[String(taskId)] = note;
      AsyncStorage.setItem(uKey(`note_${taskId}`), note);
    },
    [uKey]
  );

  const setGoals = useCallback(
    (daily: number, weeklyPomos: number) => {
      setDailyGoalHours(daily);
      setWeeklyGoalPomos(weeklyPomos);
      AsyncStorage.setItem(uKey("goal_daily"), String(daily));
      AsyncStorage.setItem(uKey("goal_weekly"), String(weeklyPomos));
    },
    [uKey]
  );

  const checkBadges = useCallback(() => {
    const doneTasks = tasks.filter((t) => t.done).length;
    const totalSeconds = sessions.reduce((a, b) => a + b.duration, 0);
    const totalHours = totalSeconds / 3600;

    const earned: string[] = [];
    if (doneTasks >= 1) earned.push("first_task");
    if (streak.count >= 3) earned.push("streak_3");
    if (streak.count >= 7) earned.push("streak_7");
    if (streak.count >= 30) earned.push("streak_30");
    if (doneTasks >= 10) earned.push("tasks_10");
    if (doneTasks >= 50) earned.push("tasks_50");
    if (pomoTotal >= 10) earned.push("pomo_10");
    if (pomoTotal >= 25) earned.push("pomo_25");
    if (totalHours >= 5) earned.push("study_5h");
    if (totalHours >= 20) earned.push("study_20h");

    const newBadges = earned.filter((b) => !unlockedBadges.includes(b));
    if (newBadges.length > 0) {
      setUnlockedBadges((prev) => {
        const next = [...prev, ...newBadges];
        AsyncStorage.setItem(uKey("badges"), JSON.stringify(next));
        return next;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [tasks, sessions, streak, pomoTotal, unlockedBadges, uKey]);

  return (
    <AppContext.Provider
      value={{
        token,
        userId,
        userEmail,
        authLoading,
        login,
        signup,
        logout,
        tasks,
        tasksLoading,
        loadTasks,
        createTask,
        updateTask,
        deleteTask,
        toggleTask,
        sessions,
        recordSession,
        clearSessions,
        streak,
        updateStreak,
        pomoTotal,
        incrementPomoTotal,
        getSubtasks,
        saveSubtasks,
        getNote,
        saveNote,
        dailyGoalHours,
        weeklyGoalPomos,
        setGoals,
        unlockedBadges,
        checkBadges,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
