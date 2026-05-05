import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BADGES_DEF, CAT_COLORS, CAT_LABELS } from "@/constants/config";
import { Session, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

function formatDuration(secs: number) {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}min`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, clearSessions, streak, pomoTotal, unlockedBadges, tasks } = useApp();

  const totalSeconds = useMemo(
    () => sessions.reduce((a, s) => a + s.duration, 0),
    [sessions]
  );

  const weekData = useMemo(() => {
    const days: { label: string; secs: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStr = d.toDateString();
      const secs = sessions
        .filter((s) => new Date(s.date).toDateString() === dayStr)
        .reduce((a, s) => a + s.duration, 0);
      const dayNames = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
      days.push({ label: dayNames[d.getDay()], secs });
    }
    return days;
  }, [sessions]);

  const maxWeekSecs = Math.max(...weekData.map((d) => d.secs), 1);

  const catStats = useMemo(() => {
    const acc: Record<string, number> = {};
    sessions.forEach((s) => {
      acc[s.category] = (acc[s.category] ?? 0) + s.duration;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const doneTasks = tasks.filter((t) => t.done).length;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const s = makeStyles(colors, topPadding);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Text style={s.title}>Statistiques</Text>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={clearSessions}>
            <Text style={s.clearBtn}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Summary cards */}
      <View style={s.statsGrid}>
        <View style={s.statCard}>
          <Feather name="clock" size={20} color={colors.primary} />
          <Text style={s.statValue}>{formatDuration(totalSeconds)}</Text>
          <Text style={s.statLabel}>Temps total</Text>
        </View>
        <View style={s.statCard}>
          <Feather name="activity" size={20} color={colors.green} />
          <Text style={s.statValue}>{sessions.length}</Text>
          <Text style={s.statLabel}>Sessions</Text>
        </View>
        <View style={s.statCard}>
          <Text style={{ fontSize: 20 }}>🔥</Text>
          <Text style={s.statValue}>{streak.count}</Text>
          <Text style={s.statLabel}>Streak</Text>
        </View>
        <View style={s.statCard}>
          <Text style={{ fontSize: 20 }}>🍅</Text>
          <Text style={s.statValue}>{pomoTotal}</Text>
          <Text style={s.statLabel}>Pomodoros</Text>
        </View>
        <View style={s.statCard}>
          <Feather name="check-circle" size={20} color={colors.orange} />
          <Text style={s.statValue}>{doneTasks}</Text>
          <Text style={s.statLabel}>Tâches faites</Text>
        </View>
        <View style={s.statCard}>
          <Feather name="award" size={20} color={colors.purple} />
          <Text style={s.statValue}>{unlockedBadges.length}</Text>
          <Text style={s.statLabel}>Badges</Text>
        </View>
      </View>

      {/* Weekly chart */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Cette semaine</Text>
        <View style={s.weekChart}>
          {weekData.map((day, i) => {
            const heightPct = day.secs / maxWeekSecs;
            const isToday = i === 6;
            return (
              <View key={i} style={s.weekBarCol}>
                <Text style={s.weekBarVal}>
                  {day.secs > 0 ? formatDuration(day.secs) : ""}
                </Text>
                <View style={s.weekBarBg}>
                  <View
                    style={[
                      s.weekBarFill,
                      {
                        height: `${Math.max(heightPct * 100, day.secs > 0 ? 5 : 0)}%` as any,
                        backgroundColor: isToday ? colors.primary : colors.primaryLight,
                      },
                    ]}
                  />
                </View>
                <Text style={[s.weekBarLabel, isToday && { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {day.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Categories */}
      {catStats.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Par matière</Text>
          {catStats.map(([cat, secs]) => {
            const pct = totalSeconds > 0 ? secs / totalSeconds : 0;
            const color = CAT_COLORS[cat] ?? colors.primary;
            return (
              <View key={cat} style={s.catRow}>
                <View style={[s.catDot, { backgroundColor: color }]} />
                <Text style={s.catName}>
                  {CAT_LABELS[cat] ?? cat}
                </Text>
                <View style={s.catBarBg}>
                  <View
                    style={[
                      s.catBarFill,
                      { width: `${pct * 100}%` as any, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={s.catTime}>{formatDuration(secs)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Badges */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Badges</Text>
        <View style={s.badgesGrid}>
          {BADGES_DEF.map((badge) => {
            const unlocked = unlockedBadges.includes(badge.id);
            return (
              <View
                key={badge.id}
                style={[s.badgeCard, !unlocked && s.badgeCardLocked]}
              >
                <Text style={[s.badgeIcon, !unlocked && s.badgeIconLocked]}>
                  {badge.icon}
                </Text>
                <Text style={[s.badgeName, !unlocked && s.badgeNameLocked]}>
                  {badge.name}
                </Text>
                <Text style={s.badgeDesc} numberOfLines={2}>
                  {badge.desc}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Sessions récentes</Text>
          {sessions.slice(0, 10).map((session: Session) => {
            const color = CAT_COLORS[session.category] ?? colors.primary;
            return (
              <View key={session.id} style={s.sessionRow}>
                <View style={[s.sessionDot, { backgroundColor: color }]} />
                <View style={s.sessionInfo}>
                  <Text style={s.sessionTitle} numberOfLines={1}>
                    {session.taskTitle}
                  </Text>
                  <Text style={s.sessionDate}>{formatDate(session.date)}</Text>
                </View>
                <View style={s.sessionRight}>
                  <Text style={[s.sessionDuration, { color }]}>
                    {formatDuration(session.duration)}
                  </Text>
                  {session.type === "pomodoro" && (
                    <Text style={s.sessionType}>🍅</Text>
                  )}
                </View>
              </View>
            );
          })}
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
    title: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.text },
    clearBtn: { fontSize: 14, color: colors.destructive, fontFamily: "Inter_500Medium" },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      width: "30%",
      flexGrow: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      gap: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    statValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.text },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
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
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.text, marginBottom: 14 },
    weekChart: {
      flexDirection: "row",
      height: 120,
      alignItems: "flex-end",
      gap: 4,
    },
    weekBarCol: { flex: 1, alignItems: "center", gap: 4 },
    weekBarVal: { fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", height: 14 },
    weekBarBg: { flex: 1, width: "100%", backgroundColor: colors.secondary, borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
    weekBarFill: { width: "100%", borderRadius: 4 },
    weekBarLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    catRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    catDot: { width: 8, height: 8, borderRadius: 4 },
    catName: { width: 80, fontSize: 12, fontFamily: "Inter_500Medium", color: colors.text },
    catBarBg: { flex: 1, height: 6, backgroundColor: colors.secondary, borderRadius: 3, overflow: "hidden" },
    catBarFill: { height: "100%", borderRadius: 3 },
    catTime: { width: 40, fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
    badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    badgeCard: {
      width: "30%",
      flexGrow: 1,
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      gap: 4,
    },
    badgeCardLocked: { backgroundColor: colors.secondary, opacity: 0.5 },
    badgeIcon: { fontSize: 26 },
    badgeIconLocked: { opacity: 0.4 },
    badgeName: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.primary, textAlign: "center" },
    badgeNameLocked: { color: colors.mutedForeground },
    badgeDesc: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
    sessionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    sessionDot: { width: 8, height: 8, borderRadius: 4 },
    sessionInfo: { flex: 1 },
    sessionTitle: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.text },
    sessionDate: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    sessionRight: { alignItems: "flex-end", gap: 2 },
    sessionDuration: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    sessionType: { fontSize: 14 },
  });
}
