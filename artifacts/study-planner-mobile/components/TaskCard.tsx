import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CAT_COLORS, CAT_LABELS, PRIO_COLORS, PRIO_LABELS } from "@/constants/config";
import { useColors } from "@/hooks/useColors";
import { Task, useApp } from "@/contexts/AppContext";

interface Props {
  task: Task;
  onPress?: (task: Task) => void;
  onTimerPress?: (task: Task) => void;
}

export function TaskCard({ task, onPress, onTimerPress }: Props) {
  const colors = useColors();
  const { toggleTask, deleteTask } = useApp();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const catColor = CAT_COLORS[task.category] ?? colors.primary;

  async function handleToggle() {
    setToggling(true);
    try {
      await toggleTask(task.id, !task.done);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleting(true);
    try {
      await deleteTask(task.id);
    } finally {
      setDeleting(false);
    }
  }

  const styles = makeStyles(colors, catColor, task.done);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(task)}
      activeOpacity={0.85}
    >
      <View style={styles.leftBar} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={handleToggle}
            disabled={toggling}
          >
            {toggling ? (
              <ActivityIndicator size="small" color={catColor} />
            ) : task.done ? (
              <Feather name="check-circle" size={22} color={catColor} />
            ) : (
              <Feather name="circle" size={22} color={colors.border} />
            )}
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {task.title}
            </Text>
            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: catColor + "22" }]}>
                <Text style={[styles.tagText, { color: catColor }]}>
                  {CAT_LABELS[task.category] ?? task.category}
                </Text>
              </View>
              {task.priority && (
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor:
                        (PRIO_COLORS[task.priority] ?? colors.muted) + "22",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: PRIO_COLORS[task.priority] ?? colors.mutedForeground },
                    ]}
                  >
                    {PRIO_LABELS[task.priority] ?? task.priority}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onTimerPress?.(task)}
            >
              <Feather name="clock" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Feather name="trash-2" size={18} color={colors.destructive} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {(task.start_time || task.end_time) && (
          <View style={styles.timeRow}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={styles.timeText}>
              {task.start_time?.slice(0, 5)}
              {task.start_time && task.end_time ? " – " : ""}
              {task.end_time?.slice(0, 5)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, catColor: string, done: boolean) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 14,
      marginBottom: 10,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
      opacity: done ? 0.65 : 1,
    },
    leftBar: {
      width: 4,
      backgroundColor: catColor,
    },
    content: {
      flex: 1,
      padding: 14,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    checkbox: {
      marginTop: 1,
      width: 24,
      alignItems: "center",
    },
    titleBlock: {
      flex: 1,
      gap: 6,
    },
    title: {
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: colors.text,
      textDecorationLine: done ? "line-through" : "none",
    },
    tags: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    tagText: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
    },
    actions: {
      flexDirection: "row",
      gap: 4,
    },
    actionBtn: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    timeText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
  });
}
