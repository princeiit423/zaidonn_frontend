import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../constants/colors";
import { useAuth } from "../lib/auth-context";

type LoginMode = "select" | "admin" | "client";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<LoginMode>("select");

  React.useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      if (isAdmin) {
        router.replace("/(admin)");
      } else {
        router.replace("/(client)");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading]);

  if (authLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: Colors.light.primary },
        ]}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (isAuthenticated) return null;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      //console.log("🔥 Calling AuthContext login");

      await login(username.trim(), password.trim());

      //console.log("✅ Login Success");

      // Navigation automatically ho jayega
      // kyunki useEffect isAuthenticated detect karega
    } catch (err: any) {
      //console.log("Login error:", err?.message);

      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };
  const handleBack = () => {
    setMode("select");
    setUsername("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.gradientStart, Colors.light.gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View
          style={[
            styles.headerContent,
            { paddingTop: insets.top + webTopInset + 40 },
          ]}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.brandName}>ZAIDONN</Text>
          <Text style={styles.tagline}>
            Trusted Taxation Consultants & Advisors
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === "select" ? (
            <View style={styles.formCard}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.subtitleText}>
                Choose how you would like to sign in
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.roleCard,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => setMode("admin")}
              >
                <View
                  style={[styles.roleIconWrap, { backgroundColor: "#FFF3E0" }]}
                >
                  <Ionicons name="shield-outline" size={28} color="#E65100" />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>Admin Login</Text>
                  <Text style={styles.roleDesc}>
                    For tax consultants & administrators
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.light.textLight}
                />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.roleCard,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => setMode("client")}
              >
                <View
                  style={[styles.roleIconWrap, { backgroundColor: "#E3F2FD" }]}
                >
                  <Ionicons name="person-outline" size={28} color="#1565C0" />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>Client Login</Text>
                  <Text style={styles.roleDesc}>
                    For registered business clients
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.light.textLight}
                />
              </Pressable>
            </View>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <Pressable
                  onPress={handleBack}
                  hitSlop={8}
                  style={styles.backBtn}
                >
                  <Ionicons
                    name="arrow-back"
                    size={22}
                    color={Colors.light.text}
                  />
                </Pressable>
                <View style={styles.formHeaderText}>
                  <Text style={styles.welcomeText}>
                    {mode === "admin" ? "Admin Login" : "Client Login"}
                  </Text>
                  <Text style={styles.subtitleText}>
                    {mode === "admin"
                      ? "Sign in with your admin credentials"
                      : "Sign in with your client credentials"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.modeBadge,
                  { backgroundColor: mode === "admin" ? "#FFF3E0" : "#E3F2FD" },
                ]}
              >
                <Ionicons
                  name={mode === "admin" ? "shield-outline" : "person-outline"}
                  size={16}
                  color={mode === "admin" ? "#E65100" : "#1565C0"}
                />
                <Text
                  style={[
                    styles.modeBadgeText,
                    { color: mode === "admin" ? "#E65100" : "#1565C0" },
                  ]}
                >
                  {mode === "admin" ? "Administrator" : "Client"}
                </Text>
              </View>

              {!!error && (
                <View style={styles.errorBanner}>
                  <Ionicons
                    name="alert-circle"
                    size={18}
                    color={Colors.light.error}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.light.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor={Colors.light.textLight}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={Colors.light.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.light.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Colors.light.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </Pressable>
            </View>
          )}

          <View
            style={[
              styles.footer,
              {
                paddingBottom:
                  insets.bottom + (Platform.OS === "web" ? 34 : 16),
              },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={14}
              color={Colors.light.textLight}
            />
            <Text style={styles.footerText}>Secured by ZAIDONN Portal</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerGradient: {
    paddingBottom: 50,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  brandName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    textAlign: "center",
  },
  formWrapper: {
    flex: 1,
    marginTop: -30,
  },
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  formHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  formHeaderText: {
    flex: 1,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  modeBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  roleDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 24,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textLight,
  },
});
