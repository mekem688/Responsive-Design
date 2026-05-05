import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, signup } = useApp();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError("Email et mot de passe requis");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const s = makeStyles(colors, topPad, insets.bottom);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logo}>
            <Feather name="book-open" size={36} color="#fff" />
          </View>
          <Text style={s.appName}>Programme d'étude</Text>
          <Text style={s.tagline}>Organisez votre apprentissage</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          {/* Toggle */}
          <View style={s.toggle}>
            <TouchableOpacity
              style={[s.toggleBtn, isLogin && s.toggleBtnActive]}
              onPress={() => { setIsLogin(true); setError(""); }}
            >
              <Text style={[s.toggleText, isLogin && s.toggleTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, !isLogin && s.toggleBtnActive]}
              onPress={() => { setIsLogin(false); setError(""); }}
            >
              <Text style={[s.toggleText, !isLogin && s.toggleTextActive]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Email</Text>
          <View style={s.inputWrap}>
            <Feather name="mail" size={16} color={colors.mutedForeground} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={s.label}>Mot de passe</Text>
          <View style={s.inputWrap}>
            <Feather name="lock" size={16} color={colors.mutedForeground} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={s.eyeBtn}>
              <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitText}>
                {isLogin ? "Se connecter" : "Créer un compte"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    container: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
      paddingTop: topPad + 40,
      paddingBottom: Math.max(bottomPad, 24) + 40,
    },
    logoWrap: { alignItems: "center", marginBottom: 32 },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    appName: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      marginBottom: 4,
    },
    tagline: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 4,
    },
    toggle: {
      flexDirection: "row",
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: "center",
    },
    toggleBtnActive: { backgroundColor: colors.primary },
    toggleText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    toggleTextActive: { color: "#fff" },
    label: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.secondary,
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 14,
    },
    inputIcon: { marginRight: 8 },
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.text,
      paddingVertical: 14,
    },
    eyeBtn: { padding: 4 },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.redLight,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 4,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
