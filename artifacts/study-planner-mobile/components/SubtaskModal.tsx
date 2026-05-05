import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubTask, Task, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}

export function SubtaskModal({ visible, task, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getSubtasks, saveSubtasks } = useApp();
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    if (visible && task) {
      setSubtasks(getSubtasks(task.id));
      setNewText("");
    }
  }, [visible, task, getSubtasks]);

  function addSubtask() {
    if (!newText.trim() || !task) return;
    const next: SubTask[] = [
      ...subtasks,
      {
        id: Date.now().toString(),
        text: newText.trim(),
        done: false,
      },
    ];
    setSubtasks(next);
    saveSubtasks(task.id, next);
    setNewText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function toggleSubtask(id: string) {
    if (!task) return;
    const next = subtasks.map((s) =>
      s.id === id ? { ...s, done: !s.done } : s
    );
    setSubtasks(next);
    saveSubtasks(task.id, next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function deleteSubtask(id: string) {
    if (!task) return;
    const next = subtasks.filter((s) => s.id !== id);
    setSubtasks(next);
    saveSubtasks(task.id, next);
  }

  const done = subtasks.filter((s) => s.done).length;
  const progress = subtasks.length > 0 ? done / subtasks.length : 0;

  const s = makeStyles(colors, insets);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.header}>
          <View style={s.titleBlock}>
            <Text style={s.title} numberOfLines={1}>
              {task?.title ?? ""}
            </Text>
            {subtasks.length > 0 && (
              <Text style={s.subtitle}>
                {done}/{subtasks.length} sous-tâches
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {subtasks.length > 0 && (
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
        )}

        <FlatList
          data={subtasks}
          keyExtractor={(item) => item.id}
          style={s.list}
          renderItem={({ item }) => (
            <View style={s.subtaskRow}>
              <TouchableOpacity
                onPress={() => toggleSubtask(item.id)}
                style={s.checkBtn}
              >
                <Feather
                  name={item.done ? "check-circle" : "circle"}
                  size={20}
                  color={item.done ? colors.green : colors.border}
                />
              </TouchableOpacity>
              <Text
                style={[
                  s.subtaskText,
                  item.done && s.subtaskDone,
                ]}
                numberOfLines={2}
              >
                {item.text}
              </Text>
              <TouchableOpacity
                onPress={() => deleteSubtask(item.id)}
                style={s.delBtn}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="list" size={32} color={colors.border} />
              <Text style={s.emptyText}>Aucune sous-tâche</Text>
            </View>
          }
        />

        <View style={s.addRow}>
          <TextInput
            style={s.addInput}
            value={newText}
            onChangeText={setNewText}
            placeholder="Ajouter une sous-tâche…"
            placeholderTextColor={colors.mutedForeground}
            onSubmitEditing={addSubtask}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[s.addBtn, !newText.trim() && s.addBtnDisabled]}
            onPress={addSubtask}
            disabled={!newText.trim()}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ height: Math.max(insets.bottom, 16) }} />
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: { bottom: number }) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "75%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 4,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleBlock: { flex: 1, marginRight: 10 },
    title: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: colors.secondary,
    },
    progressBar: {
      height: 3,
      backgroundColor: colors.border,
      marginHorizontal: 20,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.green,
      borderRadius: 2,
    },
    list: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    subtaskRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    checkBtn: { width: 28, alignItems: "center" },
    subtaskText: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    subtaskDone: {
      color: colors.mutedForeground,
      textDecorationLine: "line-through",
    },
    delBtn: { width: 28, alignItems: "center" },
    empty: {
      alignItems: "center",
      paddingVertical: 32,
      gap: 8,
    },
    emptyText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
    },
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    addInput: {
      flex: 1,
      backgroundColor: colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    addBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtnDisabled: { opacity: 0.4 },
  });
}
