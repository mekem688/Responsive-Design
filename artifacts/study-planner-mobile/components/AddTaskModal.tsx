import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CAT_LABELS, PRIO_LABELS } from "@/constants/config";
import { Task, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  editTask?: Task | null;
}

const CATEGORIES = Object.entries(CAT_LABELS);
const PRIORITIES = Object.entries(PRIO_LABELS);

export function AddTaskModal({ visible, onClose, editTask }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createTask, updateTask } = useApp();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("etude");
  const [priority, setPriority] = useState("normale");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      if (editTask) {
        setTitle(editTask.title);
        setCategory(editTask.category);
        setPriority(editTask.priority);
        setStartTime(editTask.start_time?.slice(0, 5) ?? "");
        setEndTime(editTask.end_time?.slice(0, 5) ?? "");
      } else {
        setTitle("");
        setCategory("etude");
        setPriority("normale");
        setStartTime("");
        setEndTime("");
      }
      setError("");
    }
  }, [visible, editTask]);

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data: Partial<Task> = {
        title: title.trim(),
        category,
        priority,
        start_time: startTime || null,
        end_time: endTime || null,
      };
      if (editTask) {
        await updateTask(editTask.id, data);
      } else {
        await createTask(data);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const s = makeStyles(colors, insets);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.sheet}
      >
        <View style={s.handle} />
        <View style={s.header}>
          <Text style={s.title}>
            {editTask ? "Modifier la tâche" : "Nouvelle tâche"}
          </Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.label}>Titre *</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Révision chapitre 3"
            placeholderTextColor={colors.mutedForeground}
            multiline
          />

          <Text style={s.label}>Catégorie</Text>
          <View style={s.chips}>
            {CATEGORIES.map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[s.chip, category === key && s.chipActive]}
                onPress={() => setCategory(key)}
              >
                <Text
                  style={[
                    s.chipText,
                    category === key && s.chipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Priorité</Text>
          <View style={s.chips}>
            {PRIORITIES.map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[s.chip, priority === key && s.chipActive]}
                onPress={() => setPriority(key)}
              >
                <Text
                  style={[
                    s.chipText,
                    priority === key && s.chipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.row}>
            <View style={s.halfField}>
              <Text style={s.label}>Début (HH:MM)</Text>
              <TextInput
                style={s.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <View style={s.halfField}>
              <Text style={s.label}>Fin (HH:MM)</Text>
              <TextInput
                style={s.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="10:00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitText}>
                {editTask ? "Enregistrer" : "Ajouter"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
      paddingBottom: Math.max(insets.bottom, 20),
      maxHeight: "85%",
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
    title: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: colors.secondary,
    },
    body: {
      padding: 20,
    },
    label: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      marginBottom: 8,
      marginTop: 4,
    },
    input: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.text,
      marginBottom: 16,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.secondary,
    },
    chipActive: {
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    chipTextActive: {
      color: "#fff",
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    halfField: {
      flex: 1,
    },
    error: {
      color: colors.destructive,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
      textAlign: "center",
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
