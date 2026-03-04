import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { apiRequest } from "../../lib/query-client";

/**
 * getQueryFn (default queryFn) builds URL as:
 *   new URL(queryKey.join("/"), "http://192.168.29.200:5000/")
 *
 * queryKey: ["api/inquiries"]
 *   → http://192.168.29.200:5000/api/inquiries  ✅  (with Bearer token)
 */

const QUERY_KEY = ["api/inquiries"] as const;

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const qc = useQueryClient();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  // ── Fetch client's own inquiries ──────────────────────────────────────────
  // Uses default getQueryFn → reads token from AsyncStorage → Bearer auth ✅
  const {
    data: inquiries,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: QUERY_KEY,
  });

  // ── Submit new inquiry ────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "api/inquiries", {
        subject,
        message,
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate with the SAME key so list refreshes immediately
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      setSubject("");
      setMessage("");
      setShowForm(false);
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Submitted ✓",
        "Your inquiry has been sent. We'll respond shortly.",
      );
    },
    onError: () => {
      Alert.alert("Error", "Failed to submit inquiry. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Required", "Please fill in both subject and message.");
      return;
    }
    submitMutation.mutate();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Contact Us</Text>
            <Text style={styles.headerSub}>Get professional consultation</Text>
          </View>
          <Pressable
            style={[styles.newBtn, showForm && styles.newBtnClose]}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons
              name={showForm ? "close" : "add"}
              size={22}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── New Inquiry Form ── */}
          {showForm && (
            <View style={styles.formCard}>
              <View style={styles.formTitleRow}>
                <View style={styles.formIconWrap}>
                  <Ionicons name="create-outline" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.formTitle}>New Inquiry</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. GST Filing Query"
                  placeholderTextColor="#94A3B8"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your question or concern…"
                  placeholderTextColor="#94A3B8"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  (pressed || submitMutation.isPending) && { opacity: 0.85 },
                ]}
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={17} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Inquiry</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* ── Contact Info ── */}
          <Text style={styles.sectionLabel}>Reach Us</Text>
          <View style={styles.contactCard}>
            {[
              {
                icon: "call-outline",
                label: "Phone",
                value: "+91-7482049372",
                bg: "#EEF2FF",
                color: "#4F46E5",
              },
              {
                icon: "mail-outline",
                label: "Email",
                value: "teamzaidonn@gmail.com",
                bg: "#E8F5E9",
                color: "#059669",
              },
              {
                icon: "time-outline",
                label: "Working Hours",
                value: "Mon – Sat, 9:00 AM – 6:00 PM",
                bg: "#FFF3E0",
                color: "#D97706",
              },
            ].map((item, idx, arr) => (
              <View key={item.label}>
                <View style={styles.contactRow}>
                  <View
                    style={[
                      styles.contactIconWrap,
                      { backgroundColor: item.bg },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactType}>{item.label}</Text>
                    <Text style={styles.contactValue}>{item.value}</Text>
                  </View>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* ── Your Inquiries ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Your Inquiries</Text>
            {(inquiries?.length ?? 0) > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeTxt}>{inquiries!.length}</Text>
              </View>
            )}
          </View>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.centerTxt}>Loading your inquiries…</Text>
            </View>
          ) : !inquiries?.length ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={36}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>No Inquiries Yet</Text>
              <Text style={styles.emptyText}>
                Tap the{" "}
                <Text
                  style={{ fontFamily: "Inter_600SemiBold", color: "#4F46E5" }}
                >
                  +
                </Text>{" "}
                button above to submit your first question
              </Text>
            </View>
          ) : (
            inquiries.map((inq: any) => {
              const isResponded = inq.status === "responded";
              return (
                <View
                  key={inq._id}
                  style={[
                    styles.inqCard,
                    isResponded && styles.inqCardResponded,
                  ]}
                >
                  {/* Subject + status */}
                  <View style={styles.inqHeader}>
                    <Text style={styles.inqSubject} numberOfLines={1}>
                      {inq.subject}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isResponded ? "#E8F5E9" : "#FFF3E0",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: isResponded
                              ? "#059669"
                              : "#D97706",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusTxt,
                          { color: isResponded ? "#059669" : "#D97706" },
                        ]}
                      >
                        {isResponded ? "Responded" : "Pending"}
                      </Text>
                    </View>
                  </View>

                  {/* Message */}
                  <Text style={styles.inqMsg}>{inq.message}</Text>

                  {/* Date */}
                  <Text style={styles.inqDate}>
                    {new Date(inq.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>

                  {/* Admin response */}
                  {inq.adminResponse ? (
                    <View style={styles.responseBox}>
                      <View style={styles.responseHeader}>
                        <View style={styles.responseIconWrap}>
                          <Ionicons
                            name="chatbubble-ellipses"
                            size={14}
                            color="#4F46E5"
                          />
                        </View>
                        <Text style={styles.responseLabel}>Admin Response</Text>
                      </View>
                      <Text style={styles.responseText}>
                        {inq.adminResponse}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBox}>
                      <Ionicons name="time-outline" size={13} color="#D97706" />
                      <Text style={styles.pendingTxt}>
                        Awaiting response from our team
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#1E293B" },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },
  newBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newBtnClose: { backgroundColor: "#64748B" },

  scrollContent: { padding: 16 },

  // Form
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  formIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  formTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#1E293B" },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1E293B",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  submitBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },

  // Section label
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#1E293B",
    marginBottom: 10,
  },
  countBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 10,
  },
  countBadgeTxt: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#4F46E5",
  },

  // Contact card
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  contactIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  contactType: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1E293B",
  },
  contactValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 1,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 14 },

  // States
  centerState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  centerTxt: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 20,
  },

  // Inquiry cards
  inqCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inqCardResponded: { borderLeftWidth: 4, borderLeftColor: "#059669" },
  inqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inqSubject: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  inqMsg: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    lineHeight: 20,
  },
  inqDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    marginTop: 6,
  },

  // Response
  responseBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  responseIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#C7D2FE",
    justifyContent: "center",
    alignItems: "center",
  },
  responseLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#4F46E5",
  },
  responseText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#1E293B",
    lineHeight: 20,
  },

  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 10,
  },
  pendingTxt: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#D97706",
  },
});
