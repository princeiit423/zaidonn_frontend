import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../constants/colors";

const { width: SW } = Dimensions.get("window");
const BASE = "https://zaidonn.onrender.com/api/documents";

// ─── Static data (same as original) ─────────────────────────────────────────
const CATEGORIES = [
  { key: "GST", label: "GST", emoji: "🧾", color: "#0891B2", bg: "#E0F7FA" },
  { key: "ITR", label: "ITR", emoji: "📊", color: "#059669", bg: "#ECFDF5" },
  {
    key: "LICENCE",
    label: "Licence",
    emoji: "🏅",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    key: "ACCOUNTS",
    label: "Accounts",
    emoji: "📈",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
];

const GST_SUB = [
  {
    key: "Sales",
    label: "Sales Report",
    emoji: "📤",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    key: "Purchase",
    label: "Purchase Report",
    emoji: "📥",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  { key: "ITC", label: "ITC", emoji: "🔄", color: "#0891B2", bg: "#E0F7FA" },
];

const LICENCE_DOCS = [
  {
    key: "GST Certificate",
    label: "GST Certificate",
    icon: "document-text-outline" as const,
    desc: "Official GST Registration",
    color: "#0891B2",
  },
  {
    key: "Trade Licence",
    label: "Trade Licence",
    icon: "storefront-outline" as const,
    desc: "Local Municipal Permit",
    color: "#D97706",
  },
  {
    key: "Food Licence",
    label: "Food Licence",
    icon: "fast-food-outline" as const,
    desc: "FSSAI Compliance",
    color: "#DC2626",
  },
  {
    key: "UDYAM",
    label: "UDYAM",
    icon: "briefcase-outline" as const,
    desc: "MSME Registration",
    color: "#7C3AED",
  },
  {
    key: "P.TAX",
    label: "P.TAX",
    icon: "cash-outline" as const,
    desc: "Professional Tax",
    color: "#059669",
  },
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "home" | "gst_sub" | "fy" | "month" | "results";

interface Filters {
  category: string;
  subcategory: string | null;
  financialYear: string | null;
  month: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const webTop = Platform.OS === "web" ? 67 : 0;

  // Wizard state
  const [screen, setScreen] = useState<Screen>("home");
  const [filters, setFilters] = useState<Filters>({
    category: params.category || "all",
    subcategory: null,
    financialYear: null,
    month: null,
  });

  // Documents state (manual fetch — no react-query dependency issues)
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Slide animation
  const slideX = useRef(new Animated.Value(0)).current;

  const animateForward = () => {
    slideX.setValue(SW);
    Animated.spring(slideX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  };

  const animateBackward = () => {
    slideX.setValue(-SW * 0.3);
    Animated.spring(slideX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  };

  // ── Fetch documents ─────────────────────────────────────────────────────────
  const fetchDocs = async (f: Filters) => {
    setLoading(true);
    try {
      // Read the JWT token saved during login
      const token = await AsyncStorage.getItem("token");

      const p = new URLSearchParams();
      if (f.category && f.category !== "all") p.set("category", f.category);
      if (f.subcategory) p.set("subcategory", f.subcategory);
      if (f.financialYear) p.set("financialYear", f.financialYear);
      if (f.month) p.set("month", f.month);
      const url = p.toString() ? `${BASE}?${p.toString()}` : BASE;

      //console.log("Fetching:", url, "token:", token ? "present" : "missing");

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        //console.error("Fetch failed:", res.status, errText);
        setDocs([]);
        return;
      }

      const json = await res.json();
      setDocs(Array.isArray(json) ? json : []);
    } catch (err) {
      //console.error("Fetch error:", err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshDocs = async () => {
    setRefreshing(true);
    await fetchDocs(filters);
    setRefreshing(false);
  };

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goTo = (s: Screen, newFilters?: Partial<Filters>) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const merged = newFilters ? { ...filters, ...newFilters } : filters;
    setFilters(merged);
    setScreen(s);
    animateForward();
    if (s === "results") fetchDocs(merged);
  };

  const goBack = () => {
    animateBackward();
    if (screen === "gst_sub") {
      setScreen("home");
    } else if (screen === "fy") {
      setScreen(filters.category === "GST" ? "gst_sub" : "home");
    } else if (screen === "month") {
      setScreen("fy");
    } else if (screen === "results") {
      if (filters.category === "GST" && filters.month !== null)
        setScreen("month");
      else if (filters.category === "GST") setScreen("fy");
      else if (filters.category === "ITR") setScreen("fy");
      else setScreen("home");
    } else {
      setScreen("home");
    }
  };

  const goHome = () => {
    animateBackward();
    setScreen("home");
    setFilters({
      category: "all",
      subcategory: null,
      financialYear: null,
      month: null,
    });
    setDocs([]);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getCat = (key: string) => CATEGORIES.find((c) => c.key === key);

  const getDocIcon = (name: string) => {
    const ext = name?.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "document-outline";
    if (["jpg", "jpeg", "png", "gif"].includes(ext || ""))
      return "image-outline";
    if (["xls", "xlsx", "csv"].includes(ext || "")) return "grid-outline";
    return "document-outline";
  };

  // ── Progress bar ────────────────────────────────────────────────────────────
  const STEP_MAP: Record<Screen, number> = {
    home: 0,
    gst_sub: 1,
    fy: 2,
    month: 3,
    results: 4,
  };
  const totalSteps =
    filters.category === "GST" ? 4 : filters.category === "ITR" ? 2 : 1;
  const currentStep = STEP_MAP[screen];

  const renderProgress = () => {
    if (screen === "home") return null;
    const pct = Math.min((currentStep / totalSteps) * 100, 100);
    const cat = getCat(filters.category);
    return (
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${pct}%` as any,
                backgroundColor: cat?.color || "#4F46E5",
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>
    );
  };

  // ── Breadcrumb trail ────────────────────────────────────────────────────────
  const renderCrumbs = () => {
    const crumbs: string[] = [];
    if (filters.category && filters.category !== "all") {
      const c = getCat(filters.category);
      crumbs.push(`${c?.emoji} ${c?.label}`);
    }
    if (filters.subcategory) crumbs.push(filters.subcategory);
    if (filters.financialYear) crumbs.push(`FY ${filters.financialYear}`);
    if (filters.month) crumbs.push(filters.month);
    if (!crumbs.length) return null;
    return (
      <View style={styles.crumbRow}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <Ionicons name="chevron-forward" size={12} color="#94A3B8" />
            )}
            <Text style={styles.crumbText}>{c}</Text>
          </React.Fragment>
        ))}
      </View>
    );
  };

  // ── Page header ─────────────────────────────────────────────────────────────
  const renderPageHeader = (
    title: string,
    subtitle: string,
    color?: string,
  ) => (
    <View style={[styles.pageHeader, color ? { backgroundColor: color } : {}]}>
      {screen !== "home" && (
        <Pressable
          style={[
            styles.backBtn,
            color ? { backgroundColor: "rgba(255,255,255,0.25)" } : {},
          ]}
          onPress={goBack}
          hitSlop={12}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={color ? "#fff" : "#1E293B"}
          />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.pageTitle, color ? { color: "#fff" } : {}]}>
          {title}
        </Text>
        <Text
          style={[
            styles.pageSub,
            color ? { color: "rgba(255,255,255,0.8)" } : {},
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );

  // ── Option card (reusable big tap card) ─────────────────────────────────────
  const OptionCard = ({
    emoji,
    label,
    sublabel,
    color,
    bg,
    onPress,
  }: {
    emoji: string;
    label: string;
    sublabel?: string;
    color: string;
    bg: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.optionCard,
        { backgroundColor: bg, borderColor: color + "55" },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[styles.optionEmojiBubble, { backgroundColor: color + "22" }]}
      >
        <Text style={styles.optionEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color }]}>{label}</Text>
        {sublabel ? (
          <Text style={styles.optionSublabel}>{sublabel}</Text>
        ) : null}
      </View>
      <View style={[styles.optionArrow, { backgroundColor: color }]}>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </View>
    </Pressable>
  );

  // ═══════════════════════════════════════════════════════════════
  // HOME — pick category
  // ═══════════════════════════════════════════════════════════════
  const HomeScreen = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollPad}
    >
      {renderPageHeader(
        "📁  My Documents",
        "What document are you looking for?",
      )}

      <View style={styles.hintBox}>
        <Text style={styles.hintEmoji}>👋</Text>
        <Text style={styles.hintTitle}>Hello! Let's find your document</Text>
        <Text style={styles.hintSub}>
          Tap a category below — we'll guide you one step at a time
        </Text>
      </View>

      <Text style={styles.sectionLabel}>SELECT DOCUMENT TYPE</Text>

      {CATEGORIES.map((cat) => (
        <OptionCard
          key={cat.key}
          emoji={cat.emoji}
          label={cat.label}
          color={cat.color}
          bg={cat.bg}
          onPress={() => {
            const f: Filters = {
              category: cat.key,
              subcategory: null,
              financialYear: null,
              month: null,
            };
            if (
              cat.key === "all" ||
              cat.key === "LICENCE" ||
              cat.key === "ACCOUNTS"
            ) {
              goTo("results", f);
            } else if (cat.key === "GST") {
              goTo("gst_sub", f);
            } else if (cat.key === "ITR") {
              goTo("fy", f);
            }
          }}
        />
      ))}
    </ScrollView>
  );

  // ═══════════════════════════════════════════════════════════════
  // GST SUB-TYPE
  // ═══════════════════════════════════════════════════════════════
  const GstSubScreen = () => {
    const cat = getCat("GST")!;
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPad}
      >
        {renderPageHeader(
          "🧾  GST Report Type",
          "Which GST report do you need?",
          cat.color,
        )}
        {renderProgress()}
        {renderCrumbs()}

        <View
          style={[
            styles.hintBox,
            { backgroundColor: cat.bg, borderColor: cat.color + "44" },
          ]}
        >
          <Text style={styles.hintEmoji}>📋</Text>
          <Text style={[styles.hintTitle, { color: cat.color }]}>
            Choose the report type
          </Text>
        </View>

        <Text style={styles.sectionLabel}>SELECT REPORT TYPE</Text>

        {GST_SUB.map((sub) => (
          <OptionCard
            key={sub.key}
            emoji={sub.emoji}
            label={sub.label}
            color={sub.color}
            bg={sub.bg}
            onPress={() => goTo("fy", { subcategory: sub.key })}
          />
        ))}
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // FINANCIAL YEAR
  // ═══════════════════════════════════════════════════════════════
  const FYScreen = () => {
    const cat = getCat(filters.category) || getCat("all")!;
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPad}
      >
        {renderPageHeader(
          "📅  Financial Year",
          "Which year's document do you need?",
          cat.color,
        )}
        {renderProgress()}
        {renderCrumbs()}

        <View
          style={[
            styles.hintBox,
            { backgroundColor: cat.bg, borderColor: cat.color + "44" },
          ]}
        >
          <Text style={styles.hintEmoji}>🗓️</Text>
          <Text style={[styles.hintTitle, { color: cat.color }]}>
            Select the Financial Year
          </Text>
          <Text style={styles.hintSub}>Tap the year you want to view</Text>
        </View>

        <Text style={styles.sectionLabel}>SELECT YEAR</Text>

        {FINANCIAL_YEARS.map((fy) => (
          <Pressable
            key={fy}
            style={({ pressed }) => [
              styles.fyCard,
              { borderColor: cat.color + "55" },
              pressed && styles.cardPressed,
            ]}
            onPress={() => {
              if (filters.category === "GST") {
                goTo("month", { financialYear: fy });
              } else {
                goTo("results", { financialYear: fy });
              }
            }}
          >
            <View
              style={[styles.fyIconBox, { backgroundColor: cat.color + "18" }]}
            >
              <Ionicons name="calendar" size={32} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fySmall}>Financial Year</Text>
              <Text style={[styles.fyBig, { color: cat.color }]}>FY {fy}</Text>
            </View>
            <View style={[styles.optionArrow, { backgroundColor: cat.color }]}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          </Pressable>
        ))}

        <Pressable
          style={styles.skipCard}
          onPress={() => {
            if (filters.category === "GST")
              goTo("month", { financialYear: null });
            else goTo("results", { financialYear: null });
          }}
        >
          <Ionicons name="infinite-outline" size={22} color="#64748B" />
          <Text style={styles.skipText}>Show all years</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#94A3B8"
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MONTH
  // ═══════════════════════════════════════════════════════════════
  const MonthScreen = () => {
    const cat = getCat(filters.category) || getCat("all")!;
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPad}
      >
        {renderPageHeader(
          "🌙  Month",
          "Which month's GST do you need?",
          cat.color,
        )}
        {renderProgress()}
        {renderCrumbs()}

        <View
          style={[
            styles.hintBox,
            { backgroundColor: cat.bg, borderColor: cat.color + "44" },
          ]}
        >
          <Text style={styles.hintEmoji}>📆</Text>
          <Text style={[styles.hintTitle, { color: cat.color }]}>
            Select the Month
          </Text>
          <Text style={styles.hintSub}>Tap the month for your GST report</Text>
        </View>

        <Text style={styles.sectionLabel}>SELECT MONTH</Text>

        <View style={styles.monthGrid}>
          {MONTHS.map((m) => (
            <Pressable
              key={m}
              style={({ pressed }) => [
                styles.monthCard,
                { borderColor: cat.color + "55" },
                pressed && styles.cardPressed,
              ]}
              onPress={() => goTo("results", { month: m })}
            >
              <Text style={[styles.monthShort, { color: cat.color }]}>
                {m.slice(0, 3)}
              </Text>
              <Text style={styles.monthFull}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.skipCard}
          onPress={() => goTo("results", { month: null })}
        >
          <Ionicons name="infinite-outline" size={22} color="#64748B" />
          <Text style={styles.skipText}>Show all months</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#94A3B8"
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════════
  const ResultsScreen = () => {
    const cat = getCat(filters.category) || getCat("all")!;
    const isLicence = filters.category === "LICENCE";

    // Apply client-side filter on top of server response (same as original)
    const filtered = docs.filter((d: any) => {
      if (
        filters.category &&
        filters.category !== "all" &&
        d.category !== filters.category
      )
        return false;
      if (filters.subcategory && d.subcategory !== filters.subcategory)
        return false;
      if (filters.financialYear && d.financialYear !== filters.financialYear)
        return false;
      if (filters.month && d.month !== filters.month) return false;
      return true;
    });

    const subtitle =
      [
        filters.subcategory,
        filters.financialYear ? `FY ${filters.financialYear}` : null,
        filters.month,
      ]
        .filter(Boolean)
        .join(" · ") || "All documents";

    return (
      <View style={{ flex: 1 }}>
        {/* Colored header */}
        {renderPageHeader(`${cat.emoji}  ${cat.label}`, subtitle, cat.color)}
        {renderCrumbs()}

        {/* New search button */}
        <Pressable style={styles.newSearchBtn} onPress={goHome}>
          <Ionicons name="search-outline" size={16} color="#4F46E5" />
          <Text style={styles.newSearchText}>New Search</Text>
        </Pressable>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={cat.color} />
            <Text style={styles.stateText}>Fetching your documents…</Text>
          </View>
        ) : isLicence && !filtered.length ? (
          // Licence placeholder list
          <FlatList
            data={LICENCE_DOCS}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
            renderItem={({ item }) => (
              <View style={styles.licCard}>
                <View
                  style={[
                    styles.licIcon,
                    { backgroundColor: item.color + "18" },
                  ]}
                >
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.licName}>{item.label}</Text>
                  <Text style={styles.licDesc}>{item.desc}</Text>
                </View>
                <View style={styles.noFileBadge}>
                  <Text style={styles.noFileText}>No file</Text>
                </View>
              </View>
            )}
          />
        ) : !filtered.length ? (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 56 }}>🗂️</Text>
            <Text style={styles.stateTitle}>No Documents Found</Text>
            <Text style={styles.stateText}>
              No documents uploaded for this filter.
            </Text>
            <Pressable
              style={[styles.retryBtn, { backgroundColor: cat.color }]}
              onPress={goHome}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refreshDocs} />
            }
            ListHeaderComponent={
              <View
                style={[
                  styles.countBanner,
                  { backgroundColor: cat.bg, borderColor: cat.color + "44" },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color={cat.color} />
                <Text style={[styles.countText, { color: cat.color }]}>
                  {filtered.length} document{filtered.length !== 1 ? "s" : ""}{" "}
                  found
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const c = getCat(item.category);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.docCard,
                    pressed && { opacity: 0.82 },
                  ]}
                  onPress={() => Linking.openURL(item.cloudinaryUrl)}
                >
                  <View
                    style={[
                      styles.docIconBox,
                      { backgroundColor: c?.bg || "#EEF2FF" },
                    ]}
                  >
                    <Ionicons
                      name={getDocIcon(item.name) as any}
                      size={24}
                      color={c?.color || Colors.light.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.docMeta}>
                      {item.category}
                      {item.subcategory ? ` › ${item.subcategory}` : ""}
                      {item.financialYear
                        ? `  •  FY ${item.financialYear}`
                        : ""}
                      {item.month ? `  •  ${item.month}` : ""}
                    </Text>
                    <Text style={styles.docDate}>
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.openBtn,
                      { backgroundColor: c?.color || Colors.light.primary },
                    ]}
                  >
                    <Ionicons name="open-outline" size={16} color="#fff" />
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // ROOT
  // ═══════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      <View style={{ height: insets.top + webTop, backgroundColor: "#fff" }} />
      <Animated.View
        style={[{ flex: 1 }, { transform: [{ translateX: slideX }] }]}
      >
        {screen === "home" && <HomeScreen />}
        {screen === "gst_sub" && <GstSubScreen />}
        {screen === "fy" && <FYScreen />}
        {screen === "month" && <MonthScreen />}
        {screen === "results" && <ResultsScreen />}
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  scrollPad: { paddingBottom: 100 },

  // Page header
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#1E293B" },
  pageSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },

  // Progress
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
  },

  // Breadcrumbs
  crumbRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  crumbText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#4F46E5" },

  // Hint box
  hintBox: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 2,
    borderColor: "#C7D2FE",
    gap: 6,
  },
  hintEmoji: { fontSize: 40 },
  hintTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#3730A3",
    textAlign: "center",
  },
  hintSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6366F1",
    textAlign: "center",
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#94A3B8",
    letterSpacing: 1.4,
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },

  // Option card
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  optionEmojiBubble: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
  },
  optionEmoji: { fontSize: 30 },
  optionLabel: { fontSize: 20, fontFamily: "Inter_700Bold" },
  optionSublabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },
  optionArrow: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },

  // FY card
  fyCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  fySmall: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  fyBig: { fontSize: 24, fontFamily: "Inter_700Bold" },

  // Month grid
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  monthCard: {
    width: "22%",
    flexGrow: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  monthShort: { fontSize: 18, fontFamily: "Inter_700Bold" },
  monthFull: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    marginTop: 3,
  },

  // Skip card
  skipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    padding: 16,
  },
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#64748B" },

  // Results
  newSearchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    margin: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  newSearchText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#4F46E5",
  },

  countBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  countText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  docIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  docName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1E293B" },
  docMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },
  docDate: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    marginTop: 2,
  },
  openBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 14,
  },
  stateTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#334155" },
  stateText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    textAlign: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },

  // Licence
  licCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  licIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  licName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1E293B" },
  licDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },
  noFileBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noFileText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#D97706" },
});
