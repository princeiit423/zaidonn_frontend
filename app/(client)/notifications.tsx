import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../constants/colors";
import { apiRequest, queryClient } from "../../lib/query-client";

const getNotifIcon = (type: string) => {
  switch (type) {
    case "document":
      return {
        name: "document-text" as const,
        color: "#1565C0",
        bg: "#E3F2FD",
      };
    case "inquiry":
      return {
        name: "chatbubble-ellipses" as const,
        color: "#2E7D32",
        bg: "#E8F5E9",
      };
    case "deadline":
      return { name: "alarm" as const, color: "#E65100", bg: "#FFF3E0" };
    case "approval":
      return {
        name: "checkmark-circle" as const,
        color: "#2E7D32",
        bg: "#E8F5E9",
      };
    default:
      return {
        name: "information-circle" as const,
        color: "#1565C0",
        bg: "#E3F2FD",
      };
  }
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const {
    data: notifications,
    isLoading,
    refetch,
  } = useQuery<any[]>({
    queryKey: ["https://zaidonn.onrender.com/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(
        "PUT",
        `https://zaidonn.onrender.com/api/notifications/${id}/read`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["https://zaidonn.onrender.com/api/notifications"],
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(
        "PUT",
        "https://zaidonn.onrender.com/api/notifications/read-all",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["https://zaidonn.onrender.com/api/notifications"],
      });
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  const renderNotification = ({ item }: { item: any }) => {
    const icon = getNotifIcon(item.type);
    return (
      <Pressable
        style={[styles.notifCard, !item.read && styles.notifUnread]}
        onPress={() => {
          if (!item.read) markReadMutation.mutate(item._id);
        }}
      >
        <View style={[styles.notifIconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text
              style={[styles.notifTitle, !item.read && styles.notifTitleBold]}
            >
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMsg} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notifTime}>
            {new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </Text>
          </View>
          {unreadCount > 0 && (
            <Pressable
              style={styles.markAllBtn}
              onPress={() => markAllReadMutation.mutate()}
            >
              <Ionicons
                name="checkmark-done"
                size={18}
                color={Colors.light.primary}
              />
              <Text style={styles.markAllText}>Read All</Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={notifications || []}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} />
        }
        scrollEnabled={!!notifications?.length}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={Colors.light.textLight}
              />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                You are all caught up. Check back later.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E3F2FD",
  },
  markAllText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  notifUnread: {
    backgroundColor: "#F0F7FF",
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    flex: 1,
  },
  notifTitleBold: {
    fontFamily: "Inter_700Bold",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  notifMsg: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textLight,
    marginTop: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
