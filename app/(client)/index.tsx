import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { useAuth } from "../../lib/auth-context";

const { width: SW } = Dimensions.get("window");
const BASE = "https://zaidonn.onrender.com";

// ─── Wizard data (matches DocumentsScreen exactly) ────────────────────────────
const CATEGORIES = [
  {
    key: "GST",
    label: "GST",
    emoji: "🧾",
    color: "#0891B2",
    bg: "#E0F7FA",
    subtitle: "Goods & Services Tax",
    desc: "Sales · Purchase · ITC",
  },
  {
    key: "ITR",
    label: "ITR",
    emoji: "📊",
    color: "#059669",
    bg: "#ECFDF5",
    subtitle: "Income Tax Returns",
    desc: "Individual & Business",
  },
  {
    key: "LICENCE",
    label: "Licence",
    emoji: "🏅",
    color: "#D97706",
    bg: "#FFFBEB",
    subtitle: "Certifications & Permits",
    desc: "Trade · FSSAI · UDYAM",
  },
  {
    key: "ACCOUNTS",
    label: "Accounts",
    emoji: "📈",
    color: "#7C3AED",
    bg: "#F5F3FF",
    subtitle: "Financial Statements",
    desc: "Bookkeeping & Audit",
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

type WizardScreen = "home" | "gst_sub" | "fy" | "month" | "results";

interface Filters {
  category: string;
  subcategory: string | null;
  financialYear: string | null;
  month: string | null;
}

const getCat = (key: string) => CATEGORIES.find((c) => c.key === key);

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  // ── Wizard state (starts at "home" = 4 category cards) ─────────────────────
  const [screen, setScreen] = useState<WizardScreen>("home");
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    subcategory: null,
    financialYear: null,
    month: null,
  });
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const slideX = useRef(new Animated.Value(0)).current;

  const animForward = () => {
    slideX.setValue(SW);
    Animated.spring(slideX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  };
  const animBack = () => {
    slideX.setValue(-SW * 0.3);
    Animated.spring(slideX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  };

  // ── Notifications ───────────────────────────────────────────────────────────
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["api/notifications"],
  });
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  // ── Fetch docs ──────────────────────────────────────────────────────────────
  const fetchDocs = async (f: Filters) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const p = new URLSearchParams();
      if (f.category && f.category !== "all") p.set("category", f.category);
      if (f.subcategory) p.set("subcategory", f.subcategory);
      if (f.financialYear) p.set("financialYear", f.financialYear);
      if (f.month) p.set("month", f.month);
      const qs = p.toString();
      const url = `${BASE}/api/documents${qs ? "?" + qs : ""}`;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      setDocs(Array.isArray(json) ? json : []);
    } catch {
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

  // ── Wizard navigation ───────────────────────────────────────────────────────
  const goTo = (s: WizardScreen, newFilters?: Partial<Filters>) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const merged = newFilters ? { ...filters, ...newFilters } : filters;
    setFilters(merged);
    setScreen(s);
    animForward();
    if (s === "results") fetchDocs(merged);
  };

  const goBack = () => {
    animBack();
    if (screen === "gst_sub") setScreen("home");
    else if (screen === "fy")
      setScreen(filters.category === "GST" ? "gst_sub" : "home");
    else if (screen === "month") setScreen("fy");
    else if (screen === "results") {
      if (filters.category === "GST" && filters.month !== null)
        setScreen("month");
      else if (filters.category === "GST" || filters.category === "ITR")
        setScreen("fy");
      else setScreen("home");
    } else setScreen("home");
  };

  // Going back to "home" resets everything
  const goHome = () => {
    animBack();
    setScreen("home");
    setFilters({
      category: "all",
      subcategory: null,
      financialYear: null,
      month: null,
    });
    setDocs([]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning,";
    if (h < 17) return "Good afternoon,";
    return "Good evening,";
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getDocIcon = (name: string) => {
    const ext = name?.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "document-outline";
    if (["jpg", "jpeg", "png", "gif"].includes(ext || ""))
      return "image-outline";
    if (["xls", "xlsx", "csv"].includes(ext || "")) return "grid-outline";
    return "document-outline";
  };

  const STEP_MAP: Record<WizardScreen, number> = {
    home: 0,
    gst_sub: 1,
    fy: 2,
    month: 3,
    results: 4,
  };
  const totalSteps =
    filters.category === "GST" ? 4 : filters.category === "ITR" ? 2 : 1;

  // ── Shared sub-components ───────────────────────────────────────────────────

  const ProgressBar = () => {
    if (screen === "home") return null;
    const cat = getCat(filters.category);
    const pct = Math.min((STEP_MAP[screen] / totalSteps) * 100, 100);
    return (
      <View style={s.progressWrap}>
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              {
                width: `${pct}%` as any,
                backgroundColor: cat?.color || "#4F46E5",
              },
            ]}
          />
        </View>
        <Text style={s.progressTxt}>
          Step {STEP_MAP[screen]} of {totalSteps}
        </Text>
      </View>
    );
  };

  const Breadcrumbs = () => {
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
      <View style={s.crumbRow}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <Ionicons name="chevron-forward" size={11} color="#94A3B8" />
            )}
            <Text style={s.crumbTxt}>{c}</Text>
          </React.Fragment>
        ))}
      </View>
    );
  };

  const WizardHeader = ({
    title,
    subtitle,
    color,
  }: {
    title: string;
    subtitle: string;
    color?: string;
  }) => (
    <View style={[s.wizardHeader, color ? { backgroundColor: color } : {}]}>
      <Pressable
        style={[
          s.backBtn,
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
      <View style={{ flex: 1 }}>
        <Text style={[s.wizardTitle, color ? { color: "#fff" } : {}]}>
          {title}
        </Text>
        <Text
          style={[s.wizardSub, color ? { color: "rgba(255,255,255,0.8)" } : {}]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );

  const OptionCard = ({
    emoji,
    label,
    color,
    bg,
    onPress,
  }: {
    emoji: string;
    label: string;
    color: string;
    bg: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={({ pressed }) => [
        s.optCard,
        { backgroundColor: bg, borderColor: color + "55" },
        pressed && s.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[s.optEmoji, { backgroundColor: color + "22" }]}>
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
      </View>
      <Text style={[s.optLabel, { color }]}>{label}</Text>
      <View style={[s.optArrow, { backgroundColor: color }]}>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </View>
    </Pressable>
  );

  // ══════════════════════════════════════════════════════════
  // WIZARD SCREENS
  // ══════════════════════════════════════════════════════════

  // HOME — 4 category cards (this IS the dashboard's main content)
  const HomeView = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 110 }}
    >
      {/* Dashboard header info */}
      <View style={s.dashWelcome}>
        <Text style={s.dashWelcomeTxt}>
          Select a document category to get started
        </Text>
      </View>

      <Text style={s.sectionLbl}>DOCUMENT CATEGORIES</Text>

      {CATEGORIES.map((cat) => (
        <Pressable
          key={cat.key}
          style={({ pressed }) => [
            s.catCard,
            { borderColor: cat.color + "44" },
            pressed && s.pressed,
          ]}
          onPress={() => {
            if (Platform.OS !== "web")
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const f: Filters = {
              category: cat.key,
              subcategory: null,
              financialYear: null,
              month: null,
            };
            if (cat.key === "GST") goTo("gst_sub", f);
            else if (cat.key === "ITR") goTo("fy", f);
            else goTo("results", f); // LICENCE / ACCOUNTS → straight to results
          }}
        >
          {/* Left: icon */}
          <View style={[s.catIconWrap, { backgroundColor: cat.bg }]}>
            <Text style={{ fontSize: 30 }}>{cat.emoji}</Text>
          </View>
          {/* Middle: text */}
          <View style={{ flex: 1 }}>
            <Text style={[s.catTitle, { color: cat.color }]}>{cat.label}</Text>
            <Text style={s.catSubtitle}>{cat.subtitle}</Text>
            <Text style={s.catDesc}>{cat.desc}</Text>
          </View>
          {/* Right: arrow */}
          <View style={[s.catArrow, { backgroundColor: cat.color }]}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </View>
        </Pressable>
      ))}

      {/* Quick links */}
      <Text style={[s.sectionLbl, { marginTop: 24 }]}>QUICK ACTIONS</Text>
      <View style={s.quickRow}>
        <Pressable
          style={s.quickBtn}
          onPress={() => router.push("/(client)/contact" as any)}
        >
          <View style={[s.quickIcon, { backgroundColor: "#E8F5E9" }]}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#059669"
            />
          </View>
          <Text style={s.quickTxt}>Submit Inquiry</Text>
        </Pressable>
        <Pressable
          style={s.quickBtn}
          onPress={() => router.push("/(client)/notifications" as any)}
        >
          <View style={[s.quickIcon, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="notifications-outline" size={20} color="#1565C0" />
          </View>
          <Text style={s.quickTxt}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.quickBadge}>
              <Text style={s.quickBadgeTxt}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );

  // GST SUB-TYPE
  const GstSubView = () => {
    const cat = getCat("GST")!;
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <WizardHeader
          title="🧾  GST"
          subtitle="Which GST report do you need?"
          color={cat.color}
        />
        <ProgressBar />
        <Breadcrumbs />
        <View
          style={[
            s.hintBox,
            { backgroundColor: cat.bg, borderColor: cat.color + "44" },
          ]}
        >
          <Text style={{ fontSize: 36 }}>📋</Text>
          <Text style={[s.hintTitle, { color: cat.color }]}>
            Choose the report type
          </Text>
        </View>
        <Text style={s.sectionLbl}>SELECT REPORT TYPE</Text>
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

  // FINANCIAL YEAR
  const FYView = () => {
    const cat = getCat(filters.category) || getCat("GST")!;
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <WizardHeader
          title="📅  Financial Year"
          subtitle="Which year's document?"
          color={cat.color}
        />
        <ProgressBar />
        <Breadcrumbs />
        <View
          style={[
            s.hintBox,
            { backgroundColor: cat.bg, borderColor: cat.color + "44" },
          ]}
        >
          <Text style={{ fontSize: 36 }}>🗓️</Text>
          <Text style={[s.hintTitle, { color: cat.color }]}>
            Select the Financial Year
          </Text>
          <Text style={s.hintSub}>Tap the year you want to view</Text>
        </View>
        <Text style={s.sectionLbl}>SELECT YEAR</Text>
        {FINANCIAL_YEARS.map((fy) => (
          <Pressable
            key={fy}
            style={({ pressed }) => [
              s.fyCard,
              { borderColor: cat.color + "55" },
              pressed && s.pressed,
            ]}
            onPress={() => {
              if (filters.category === "GST")
                goTo("month", { financialYear: fy });
              else goTo("results", { financialYear: fy });
            }}
          >
            <View style={[s.fyIcon, { backgroundColor: cat.color + "18" }]}>
              <Ionicons name="calendar" size={30} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fySmall}>Financial Year</Text>
              <Text style={[s.fyBig, { color: cat.color }]}>FY {fy}</Text>
            </View>
            <View style={[s.optArrow, { backgroundColor: cat.color }]}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          </Pressable>
        ))}
        <Pressable
          style={s.skipCard}
          onPress={() => {
            if (filters.category === "GST")
              goTo("month", { financialYear: null });
            else goTo("results", { financialYear: null });
          }}
        >
          <Ionicons name="infinite-outline" size={20} color="#64748B" />
          <Text style={s.skipTxt}>Show all years</Text>
          <Ionicons
            name="chevron-forward"
            size={15}
            color="#94A3B8"
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
      </ScrollView>
    );
  };

  // MONTH
  const MonthView = () => {
    const cat = getCat(filters.category) || getCat("GST")!;
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <WizardHeader
          title="🌙  Month"
          subtitle="Which month's GST?"
          color={cat.color}
        />
        <ProgressBar />
        <Breadcrumbs />
        <View
          style={[
            s.hintBox,
            { backgroundColor: cat.bg, borderColor: cat.color + "44" },
          ]}
        >
          <Text style={{ fontSize: 36 }}>📆</Text>
          <Text style={[s.hintTitle, { color: cat.color }]}>
            Select the Month
          </Text>
          <Text style={s.hintSub}>Tap the month for your GST report</Text>
        </View>
        <Text style={s.sectionLbl}>SELECT MONTH</Text>
        <View style={s.monthGrid}>
          {MONTHS.map((m) => (
            <Pressable
              key={m}
              style={({ pressed }) => [
                s.monthCard,
                { borderColor: cat.color + "55" },
                pressed && s.pressed,
              ]}
              onPress={() => goTo("results", { month: m })}
            >
              <Text style={[s.monthShort, { color: cat.color }]}>
                {m.slice(0, 3)}
              </Text>
              <Text style={s.monthFull}>{m}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={s.skipCard}
          onPress={() => goTo("results", { month: null })}
        >
          <Ionicons name="infinite-outline" size={20} color="#64748B" />
          <Text style={s.skipTxt}>Show all months</Text>
          <Ionicons
            name="chevron-forward"
            size={15}
            color="#94A3B8"
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
      </ScrollView>
    );
  };

  // RESULTS
  const ResultsView = () => {
    const cat = getCat(filters.category) || getCat("GST")!;
    const isLicence = filters.category === "LICENCE";
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
        {/* Header */}
        <View style={[s.resultsHeader, { backgroundColor: cat.color }]}>
          <Pressable style={s.backBtnWhite} onPress={goBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={cat.color} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.resultsTitleTxt}>
              {cat.emoji} {cat.label}
            </Text>
            <Text style={s.resultsSubTxt}>{subtitle}</Text>
          </View>
        </View>
        <Breadcrumbs />

        {/* "Back to categories" button */}
        <Pressable style={s.newSearchBtn} onPress={goHome}>
          <Ionicons name="grid-outline" size={15} color="#4F46E5" />
          <Text style={s.newSearchTxt}>Back to Categories</Text>
        </Pressable>

        {loading ? (
          <View style={s.centerState}>
            <ActivityIndicator size="large" color={cat.color} />
            <Text style={s.centerTxt}>Fetching your documents…</Text>
          </View>
        ) : isLicence && !filtered.length ? (
          <FlatList
            data={LICENCE_DOCS}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
            renderItem={({ item }) => (
              <View style={s.licCard}>
                <View
                  style={[s.licIcon, { backgroundColor: item.color + "18" }]}
                >
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.licName}>{item.label}</Text>
                  <Text style={s.licDesc}>{item.desc}</Text>
                </View>
                <View style={s.noFileBadge}>
                  <Text style={s.noFileTxt}>No file</Text>
                </View>
              </View>
            )}
          />
        ) : !filtered.length ? (
          <View style={s.centerState}>
            <Text style={{ fontSize: 52 }}>🗂️</Text>
            <Text style={s.emptyTitle}>No Documents Found</Text>
            <Text style={s.centerTxt}>
              No documents uploaded for this filter.
            </Text>
            <Pressable
              style={[s.retryBtn, { backgroundColor: cat.color }]}
              onPress={goHome}
            >
              <Ionicons name="grid-outline" size={18} color="#fff" />
              <Text style={s.retryTxt}>Back to Categories</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refreshDocs} />
            }
            ListHeaderComponent={
              <View
                style={[
                  s.countBanner,
                  { backgroundColor: cat.bg, borderColor: cat.color + "44" },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color={cat.color} />
                <Text style={[s.countTxt, { color: cat.color }]}>
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
                    s.docCard,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => Linking.openURL(item.cloudinaryUrl)}
                >
                  <View
                    style={[
                      s.docIconBox,
                      { backgroundColor: c?.bg || "#EEF2FF" },
                    ]}
                  >
                    <Ionicons
                      name={getDocIcon(item.name) as any}
                      size={24}
                      color={c?.color || "#4F46E5"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.docName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={s.docMeta}>
                      {item.category}
                      {item.subcategory ? ` › ${item.subcategory}` : ""}
                      {item.financialYear
                        ? `  •  FY ${item.financialYear}`
                        : ""}
                      {item.month ? `  •  ${item.month}` : ""}
                    </Text>
                    <Text style={s.docDate}>
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.openBtn,
                      { backgroundColor: c?.color || "#4F46E5" },
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

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <View style={s.root}>
      {/* ── Gradient header (always visible) ── */}
      <LinearGradient
        colors={[Colors.light.gradientStart, Colors.light.gradientEnd]}
        style={[s.header, { paddingTop: insets.top + webTopInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{greeting()}</Text>
            <View style={s.nameRow}>
              <Text style={s.userName}>{user?.name || "User"}</Text>
              <View style={s.premiumBadge}>
                <Ionicons name="star" size={11} color="#fff" />
                <Text style={s.premiumTxt}>Premium</Text>
              </View>
            </View>
            {user?.businessName && (
              <View style={s.businessTag}>
                <Ionicons
                  name="business-outline"
                  size={13}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={s.businessName}>{user.businessName}</Text>
              </View>
            )}
          </View>

          <View style={s.headerActions}>
            <Pressable
              onPress={() => router.push("/(client)/notifications" as any)}
              hitSlop={10}
            >
              <View>
                <Ionicons name="notifications-outline" size={25} color="#fff" />
                {unreadCount > 0 && (
                  <View style={s.notifBadge}>
                    <Text style={s.notifBadgeTxt}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable onPress={handleLogout} hitSlop={10}>
              <Ionicons name="log-out-outline" size={25} color="#fff" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* ── Wizard content (animated) ── */}
      <Animated.View
        style={[
          { flex: 1, backgroundColor: "#F1F5F9" },
          { transform: [{ translateX: slideX }] },
        ]}
      >
        {screen === "home" && <HomeView />}
        {screen === "gst_sub" && <GstSubView />}
        {screen === "fy" && <FYView />}
        {screen === "month" && <MonthView />}
        {screen === "results" && <ResultsView />}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light.background },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF8C00",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  premiumTxt: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
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
  headerActions: { flexDirection: "row", gap: 18, alignItems: "center" },
  notifBadge: {
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
  notifBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },

  // Dashboard home
  dashWelcome: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#0891B2",
  },
  dashWelcomeTxt: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#334155",
  },

  sectionLbl: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#94A3B8",
    letterSpacing: 1.4,
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 16,
  },

  // Category cards (HOME screen — the main 4 options)
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  catIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  catTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  catSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },
  catDesc: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
    marginTop: 4,
  },
  catArrow: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  // Quick actions
  quickRow: { flexDirection: "row", marginHorizontal: 16, gap: 12 },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quickTxt: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1E293B",
    flex: 1,
  },
  quickBadge: {
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  quickBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },

  // Wizard header
  wizardHeader: {
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
  wizardTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#1E293B" },
  wizardSub: {
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
  progressTxt: {
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
  crumbTxt: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#4F46E5" },

  // Hint box
  hintBox: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 2,
    borderColor: "#C7D2FE",
    gap: 8,
  },
  hintTitle: {
    fontSize: 17,
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

  // Option card (GST sub-type)
  optCard: {
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
  optEmoji: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
  },
  optLabel: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  optArrow: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

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
  fyIcon: {
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

  // Skip
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
  skipTxt: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#64748B" },

  // Results header
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backBtnWhite: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  resultsTitleTxt: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  resultsSubTxt: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
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
  newSearchTxt: {
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
  countTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // Doc card
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

  // Empty / loading
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 14,
  },
  centerTxt: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    textAlign: "center",
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#334155" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },

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
  noFileTxt: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#D97706" },

  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
