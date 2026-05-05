import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CAT_COLORS, POMO_LONG, POMO_SHORT, POMO_WORK } from "@/constants/config";
import { Task, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

type Mode = "free" | "pomodoro";
type Phase = "work" | "short" | "long";

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TimerRing({ progress, size, color, children }: { progress: number; size: number; color: string; children: React.ReactNode }) {
  const strokeW = 10;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={cx} cy={cy} r={r} stroke={"rgba(0,0,0,0.08)"} strokeWidth={strokeW} fill="none" />
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={color}
          strokeWidth={strokeW}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          originX={cx}
          originY={cy}
        />
      </Svg>
      {children}
    </View>
  );
}

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { tasks, recordSession, updateStreak, incrementPomoTotal } = useApp();

  const [mode, setMode] = useState<Mode>("pomodoro");
  const [phase, setPhase] = useState<Phase>("work");
  const [pomoCount, setPomoCount] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    params.taskId ? String(params.taskId) : null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(POMO_WORK);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedTask: Task | null =
    selectedTaskId
      ? tasks.find((t) => String(t.id) === selectedTaskId) ?? null
      : null;

  useEffect(() => {
    if (mode === "pomodoro") {
      setElapsed(0);
      setTotal(phase === "work" ? POMO_WORK : phase === "short" ? POMO_SHORT : POMO_LONG);
      setIsRunning(false);
    }
  }, [mode, phase]);

  const remaining = mode === "pomodoro" ? total - elapsed : elapsed;
  const progress = mode === "pomodoro" ? 1 - elapsed / total : 0;

  const catColor = selectedTask ? (CAT_COLORS[selectedTask.category] ?? colors.primary) : colors.primary;
  const ringColor = phase === "work" ? catColor : phase === "short" ? colors.green : colors.orange;

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (selectedTask) {
      const duration = mode === "pomodoro" ? POMO_WORK : elapsed;
      recordSession(selectedTask, duration, mode === "pomodoro" ? "pomodoro" : "free");
      updateStreak();
    }

    if (mode === "pomodoro" && phase === "work") {
      incrementPomoTotal();
      const newCount = pomoCount + 1;
      setPomoCount(newCount);
      if (newCount % 4 === 0) {
        setPhase("long");
      } else {
        setPhase("short");
      }
    } else if (mode === "pomodoro") {
      setPhase("work");
    }
    setElapsed(0);
  }, [selectedTask, mode, elapsed, phase, pomoCount, recordSession, updateStreak, incrementPomoTotal]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (mode === "pomodoro" && prev + 1 >= total) {
            handleComplete();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, total, handleComplete]);

  function toggleTimer() {
    setIsRunning((r) => !r);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function resetTimer() {
    setIsRunning(false);
    setElapsed(0);
    if (mode === "pomodoro") {
      setTotal(phase === "work" ? POMO_WORK : phase === "short" ? POMO_SHORT : POMO_LONG);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function stopAndRecord() {
    if (elapsed > 10 && selectedTask) {
      recordSession(selectedTask, elapsed, "free");
      updateStreak();
    }
    setIsRunning(false);
    setElapsed(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const s = makeStyles(colors, topPadding);

  const phaseLabels: Record<Phase, string> = {
    work: "Travail",
    short: "Pause courte",
    long: "Pause longue",
  };

  const displayTime = mode === "pomodoro"
    ? formatTime(total - elapsed)
    : formatTime(elapsed);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      {/* Mode toggle */}
      <View style={s.modeToggle}>
        <TouchableOpacity
          style={[s.modeBtn, mode === "pomodoro" && s.modeBtnActive]}
          onPress={() => { setMode("pomodoro"); resetTimer(); setPomoCount(0); setPhase("work"); }}
        >
          <Text style={[s.modeBtnText, mode === "pomodoro" && s.modeBtnTextActive]}>
            Pomodoro
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, mode === "free" && s.modeBtnActive]}
          onPress={() => { setMode("free"); resetTimer(); }}
        >
          <Text style={[s.modeBtnText, mode === "free" && s.modeBtnTextActive]}>
            Chrono libre
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phase selector (pomodoro only) */}
      {mode === "pomodoro" && (
        <View style={s.phaseRow}>
          {(["work", "short", "long"] as Phase[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.phaseBtn, phase === p && s.phaseBtnActive]}
              onPress={() => { setPhase(p); setElapsed(0); setIsRunning(false); }}
            >
              <Text style={[s.phaseBtnText, phase === p && s.phaseBtnTextActive]}>
                {phaseLabels[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Timer ring */}
      <View style={s.ringContainer}>
        <TimerRing
          progress={mode === "pomodoro" ? 1 - elapsed / total : 1}
          size={240}
          color={isRunning ? ringColor : colors.border}
        >
          <View style={s.ringInner}>
            <Text style={[s.timeText, { color: isRunning ? ringColor : colors.text }]}>
              {displayTime}
            </Text>
            {mode === "pomodoro" && (
              <Text style={s.phaseLabel}>{phaseLabels[phase]}</Text>
            )}
            {mode === "free" && elapsed > 0 && (
              <Text style={s.phaseLabel}>En cours</Text>
            )}
          </View>
        </TimerRing>

        {/* Pomodoro dots */}
        {mode === "pomodoro" && (
          <View style={s.pomoDots}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.pomoDot,
                  i < pomoCount % 4 ? s.pomoDotFilled : s.pomoDotEmpty,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <TouchableOpacity style={s.resetBtn} onPress={resetTimer}>
          <Feather name="rotate-ccw" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.playBtn, { backgroundColor: isRunning ? colors.orange : colors.primary }]}
          onPress={toggleTimer}
        >
          <Feather name={isRunning ? "pause" : "play"} size={30} color="#fff" />
        </TouchableOpacity>

        {mode === "free" && elapsed > 0 && (
          <TouchableOpacity style={s.stopBtn} onPress={stopAndRecord}>
            <Feather name="square" size={22} color={colors.green} />
          </TouchableOpacity>
        )}
        {mode === "pomodoro" && (
          <TouchableOpacity style={s.stopBtn} onPress={handleComplete}>
            <Feather name="skip-forward" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Task selector */}
      <View style={s.taskSection}>
        <Text style={s.taskSectionLabel}>Tâche associée</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.taskScroll}>
          <TouchableOpacity
            style={[s.taskChip, !selectedTaskId && s.taskChipActive]}
            onPress={() => setSelectedTaskId(null)}
          >
            <Text style={[s.taskChipText, !selectedTaskId && s.taskChipTextActive]}>
              Aucune
            </Text>
          </TouchableOpacity>
          {tasks.filter((t) => !t.done).map((t) => {
            const col = CAT_COLORS[t.category] ?? colors.primary;
            const isSelected = selectedTaskId === String(t.id);
            return (
              <TouchableOpacity
                key={String(t.id)}
                style={[
                  s.taskChip,
                  isSelected && { backgroundColor: col + "22", borderColor: col },
                ]}
                onPress={() => setSelectedTaskId(String(t.id))}
              >
                <View style={[s.taskDot, { backgroundColor: col }]} />
                <Text
                  style={[
                    s.taskChipText,
                    isSelected && { color: col },
                  ]}
                  numberOfLines={1}
                >
                  {t.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 90 }} />
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPadding: number) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    container: { paddingTop: topPadding + 16, paddingHorizontal: 20, alignItems: "center" },
    modeToggle: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      alignSelf: "stretch",
    },
    modeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: "center",
    },
    modeBtnActive: { backgroundColor: colors.primary },
    modeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    modeBtnTextActive: { color: "#fff" },
    phaseRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 20,
      alignSelf: "stretch",
    },
    phaseBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: colors.card,
    },
    phaseBtnActive: { backgroundColor: colors.primaryLight },
    phaseBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    phaseBtnTextActive: { color: colors.primary },
    ringContainer: { alignItems: "center", marginBottom: 24 },
    ringInner: { alignItems: "center" },
    timeText: {
      fontSize: 52,
      fontFamily: "Inter_700Bold",
      letterSpacing: -2,
    },
    phaseLabel: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
      marginTop: 4,
    },
    pomoDots: {
      flexDirection: "row",
      gap: 8,
      marginTop: 16,
    },
    pomoDot: { width: 10, height: 10, borderRadius: 5 },
    pomoDotFilled: { backgroundColor: colors.primary },
    pomoDotEmpty: { backgroundColor: colors.border },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginBottom: 32,
    },
    resetBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    playBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    stopBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    taskSection: { alignSelf: "stretch" },
    taskSectionLabel: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      marginBottom: 10,
    },
    taskScroll: { flexGrow: 0 },
    taskChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      marginRight: 8,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    taskChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    taskDot: { width: 8, height: 8, borderRadius: 4 },
    taskChipText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
      maxWidth: 140,
    },
    taskChipTextActive: { color: colors.primary },
  });
}
