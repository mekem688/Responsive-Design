import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CAT_LABELS } from "@/constants/config";
import { Task, useApp } from "@/contexts/AppContext";
import { AddTaskModal } from "@/components/AddTaskModal";
import { SubtaskModal } from "@/components/SubtaskModal";
import { TaskCard } from "@/components/TaskCard";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "todo" | "done" | string;

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, tasksLoading, loadTasks } = useApp();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [subtaskTask, setSubtaskTask] = useState<Task | null>(null);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Tout" },
    { key: "todo", label: "À faire" },
    { key: "done", label: "Fait" },
    ...Object.entries(CAT_LABELS).map(([key, label]) => ({ key, label })),
  ];

  const filtered = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      list = list.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter === "todo") list = list.filter((t) => !t.done);
    else if (filter === "done") list = list.filter((t) => t.done);
    else if (filter !== "all") list = list.filter((t) => t.category === filter);
    return list;
  }, [tasks, search, filter]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const s = makeStyles(colors, topPadding);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Mes tâches</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditTask(null); setShowAdd(true); }}>
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <Feather name="search" size={16} color={colors.mutedForeground} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher…"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(f) => f.key}
        style={s.filterList}
        contentContainerStyle={s.filterContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.filterChip, filter === item.key && s.filterChipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text
              style={[
                s.filterChipText,
                filter === item.key && s.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Tasks */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tasksLoading}
            onRefresh={loadTasks}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={(t) => { setEditTask(t); setShowAdd(true); }}
            onTimerPress={(t) => {
              router.push({ pathname: "/(tabs)/timer", params: { taskId: String(t.id) } });
            }}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Feather name="clipboard" size={44} color={colors.border} />
            <Text style={s.emptyTitle}>Aucune tâche</Text>
            <Text style={s.emptyText}>
              {search ? "Aucun résultat pour votre recherche" : "Appuyez sur + pour ajouter une tâche"}
            </Text>
          </View>
        }
      />

      <AddTaskModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        editTask={editTask}
      />

      <SubtaskModal
        visible={subtaskTask !== null}
        task={subtaskTask}
        onClose={() => setSubtaskTask(null)}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPadding: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: topPadding + 16,
      paddingBottom: 12,
    },
    title: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.text },
    addBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    searchIcon: {},
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    filterList: { flexGrow: 0, marginBottom: 10 },
    filterContent: { paddingHorizontal: 16, gap: 8 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.card,
    },
    filterChipActive: { backgroundColor: colors.primary },
    filterChipText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    filterChipTextActive: { color: "#fff" },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === "web" ? 34 : 100,
      paddingTop: 4,
    },
    empty: {
      alignItems: "center",
      paddingVertical: 60,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      paddingHorizontal: 40,
    },
  });
}
