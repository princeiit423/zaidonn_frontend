import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
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

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: clients } = useQuery<any[]>({
    queryKey: ["https://zaidonn.onrender.com/api/clients"],
  });
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["https://zaidonn.onrender.com/api/notifications"],
  });
  const { data: inquiries } = useQuery<any[]>({
    queryKey: ["https://zaidonn.onrender.com/api/inquiries"],
  });
  const { data: documents } = useQuery<any[]>({
    queryKey: ["https://zaidonn.onrender.com/api/documents"],
  });

  const pendingInquiries =
    inquiries?.filter((i: any) => i.status === "pending").length || 0;
  const unreadNotifs = notifications?.filter((n: any) => !n.read).length || 0;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const stats = [
    {
      label: "Total Clients",
      value: clients?.length || 0,
      icon: "people" as const,
      color: "#1565C0",
      bg: "#E3F2FD",
    },
    {
      label: "Documents",
      value: documents?.length || 0,
      icon: "document-text" as const,
      color: "#2E7D32",
      bg: "#E8F5E9",
    },
    {
      label: "Pending Inquiries",
      value: pendingInquiries,
      icon: "mail-unread" as const,
      color: "#E65100",
      bg: "#FFF3E0",
    },
    {
      label: "Notifications",
      value: unreadNotifs,
      icon: "notifications" as const,
      color: "#6A1B9A",
      bg: "#F3E5F5",
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.gradientStart, Colors.light.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.userName}>ZAIDONN Portal</Text>
          </View>
          <Pressable onPress={handleLogout} hitSlop={8}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Quick Actions
        </Text>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/(admin)/clients" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="person-add-outline" size={22} color="#1565C0" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Manage Clients</Text>
              <Text style={styles.actionSub}>Add, edit, or remove clients</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.light.textLight}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/(admin)/documents" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="cloud-upload-outline" size={22} color="#2E7D32" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Upload Documents</Text>
              <Text style={styles.actionSub}>Upload files for clients</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.light.textLight}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/(admin)/inquiries" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="chatbubbles-outline" size={22} color="#E65100" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Client Inquiries</Text>
              <Text style={styles.actionSub}>
                {pendingInquiries} pending responses
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.light.textLight}
            />
          </Pressable>
        </View>

        {inquiries && inquiries.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Recent Inquiries
            </Text>
            {inquiries.slice(0, 3).map((inq: any) => (
              <View key={inq._id} style={styles.recentCard}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentName}>{inq.clientName}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          inq.status === "responded" ? "#E8F5E9" : "#FFF3E0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            inq.status === "responded" ? "#2E7D32" : "#E65100",
                        },
                      ]}
                    >
                      {inq.status === "responded" ? "Replied" : "Pending"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentSubject}>{inq.subject}</Text>
                <Text style={styles.recentDate}>
                  {new Date(inq.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  content: { flex: 1 },
  contentInner: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "48%",
    flexBasis: "47%",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  actions: { gap: 10 },
  actionCard: {
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
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  actionText: { flex: 1 },
  actionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  actionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  recentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  recentName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  recentSubject: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  recentDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textLight,
    marginTop: 4,
  },
});
