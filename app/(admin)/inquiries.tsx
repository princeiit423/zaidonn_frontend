import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "../../lib/query-client";

/**
 * HOW getQueryFn BUILDS THE URL:
 *   new URL(queryKey.join("/"), "http://192.168.29.200:5000/")
 *
 * So queryKey must be a path relative to base, NOT a full URL.
 *
 * queryKey: ["api/inquiries"]
 *   → url = new URL("api/inquiries", "http://192.168.29.200:5000/")
 *   → "http://192.168.29.200:5000/api/inquiries"  ✅
 *
 * queryKey: ["http://192.168.29.200:5000/api/inquiries"]  ← OLD BROKEN WAY
 *   → new URL("http://...", base) ignores base, uses absolute URL as-is
 *   → Works sometimes but breaks token injection & cache invalidation
 */

type FilterType = "all" | "pending" | "responded";

const QUERY_KEY = ["api/inquiries"] as const;

export default function InquiriesScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const qc = useQueryClient();

  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // ─── Fetch ────────────────────────────────────────────────────────────────
  // getQueryFn (default queryFn on queryClient) reads token from AsyncStorage
  // and builds: http://192.168.29.200:5000/api/inquiries
  const {
    data: inquiries,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<any[]>({
    queryKey: QUERY_KEY,
    // No queryFn needed — uses default getQueryFn from queryClient config
  });

  // ─── Respond mutation ─────────────────────────────────────────────────────
  // apiRequest also reads token from AsyncStorage automatically
  const respondMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "PUT",
        `api/inquiries/${selectedInquiry._id}/respond`,
        { response },
      );
      return res.json();
    },
    onSuccess: () => {
      // Invalidate using the same key so the list refreshes
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      setSelectedInquiry(null);
      setResponse("");
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () =>
      Alert.alert("Error", "Failed to send response. Please try again."),
  });

  // ─── Derived ──────────────────────────────────────────────────────────────
  const filtered = (inquiries ?? []).filter((i: any) =>
    filter === "all" ? true : i.status === filter,
  );
  const pendingCount = (inquiries ?? []).filter(
    (i: any) => i.status === "pending",
  ).length;
  const respondedCount = (inquiries ?? []).filter(
    (i: any) => i.status === "responded",
  ).length;

  const FILTERS: { key: FilterType; label: string; color: string }[] = [
    { key: "all", label: "All", color: "#4F46E5" },
    { key: "pending", label: "Pending", color: "#D97706" },
    { key: "responded", label: "Responded", color: "#059669" },
  ];

  // ─── Card ─────────────────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: any }) => {
    const isPending = item.status === "pending";
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          isPending && styles.cardPending,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
        onPress={() => {
          if (isPending) {
            setSelectedInquiry(item);
            setResponse("");
          }
        }}
      >
        {/* Top row: avatar + name + badge */}
        <View style={styles.cardTop}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isPending ? "#D97706" : "#059669" },
            ]}
          >
            <Text style={styles.avatarTxt}>
              {item.clientName?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{item.clientName}</Text>
            <Text style={styles.cardDate}>
              {new Date(item.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: isPending ? "#FFF3E0" : "#E8F5E9" },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: isPending ? "#D97706" : "#059669" },
              ]}
            />
            <Text
              style={[
                styles.badgeTxt,
                { color: isPending ? "#D97706" : "#059669" },
              ]}
            >
              {isPending ? "Pending" : "Replied"}
            </Text>
          </View>
        </View>

        {/* Subject */}
        <Text style={styles.cardSubject}>{item.subject}</Text>

        {/* Message preview */}
        <Text style={styles.cardMsg} numberOfLines={2}>
          {item.message}
        </Text>

        {/* Admin reply preview */}
        {item.adminResponse ? (
          <View style={styles.replyBox}>
            <Ionicons name="chatbubble-ellipses" size={13} color="#4F46E5" />
            <Text style={styles.replyBoxTxt} numberOfLines={1}>
              {item.adminResponse}
            </Text>
          </View>
        ) : null}

        {/* Tap-to-reply hint */}
        {isPending ? (
          <View style={styles.tapHint}>
            <Ionicons name="arrow-forward-circle" size={15} color="#D97706" />
            <Text style={styles.tapHintTxt}>Tap to respond</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  // ═════════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View
        style={[styles.header, { paddingTop: insets.top + webTopInset + 14 }]}
      >
        <Text style={styles.headerTitle}>Client Inquiries</Text>
        <Text style={styles.headerSub}>
          Manage and respond to client messages
        </Text>

        {/* Stat pills */}
        <View style={styles.statsRow}>
          <View style={[styles.statPill, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="time-outline" size={14} color="#D97706" />
            <Text style={[styles.statTxt, { color: "#D97706" }]}>
              {pendingCount} Pending
            </Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: "#E8F5E9" }]}>
            <Ionicons
              name="checkmark-circle-outline"
              size={14}
              color="#059669"
            />
            <Text style={[styles.statTxt, { color: "#059669" }]}>
              {respondedCount} Replied
            </Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="layers-outline" size={14} color="#4F46E5" />
            <Text style={[styles.statTxt, { color: "#4F46E5" }]}>
              {inquiries?.length ?? 0} Total
            </Text>
          </View>
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.chip,
                filter === f.key && {
                  backgroundColor: f.color,
                  borderColor: f.color,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[styles.chipTxt, filter === f.key && { color: "#fff" }]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.listPad, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#4F46E5"
          />
        }
        renderItem={renderCard}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.centerTxt}>Loading inquiries…</Text>
            </View>
          ) : (
            <View style={styles.centerState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={40}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>No Inquiries</Text>
              <Text style={styles.emptySub}>
                {filter === "all"
                  ? "Client inquiries will appear here"
                  : `No ${filter} inquiries found`}
              </Text>
            </View>
          )
        }
      />

      {/* ── Respond Modal ── */}
      <Modal
        visible={!!selectedInquiry}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedInquiry(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Modal header */}
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Respond to Inquiry</Text>
              <Pressable
                style={styles.closeBtn}
                onPress={() => setSelectedInquiry(null)}
                hitSlop={10}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {selectedInquiry ? (
                <View style={styles.sheetBody}>
                  {/* Client info */}
                  <View style={styles.clientRow}>
                    <View style={styles.avatarLg}>
                      <Text style={styles.avatarLgTxt}>
                        {selectedInquiry.clientName?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName}>
                        {selectedInquiry.clientName}
                      </Text>
                      <Text style={styles.clientDate}>
                        {new Date(selectedInquiry.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* Inquiry content */}
                  <View style={styles.inqBox}>
                    <Text style={styles.inqSubject}>
                      {selectedInquiry.subject}
                    </Text>
                    <View style={styles.inqDivider} />
                    <Text style={styles.inqMsg}>{selectedInquiry.message}</Text>
                  </View>

                  {/* Response input */}
                  <Text style={styles.inputLbl}>Your Response</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Type your response here…"
                    placeholderTextColor="#94A3B8"
                    value={response}
                    onChangeText={setResponse}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />

                  {/* Send button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.sendBtn,
                      (pressed || respondMutation.isPending) && {
                        opacity: 0.85,
                      },
                    ]}
                    onPress={() => {
                      if (!response.trim()) {
                        Alert.alert("Required", "Please enter a response.");
                        return;
                      }
                      respondMutation.mutate();
                    }}
                    disabled={respondMutation.isPending}
                  >
                    {respondMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#fff" />
                        <Text style={styles.sendBtnTxt}>Send Response</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#1E293B" },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 3,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  // Filters
  filterRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  chipTxt: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#64748B" },

  // List
  listPad: { padding: 16, gap: 12 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPending: { borderLeftWidth: 4, borderLeftColor: "#D97706" },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1E293B" },
  cardDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    marginTop: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardSubject: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1E293B",
    marginBottom: 6,
  },
  cardMsg: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    lineHeight: 19,
  },
  replyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    padding: 10,
  },
  replyBoxTxt: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4F46E5",
    flex: 1,
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  tapHintTxt: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#D97706" },

  // Empty / loading
  centerState: { alignItems: "center", paddingVertical: 80, gap: 12 },
  centerTxt: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B" },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    textAlign: "center",
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1E293B" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetBody: { padding: 20, gap: 16 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarLg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLgTxt: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  clientName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#1E293B",
  },
  clientDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    marginTop: 2,
  },
  inqBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  inqSubject: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1E293B",
    marginBottom: 8,
  },
  inqDivider: { height: 1, backgroundColor: "#E2E8F0", marginBottom: 8 },
  inqMsg: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    lineHeight: 20,
  },
  inputLbl: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#334155" },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1E293B",
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    paddingVertical: 16,
  },
  sendBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
