import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BADGES_DEF, CAT_COLORS, QUOTES } from "@/constants/config";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, tasksLoading, loadTasks, streak, sessions, pomoTotal, unlockedBadges, checkBadges } = useApp();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    checkBadges();
  }, [tasks, sessions]);

  const today = new Date().toDateString();
  const todayTasks = useMemo(
    () => tasks.filter((t) => {
      if (t.done) return false;
      return true;
    }),
    [tasks]
  );
  const doneTodayCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);
  const totalTasks = tasks.length;

  const totalStudySeconds = useMemo(
    () => sessions.reduce((a, s) => a + s.duration, 0),
    [sessions]
  );
  const totalHours = (totalStudySeconds / 3600).toFixed(1);

  const catStats = useMemo(() => {
    const acc: Record<string, number> = {};
    sessions.forEach((s) => {
      acc[s.category] = (acc[s.category] ?? 0) + s.duration;
    });
    return Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [sessions]);

  const recentBadges = BADGES_DEF.filter((b) => unlockedBadges.includes(b.id)).slice(-3);

  const topPadding =
    Platform.OS === "web"
      ? 67
      : insets.top;

  const s = makeStyles(colors, topPadding);

  const now = new Date();
  const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const monthNames = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const dateStr = `${dayNames[now.getDay()]} ${now.getDate()} ${monthNames[now.getMonth()]}`;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.container}
      refreshControl={
        <RefreshControl refreshing={tasksLoading} onRefresh={loadTasks} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.dateText}>{dateStr}</Text>
          <Text style={s.greeting}>Tableau de bord</Text>
        </View>
        {streak.count > 0 && (
          <View style={s.streakBadge}>
            <Text style={s.streakIcon}>🔥</Text>
            <Text style={s.streakCount}>{streak.count}</Text>
          </View>
        )}
      </View>

      {/* Quote */}
      <View style={s.quoteCard}>
        <Feather name="bookmark" size={16} color={colors.primary} />
        <Text style={s.quoteText}>"{quote.text}"</Text>
        <Text style={s.quoteAuthor}>— {quote.author}</Text>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { flex: 1 }]}>
          <Text style={s.statValue}>{totalHours}h</Text>
          <Text style={s.statLabel}>Étude totale</Text>
        </View>
        <View style={[s.statCard, { flex: 1 }]}>
          <Text style={s.statValue}>{doneTodayCount}/{totalTasks}</Text>
          <Text style={s.statLabel}>Tâches faites</Text>
        </View>
        <View style={[s.statCard, { flex: 1 }]}>
          <Text style={s.statValue}>{pomoTotal}</Text>
          <Text style={s.statLabel}>Pomodoros</Text>
        </View>
      </View>

      {/* Category progress */}
      {catStats.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Par matière</Text>
          {catStats.map(([cat, secs]) => {
            const pct = totalStudySeconds > 0 ? secs / totalStudySeconds : 0;
            const color = CAT_COLORS[cat] ?? colors.primary;
            const hrs = (secs / 3600).toFixed(1);
            return (
              <View key={cat} style={s.catRow}>
                <View style={[s.catDot, { backgroundColor: color }]} />
                <Text style={s.catLabel} numberOfLines={1}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
                <View style={s.catBarBg}>
                  <View style={[s.catBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
                </View>
                <Text style={s.catHrs}>{hrs}h</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Today's tasks */}
      <View style={s.card}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Tâches à faire</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")}>
            <Text style={s.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {todayTasks.slice(0, 5).map((task) => (
          <View key={String(task.id)} style={s.taskRow}>
            <View
              style={[
                s.taskDot,
                { backgroundColor: CAT_COLORS[task.category] ?? colors.primary },
              ]}
            />
            <Text style={s.taskTitle} numberOfLines={1}>
              {task.title}
            </Text>
            {task.priority === "haute" && (
              <View style={s.urgentTag}>
                <Text style={s.urgentText}>Urgent</Text>
              </View>
            )}
          </View>
        ))}
        {todayTasks.length === 0 && (
          <View style={s.emptyTasks}>
            <Feather name="check-circle" size={28} color={colors.green} />
            <Text style={s.emptyTasksText}>Toutes les tâches sont faites !</Text>
          </View>
        )}
        {todayTasks.length > 5 && (
          <Text style={s.moreText}>+{todayTasks.length - 5} autres…</Text>
        )}
      </View>

      {/* Badges */}
      {recentBadges.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Badges récents</Text>
          <View style={s.badgesRow}>
            {recentBadges.map((b) => (
              <View key={b.id} style={s.badgeItem}>
                <Text style={s.badgeIcon}>{b.icon}</Text>
                <Text style={s.badgeName}>{b.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 90 }} />
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPadding: number) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    container: { padding: 16, paddingTop: topPadding + 16 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    dateText: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    greeting: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.text, marginTop: 2 },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff3e0",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 4,
    },
    streakIcon: { fontSize: 18 },
    streakCount: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#f59e0b" },
    quoteCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      gap: 6,
    },
    quoteText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.primary,
      fontStyle: "italic",
      lineHeight: 20,
    },
    quoteAuthor: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.primary,
      opacity: 0.7,
    },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.text },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "center" },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.text },
    seeAll: { fontSize: 13, color: colors.primary, fontFamily: "Inter_500Medium" },
    catRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    catDot: { width: 8, height: 8, borderRadius: 4 },
    catLabel: { width: 70, fontSize: 12, fontFamily: "Inter_500Medium", color: colors.text },
    catBarBg: { flex: 1, height: 6, backgroundColor: colors.secondary, borderRadius: 3, overflow: "hidden" },
    catBarFill: { height: "100%", borderRadius: 3 },
    catHrs: { width: 32, fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
    taskRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    taskDot: { width: 8, height: 8, borderRadius: 4 },
    taskTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.text },
    urgentTag: { backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    urgentText: { fontSize: 11, color: "#ef4444", fontFamily: "Inter_500Medium" },
    emptyTasks: { alignItems: "center", paddingVertical: 20, gap: 8 },
    emptyTasksText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    moreText: { fontSize: 12, color: colors.mutedForeground, textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" },
    badgesRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
    badgeItem: { alignItems: "center", gap: 4 },
    badgeIcon: { fontSize: 28 },
    badgeName: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
  });
}
