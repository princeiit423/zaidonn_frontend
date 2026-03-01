import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../constants/colors";
import { apiRequest, queryClient } from "../../lib/query-client";

interface ClientForm {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  gstNumber: string;
  panNumber: string;
}

const emptyForm: ClientForm = {
  username: "",
  password: "",
  name: "",
  email: "",
  phone: "",
  businessName: "",
  gstNumber: "",
  panNumber: "",
};

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [search, setSearch] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        "https://zaidonn.onrender.com/api/clients",
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch clients");
      }

      return res.json();
    },
  });
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        username: form.username.trim(),
        password: form.password.trim(),
        name: form.name.trim(),
        email: form.email?.trim(),
        phone: form.phone?.trim(),
        businessName: form.businessName?.trim(),
        gstNumber: form.gstNumber?.trim(),
        panNumber: form.panNumber?.trim(),
      };

      // console.log("🚀 Creating Client:", payload);

      const res = await apiRequest(
        "POST",
        "https://zaidonn.onrender.com/api/clients",
        payload,
      );

      const data = await res.json();

      if (!res.ok) {
        // console.log("❌ Create Error:", data);
        throw new Error(data.message || "Failed to create client");
      }

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });

      setShowModal(false);
      setForm(emptyForm);

      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Success", "Client created successfully");
    },

    onError: (err: any) => {
      //console.log("❌ Mutation Error:", err);
      Alert.alert("Error", err.message);
    },
  });
  const updateMutation = useMutation({
    mutationFn: async () => {
      const data: any = { ...form };
      if (!data.password) delete data.password;

      const res = await apiRequest(
        "PUT",
        `https://zaidonn.onrender.com/api/clients/${editingId}`,
        data,
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update client");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] }); // ✅ FIXED
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);

      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(
        "DELETE",
        `https://zaidonn.onrender.com/api/clients/${id}`,
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete client");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] }); // ✅ FIXED

      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message);
    },
  });
  const handleEdit = (client: any) => {
    setEditingId(client._id);
    setForm({
      username: client.username,
      password: "",
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      businessName: client.businessName || "",
      gstNumber: client.gstNumber || "",
      panNumber: client.panNumber || "",
    });
    setShowModal(true);
  };

  const handleDelete = (client: any) => {
    Alert.alert(
      "Delete Client",
      `Are you sure you want to delete ${client.name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(client._id),
        },
      ],
    );
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.username.trim()) {
      Alert.alert("Required", "Name and username are required.");
      return;
    }
    if (!editingId && !form.password.trim()) {
      Alert.alert("Required", "Password is required for new clients.");
      return;
    }
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const filteredClients =
    clients?.filter(
      (c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.username.toLowerCase().includes(search.toLowerCase()) ||
        (c.businessName &&
          c.businessName.toLowerCase().includes(search.toLowerCase())),
    ) || [];

  const renderClient = ({ item }: { item: any }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientAvatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientUsername}>@{item.username}</Text>
        {item.businessName && (
          <Text style={styles.clientBiz}>{item.businessName}</Text>
        )}
      </View>
      <View style={styles.clientActions}>
        <Pressable
          onPress={() => handleEdit(item)}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={Colors.light.primary}
          />
        </Pressable>
        <Pressable
          onPress={() => handleDelete(item)}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
        </Pressable>
      </View>
    </View>
  );

  const updateField = (key: keyof ClientForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Clients</Text>
            <Text style={styles.headerSub}>
              {clients?.length || 0} registered clients
            </Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowModal(true);
            }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.light.textLight}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={Colors.light.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item._id}
        renderItem={renderClient}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filteredClients.length > 0}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={48}
                color={Colors.light.textLight}
              />
              <Text style={styles.emptyTitle}>No Clients Found</Text>
              <Text style={styles.emptyText}>
                Add your first client using the + button
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalContainer,
                { paddingBottom: insets.bottom + 16 },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingId ? "Edit Client" : "New Client"}
                </Text>
                <Pressable onPress={() => setShowModal(false)} hitSlop={8}>
                  <Ionicons name="close" size={24} color={Colors.light.text} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {[
                  {
                    key: "name",
                    label: "Full Name",
                    icon: "person-outline",
                    required: true,
                  },
                  {
                    key: "username",
                    label: "Username",
                    icon: "at-outline",
                    required: true,
                  },
                  {
                    key: "password",
                    label: editingId ? "New Password (optional)" : "Password",
                    icon: "lock-closed-outline",
                    required: !editingId,
                    secure: true,
                  },
                  { key: "email", label: "Email", icon: "mail-outline" },
                  { key: "phone", label: "Phone", icon: "call-outline" },
                  {
                    key: "businessName",
                    label: "Business Name",
                    icon: "business-outline",
                  },
                  {
                    key: "gstNumber",
                    label: "GST Number",
                    icon: "receipt-outline",
                  },
                  {
                    key: "panNumber",
                    label: "PAN Number",
                    icon: "card-outline",
                  },
                ].map((field) => (
                  <View key={field.key} style={styles.formField}>
                    <Text style={styles.fieldLabel}>
                      {field.label}
                      {field.required ? " *" : ""}
                    </Text>
                    <View style={styles.fieldInputWrap}>
                      <Ionicons
                        name={field.icon as any}
                        size={18}
                        color={Colors.light.textSecondary}
                      />
                      <TextInput
                        style={styles.fieldInput}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        placeholderTextColor={Colors.light.textLight}
                        value={form[field.key as keyof ClientForm]}
                        onChangeText={(v) =>
                          updateField(field.key as keyof ClientForm, v)
                        }
                        secureTextEntry={!!field.secure}
                        autoCapitalize={
                          field.key === "username" ? "none" : "words"
                        }
                      />
                    </View>
                  </View>
                ))}

                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    pressed && { opacity: 0.9 },
                    (createMutation.isPending || updateMutation.isPending) && {
                      opacity: 0.7,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingId ? "Update Client" : "Create Client"}
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
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
    marginBottom: 12,
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  listContent: { padding: 16, gap: 10 },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  clientAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  clientInfo: { flex: 1 },
  clientName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  clientUsername: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  clientBiz: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textLight,
    marginTop: 1,
  },
  clientActions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
  },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalKeyboard: { flex: 1, justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  modalScroll: { padding: 20, paddingBottom: 30 },
  formField: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 6,
  },
  fieldInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
