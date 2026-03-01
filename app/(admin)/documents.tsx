import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { apiRequest, getApiUrl, queryClient } from "../../lib/query-client";

const CATEGORIES = ["GST", "ITR", "LICENCE", "ACCOUNTS"];
const GST_SUBCATEGORIES = ["Sales", "Purchase", "ITC"];
const LICENCE_SUBCATEGORIES = [
  "GST Certificate",
  "Trade Licence",
  "Food Licence",
  "UDYAM",
  "P.TAX",
];
const FINANCIAL_YEARS = ["2027-28", "2026-27", "2025-26", "2024-25", "2023-24"];
const MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

export default function AdminDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({
    clientId: "",
    category: "",
    subcategory: "",
    name: "",
    financialYear: "",
    month: "",
  });
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: documents, isLoading } = useQuery<any[]>({
    queryKey: ["https://zaidonn.onrender.com/api/documents"],
  });
  const { data: clients } = useQuery<any[]>({
    queryKey: ["https://zaidonn.onrender.com/api/clients"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(
        "DELETE",
        `https://zaidonn.onrender.com/api/documents/${id}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["https://zaidonn.onrender.com/api/documents"],
      });
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => Alert.alert("Error", "Failed to delete document"),
  });

  const handleDelete = (doc: any) => {
    Alert.alert("Delete Document", `Delete "${doc.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(doc._id),
      },
    ]);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf", // 👈 Sirf PDF allow karega
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (
      !selectedFile ||
      !uploadForm.clientId ||
      !uploadForm.category ||
      !uploadForm.name
    ) {
      Alert.alert(
        "Required",
        "Please select a file and fill in client, category, and name.",
      );
      return;
    }
    try {
      const formData = new FormData();
      const file = new File(selectedFile.uri);
      formData.append("file", file);
      formData.append("clientId", uploadForm.clientId);
      formData.append("category", uploadForm.category);
      if (uploadForm.subcategory)
        formData.append("subcategory", uploadForm.subcategory);
      formData.append("name", uploadForm.name);
      if (uploadForm.financialYear)
        formData.append("financialYear", uploadForm.financialYear);
      if (uploadForm.month) formData.append("month", uploadForm.month);

      const baseUrl = getApiUrl();
      const url = new URL(
        "https://zaidonn.onrender.com/api/documents/upload",
        baseUrl,
      );
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // 🔥 THIS WAS MISSING
        },
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");

      queryClient.invalidateQueries({
        queryKey: ["https://zaidonn.onrender.com/api/documents"],
      });
      setShowUpload(false);
      setSelectedFile(null);
      setUploadForm({
        clientId: "",
        category: "",
        subcategory: "",
        name: "",
        financialYear: "",
        month: "",
      });
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Document uploaded successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to upload document. Please try again.");
    }
  };

  const filteredDocs =
    documents?.filter(
      (d: any) => filterCategory === "all" || d.category === filterCategory,
    ) || [];

  const getClientName = (clientId: string) => {
    const client = clients?.find((c: any) => c._id === clientId);
    return client?.name || "Unknown";
  };

  const getSubcategories = () => {
    if (uploadForm.category === "GST") return GST_SUBCATEGORIES;
    if (uploadForm.category === "LICENCE") return LICENCE_SUBCATEGORIES;
    return [];
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Documents</Text>
            <Text style={styles.headerSub}>
              {documents?.length || 0} total documents
            </Text>
          </View>
          <Pressable
            style={styles.uploadBtn}
            onPress={() => setShowUpload(true)}
          >
            <Ionicons name="cloud-upload" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {["all", ...CATEGORIES].map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.filterChip,
              filterCategory === cat && styles.filterChipActive,
            ]}
            onPress={() => setFilterCategory(cat)}
          >
            <Text
              style={[
                styles.filterText,
                filterCategory === cat && styles.filterTextActive,
              ]}
            >
              {cat === "all" ? "All" : cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filteredDocs.length > 0}
        renderItem={({ item }) => (
          <View style={styles.docCard}>
            <View style={styles.docIconWrap}>
              <Ionicons
                name="document-outline"
                size={22}
                color={Colors.light.primary}
              />
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.docMeta}>
                {item.category}
                {item.subcategory ? ` - ${item.subcategory}` : ""}
              </Text>
              <Text style={styles.docClient}>
                {getClientName(item.clientId)}
              </Text>
            </View>
            <Pressable
              onPress={() => handleDelete(item)}
              hitSlop={8}
              style={styles.deleteBtn}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={Colors.light.error}
              />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-outline"
                size={48}
                color={Colors.light.textLight}
              />
              <Text style={styles.emptyTitle}>No Documents</Text>
              <Text style={styles.emptyText}>
                Upload documents using the upload button
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={showUpload}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUpload(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Document</Text>
              <Pressable onPress={() => setShowUpload(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.fieldLabel}>Client *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
              >
                <View style={styles.chipRow}>
                  {clients?.map((c: any) => (
                    <Pressable
                      key={c._id}
                      style={[
                        styles.selectChip,
                        uploadForm.clientId === c._id &&
                          styles.selectChipActive,
                      ]}
                      onPress={() =>
                        setUploadForm((prev) => ({ ...prev, clientId: c._id }))
                      }
                    >
                      <Text
                        style={[
                          styles.selectChipText,
                          uploadForm.clientId === c._id &&
                            styles.selectChipTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.selectChip,
                      uploadForm.category === cat && styles.selectChipActive,
                    ]}
                    onPress={() =>
                      setUploadForm((prev) => ({
                        ...prev,
                        category: cat,
                        subcategory: "",
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.selectChipText,
                        uploadForm.category === cat &&
                          styles.selectChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {getSubcategories().length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>Subcategory</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScroll}
                  >
                    <View style={styles.chipRow}>
                      {getSubcategories().map((sub) => (
                        <Pressable
                          key={sub}
                          style={[
                            styles.selectChip,
                            uploadForm.subcategory === sub &&
                              styles.selectChipActive,
                          ]}
                          onPress={() =>
                            setUploadForm((prev) => ({
                              ...prev,
                              subcategory: sub,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.selectChipText,
                              uploadForm.subcategory === sub &&
                                styles.selectChipTextActive,
                            ]}
                          >
                            {sub}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              <Text style={styles.fieldLabel}>Document Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter document name"
                placeholderTextColor={Colors.light.textLight}
                value={uploadForm.name}
                onChangeText={(v) =>
                  setUploadForm((prev) => ({ ...prev, name: v }))
                }
              />

              {(uploadForm.category === "GST" ||
                uploadForm.category === "ITR") && (
                <>
                  <Text style={styles.fieldLabel}>Financial Year</Text>
                  <View style={styles.chipRow}>
                    {FINANCIAL_YEARS.map((fy) => (
                      <Pressable
                        key={fy}
                        style={[
                          styles.selectChip,
                          uploadForm.financialYear === fy &&
                            styles.selectChipActive,
                        ]}
                        onPress={() =>
                          setUploadForm((prev) => ({
                            ...prev,
                            financialYear: fy,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            uploadForm.financialYear === fy &&
                              styles.selectChipTextActive,
                          ]}
                        >
                          {fy}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {uploadForm.category === "GST" && uploadForm.financialYear && (
                <>
                  <Text style={styles.fieldLabel}>Month</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScroll}
                  >
                    <View style={styles.chipRow}>
                      {MONTHS.map((m) => (
                        <Pressable
                          key={m}
                          style={[
                            styles.selectChip,
                            uploadForm.month === m && styles.selectChipActive,
                          ]}
                          onPress={() =>
                            setUploadForm((prev) => ({ ...prev, month: m }))
                          }
                        >
                          <Text
                            style={[
                              styles.selectChipText,
                              uploadForm.month === m &&
                                styles.selectChipTextActive,
                            ]}
                          >
                            {m.substring(0, 3)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              <Pressable style={styles.filePickBtn} onPress={pickFile}>
                <Ionicons
                  name={selectedFile ? "checkmark-circle" : "attach"}
                  size={22}
                  color={Colors.light.primary}
                />
                <Text style={styles.filePickText}>
                  {selectedFile ? "File selected" : "Select File"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.uploadSubmitBtn,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={handleUpload}
              >
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.uploadSubmitText}>Upload Document</Text>
              </Pressable>
            </ScrollView>
          </View>
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
  uploadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  filterScroll: { maxHeight: 50, backgroundColor: Colors.light.surface },
  filterContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.inputBg,
  },
  filterChipActive: { backgroundColor: Colors.light.primary },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  filterTextActive: { color: "#fff" },
  listContent: { padding: 16, gap: 10 },
  docCard: {
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
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  docInfo: { flex: 1 },
  docName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  docMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  docClient: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.primary,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
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
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 14,
  },
  chipScroll: { marginBottom: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.inputBg,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  selectChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  selectChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  selectChipTextActive: { color: "#fff" },
  textInput: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  filePickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: "dashed",
    marginTop: 16,
    justifyContent: "center",
  },
  filePickText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  uploadSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 15,
    justifyContent: "center",
    marginTop: 16,
  },
  uploadSubmitText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
