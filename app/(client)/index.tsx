import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../constants/colors";
import { useAuth } from "../../lib/auth-context";

const modules = [
  {
    key: "GST",
    title: "GST",
    subtitle: "Goods & Services Tax",
    icon: "receipt-outline" as const,
    iconSet: "ionicons" as const,
    color: "#1565C0",
    bgColor: "#E3F2FD",
  },
  {
    key: "ITR",
    title: "ITR",
    subtitle: "Income Tax Returns",
    icon: "calculator-outline" as const,
    iconSet: "ionicons" as const,
    color: "#2E7D32",
    bgColor: "#E8F5E9",
  },
  {
    key: "LICENCE",
    title: "Licence",
    subtitle: "Certifications & Permits",
    icon: "ribbon-outline" as const,
    iconSet: "ionicons" as const,
    color: "#E65100",
    bgColor: "#FFF3E0",
  },
  {
    key: "ACCOUNTS",
    title: "Accounts",
    subtitle: "Financial Statements",
    icon: "bar-chart-outline" as const,
    iconSet: "ionicons" as const,
    color: "#6A1B9A",
    bgColor: "#F3E5F5",
  },
];

export default function ClientDashboard() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["https://zaidonn.onrender.com/api/notifications"],
  });
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  const handleModulePress = (moduleKey: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(client)/documents?category=${moduleKey}` as any);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.gradientStart, Colors.light.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || "User"}</Text>

              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.premiumText}>Premium client</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/(client)/notifications" as any)}
              hitSlop={8}
            >
              <View>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable onPress={handleLogout} hitSlop={8}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
        {user?.businessName && (
          <View style={styles.businessTag}>
            <Ionicons
              name="business-outline"
              size={14}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.businessName}>{user.businessName}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Tax Modules</Text>
        <Text style={styles.sectionSubtitle}>
          Select a module to view your documents
        </Text>

        <View style={styles.modulesGrid}>
          {modules.map((mod) => (
            <Pressable
              key={mod.key}
              style={({ pressed }) => [
                styles.moduleCard,
                pressed && styles.moduleCardPressed,
              ]}
              onPress={() => handleModulePress(mod.key)}
            >
              <View
                style={[
                  styles.moduleIconContainer,
                  { backgroundColor: mod.bgColor },
                ]}
              >
                <Ionicons name={mod.icon} size={28} color={mod.color} />
              </View>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
              <View style={styles.moduleArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.light.textLight}
                />
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [
              styles.quickAction,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/(client)/contact" as any)}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#E8F5E9" }]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color="#2E7D32"
              />
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>Submit Inquiry</Text>
              <Text style={styles.quickActionSub}>Ask your consultant</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.light.textLight}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.quickAction,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/(client)/documents" as any)}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#E3F2FD" }]}
            >
              <Ionicons name="folder-open-outline" size={22} color="#1565C0" />
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>All Documents</Text>
              <Text style={styles.quickActionSub}>View uploaded files</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.light.textLight}
            />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff8400",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },

  premiumText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginLeft: 4,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  userName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  businessTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  businessName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  moduleCard: {
    width: "48%",
    flexBasis: "47%",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  moduleCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  moduleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  moduleSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  moduleArrow: {
    position: "absolute",
    top: 18,
    right: 16,
  },
  quickActions: {
    gap: 10,
    marginTop: 12,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  quickActionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
