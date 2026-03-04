import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// ─── Brand Palette (exact match to PDF) ──────────────────────────────────────
const C = {
  navy: "#0B1F4B", // deep navy from PDF background
  navyMid: "#0F2D6B", // hero bg
  blue: "#1A4FBF", // primary blue
  blueVibrant: "#1d4ed8", // CTA
  teal: "#0891B2", // accent teal (PDF diagonal bands)
  tealDark: "#0E7490",
  tealLight: "#CFFAFE",
  gold: "#C9A84C", // gold ring & accents (PDF logo)
  goldLight: "#F5E6B8",
  white: "#FFFFFF",
  offWhite: "#F4F8FF",
  slate: "#334155",
  slateMid: "#64748B",
  slateLight: "#94A3B8",
  border: "#E2EAF8",
  cardBg: "#FFFFFF",
};

// ─── Fade + slide animation ────────────────────────────────────────────────────
function useFadeSlide(delay = 0, fromY = 30) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(fromY)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: 700,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY: ty }] };
}

// ─── Animated count-up ────────────────────────────────────────────────────────
function CountUp({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix: string;
  label: string;
}) {
  const val = useRef(new Animated.Value(0)).current;
  const displayed = useRef(0);
  const [text, setText] = React.useState("0");

  useEffect(() => {
    const listener = val.addListener(({ value }) => {
      const rounded = Math.floor(value);
      if (rounded !== displayed.current) {
        displayed.current = rounded;
        setText(String(rounded));
      }
    });
    Animated.timing(val, {
      toValue: target,
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => val.removeListener(listener);
  }, []);

  return (
    <View style={s.statItem}>
      <View style={s.statNumRow}>
        <Text style={s.statNum}>{text}</Text>
        <Text style={s.statSuffix}>{suffix}</Text>
      </View>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Diagonal Slash Decorator (signature motif from PDF) ─────────────────────
function SlashDecor({ color = C.teal, opacity = 0.12, style }: any) {
  return (
    <View
      style={[{ position: "absolute", overflow: "hidden" }, style]}
      pointerEvents="none"
    >
      <View
        style={{
          width: 180,
          height: 400,
          backgroundColor: color,
          opacity,
          transform: [{ rotate: "28deg" }],
          borderRadius: 32,
        }}
      />
    </View>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  const anim = useFadeSlide(50);
  return (
    <Animated.View style={[s.sectionHead, anim]}>
      <View style={s.sectionAccentLine} />
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        {sub ? <Text style={s.sectionSub}>{sub}</Text> : null}
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const router = useRouter();
  const webTop = Platform.OS === "web" ? 0 : 0;

  // Subtle hero shimmer
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  const heroGrad = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [C.navyMid, "#0D2660"],
  });

  const logoAnim = useFadeSlide(0, 40);
  const nameAnim = useFadeSlide(120, 30);
  const tagAnim = useFadeSlide(220, 20);
  const pillAnim = useFadeSlide(340, 20);
  const btnAnim = useFadeSlide(460, 20);

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false} bounces>
      {/* ════════════════════════════════
          HERO
      ════════════════════════════════ */}
      <Animated.View style={[s.hero, { backgroundColor: heroGrad }]}>
        {/* PDF-inspired diagonal slash bands */}
        <SlashDecor
          color={C.teal}
          opacity={0.15}
          style={{ top: -80, right: -50 }}
        />
        <SlashDecor
          color={C.teal}
          opacity={0.08}
          style={{ top: 60, right: 40 }}
        />
        <SlashDecor
          color={C.blue}
          opacity={0.1}
          style={{ bottom: -100, left: -60 }}
        />

        {/* Logo seal — mirrors PDF circular emblem */}
        <Animated.View style={[s.sealWrap, logoAnim]}>
          {/* Outer gold ring */}
          <View style={s.sealOuter}>
            {/* Dashed tick marks around ring */}
            {Array.from({ length: 24 }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.sealTick,
                  {
                    transform: [
                      { rotate: `${i * 15}deg` },
                      { translateY: -38 },
                    ],
                  },
                ]}
              />
            ))}
            {/* Inner teal ring */}
            <View style={s.sealInner}>
              {/* Center field */}
              <View style={s.sealCenter}>
                <Text style={s.sealZ}>Z</Text>
                <Text style={s.sealLetterSmall}>AIDONN</Text>
              </View>
            </View>
          </View>
          {/* "TAXATION FARM" arc label */}
          <Text style={s.sealArcText}>✦ TAXATION FARM ✦</Text>
        </Animated.View>

        {/* Brand name */}
        <Animated.View style={[s.brandRow, nameAnim]}>
          <Text style={s.brandName}>ZAIDONN</Text>
        </Animated.View>

        {/* Ornamental divider */}
        <Animated.View style={[s.ornDivider, tagAnim]}>
          <View style={s.ornLine} />
          <View style={s.ornDiamond} />
          <View style={s.ornLine} />
        </Animated.View>

        {/* Taglines */}
        <Animated.View style={tagAnim}>
          <Text style={s.heroTag1}>
            Trusted Taxation Consultants & Advisors
          </Text>
          <Text style={s.heroTag2}>
            Driving Compliance · Creating Prosperity
          </Text>
        </Animated.View>

        {/* Service pills row */}
        <Animated.View style={[s.pillsRow, pillAnim]}>
          {["GST", "ITR", "Licences", "Accounts & Audit"].map((p) => (
            <View key={p} style={s.pill}>
              <Text style={s.pillTxt}>{p}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Login CTA */}
        <Animated.View style={btnAnim}>
          <TouchableOpacity
            style={s.heroBtn}
            onPress={() => router.push("/login")}
            activeOpacity={0.88}
          >
            <Text style={s.heroBtnTxt}>Login to Your Portal</Text>
            <View style={s.heroBtnArrow}>
              <Ionicons name="arrow-forward" size={16} color={C.white} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Director nameplate at bottom */}
        <Animated.View style={[s.nameplate, tagAnim]}>
          <View style={s.nameplateInner}>
            <View style={s.nameplateAvatar}>
              <Text style={s.nameplateAvatarTxt}>MZ</Text>
            </View>
            <View>
              <Text style={s.nameplateTitle}>Md Zaid</Text>
              <Text style={s.nameplateRole}>Director · Zaidonn</Text>
            </View>
            <View style={s.nameplateVerified}>
              <Ionicons name="checkmark-circle" size={16} color={C.teal} />
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ════════════════════════════════
          STATS BAND (overlapping hero)
      ════════════════════════════════ */}
      <View style={s.statsBand}>
        <CountUp target={10} suffix="+" label={"Years\nExperience"} />
        <View style={s.statDivider} />
        <CountUp target={500} suffix="+" label={"Happy\nClients"} />
        <View style={s.statDivider} />
        <CountUp target={100} suffix="%" label={"Complete\nTransparency"} />
      </View>

      {/* ════════════════════════════════
          ABOUT STRIP
      ════════════════════════════════ */}
      <View style={s.aboutWrap}>
        <View style={s.aboutCard}>
          <View style={s.aboutLeft}>
            <View style={s.aboutBadge}>
              <Ionicons name="business-outline" size={18} color={C.blue} />
            </View>
            <Text style={s.aboutBadgeLabel}>About Us</Text>
          </View>
          <Text style={s.aboutBody}>
            A professional taxation & advisory firm based in{" "}
            <Text style={s.aboutEm}> West Bengal</Text>. Led by{" "}
            <Text style={s.aboutEm}>Md Zaid (Director)</Text>, we simplify GST,
            ITR, licences and accounts for businesses of every size across
            India.
          </Text>
          <View style={s.aboutContactRow}>
            <View style={s.aboutDot} />
            <Ionicons name="globe-outline" size={13} color={C.teal} />
            <Text style={s.aboutContact}>www.zaidonn.com</Text>
          </View>
        </View>
      </View>

      {/* ════════════════════════════════
          SERVICES
      ════════════════════════════════ */}
      <SectionHead
        title="Our Services"
        sub="Expert solutions for every compliance need"
      />
      <View style={s.servGrid}>
        {SERVICES.map((sv, i) => (
          <ServiceCard key={sv.title} {...sv} delay={i * 70} />
        ))}
      </View>

      {/* ════════════════════════════════
          WHO WE HELP
      ════════════════════════════════ */}
      <SectionHead
        title="Who We Help"
        sub="Serving clients across all business types"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.whoScroll}
      >
        {WHO.map((w, i) => (
          <View
            key={w.label}
            style={[s.whoCard, { marginLeft: i === 0 ? 20 : 0 }]}
          >
            <View style={[s.whoIcon, { backgroundColor: w.bg }]}>
              <Ionicons name={w.icon as any} size={24} color={w.color} />
            </View>
            <Text style={s.whoLabel}>{w.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ════════════════════════════════
          HOW WE WORK
      ════════════════════════════════ */}
      <SectionHead title="How We Work" sub="A transparent 4-step process" />
      <View style={s.stepsWrap}>
        {STEPS.map((st, i) => (
          <View key={st.title} style={s.stepRow}>
            <View style={s.stepNumCol}>
              <View
                style={[
                  s.stepNumCircle,
                  i === 0 && { backgroundColor: C.blue },
                ]}
              >
                <Text style={s.stepNumTxt}>{i + 1}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={s.stepConnector} />}
            </View>
            <View style={s.stepCard}>
              <View style={[s.stepIcon, { backgroundColor: st.bg }]}>
                <Ionicons name={st.icon as any} size={20} color={st.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.stepTitle}>{st.title}</Text>
                <Text style={s.stepDesc}>{st.desc}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════ */}
      <SectionHead
        title="Client Voices"
        sub="Trusted by hundreds across West Bengal"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.testScroll}
      >
        {TESTIMONIALS.map((t, i) => (
          <View key={i} style={[s.testCard, i === 0 && { marginLeft: 20 }]}>
            {/* Gold quote mark */}
            <Text style={s.testQuoteMark}>"</Text>
            {/* Stars */}
            <View style={s.testStars}>
              {[0, 1, 2, 3, 4].map((j) => (
                <Ionicons key={j} name="star" size={12} color={C.gold} />
              ))}
            </View>
            <Text style={s.testText}>"{t.text}"</Text>
            <View style={s.testAuthorRow}>
              <View style={s.testAvatar}>
                <Text style={s.testAvatarTxt}>{t.name[0]}</Text>
              </View>
              <View>
                <Text style={s.testName}>{t.name}</Text>
                <Text style={s.testRole}>{t.role}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ════════════════════════════════
          CONTACT
      ════════════════════════════════ */}
      <SectionHead title="Get In Touch" sub="We're always ready to help" />
      <View style={s.contactGrid}>
        {CONTACTS.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={s.contactCard}
            onPress={() => c.url && Linking.openURL(c.url)}
            activeOpacity={0.85}
          >
            <View style={[s.contactIcon, { backgroundColor: c.bg }]}>
              <Ionicons name={c.icon as any} size={22} color={c.color} />
            </View>
            <Text style={s.contactLabel}>{c.label}</Text>
            <Text style={s.contactVal} numberOfLines={2}>
              {c.val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ════════════════════════════════
          CTA BANNER
      ════════════════════════════════ */}
      <View style={s.ctaBanner}>
        <SlashDecor
          color={C.teal}
          opacity={0.2}
          style={{ top: -60, right: -40 }}
        />
        <SlashDecor
          color={C.gold}
          opacity={0.08}
          style={{ bottom: -80, left: -40 }}
        />
        <Text style={s.ctaTitle}>Ready to Stay Compliant?</Text>
        <Text style={s.ctaSub}>
          Let Zaidonn handle your taxes while you focus on growing your
          business.
        </Text>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => router.push("/login")}
          activeOpacity={0.88}
        >
          <Text style={s.ctaBtnTxt}>Login to Portal</Text>
          <Ionicons name="arrow-forward" size={16} color={C.blue} />
        </TouchableOpacity>
      </View>

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <View style={s.footer}>
        {/* Logo */}
        <View style={s.footerSeal}>
          <View style={s.footerSealRing}>
            <Text style={s.footerSealZ}>Z</Text>
          </View>
          <View>
            <Text style={s.footerBrand}>ZAIDONN</Text>
            <Text style={s.footerFarm}>TAXATION FARM</Text>
          </View>
        </View>

        <Text style={s.footerTagline}>
          Driving Compliance · Creating Prosperity
        </Text>

        {/* Service links */}
        <View style={s.footerLinks}>
          {["GST Filing", "ITR Filing", "Licences", "Accounts", "Audit"].map(
            (l) => (
              <Text key={l} style={s.footerLink}>
                {l}
              </Text>
            ),
          )}
        </View>

        <View style={s.footerDivider} />

        {/* Contact footer row */}
        <View style={s.footerContact}>
          <View style={s.footerContactItem}>
            <Ionicons name="call-outline" size={13} color={C.teal} />
            <Text style={s.footerContactTxt}>+91 7482049372</Text>
          </View>
        </View>

        <View style={s.footerDivider} />
        <Text style={s.footerCopy}>
          © 2026 Zaidonn Consult · All Rights Reserved
        </Text>
        <Text style={s.footerCredit}>Made with ❤️ by Webwiz</Text>
      </View>
    </ScrollView>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ icon, title, desc, color, bg, delay }: any) {
  const anim = useFadeSlide(delay, 20);
  return (
    <Animated.View style={[s.servCard, anim]}>
      <View style={[s.servIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={s.servTitle}>{title}</Text>
      <Text style={s.servDesc}>{desc}</Text>
      {/* Bottom accent bar */}
      <View style={[s.servAccentBar, { backgroundColor: color }]} />
    </Animated.View>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: "receipt-outline",
    title: "GST",
    desc: "Registration, Returns & Filing",
    color: C.teal,
    bg: "#CFFAFE30",
  },
  {
    icon: "calculator-outline",
    title: "ITR Filing",
    desc: "Individual & Business Returns",
    color: C.blueVibrant,
    bg: "#DBEAFE40",
  },
  {
    icon: "ribbon-outline",
    title: "Licences",
    desc: "Trade · FSSAI · UDYAM · P.TAX",
    color: C.gold,
    bg: "#FEF3C740",
  },
  {
    icon: "bar-chart-outline",
    title: "Accounts",
    desc: "Bookkeeping & Financial Audit",
    color: "#7C3AED",
    bg: "#EDE9FE40",
  },
  {
    icon: "document-text-outline",
    title: "Project Report",
    desc: "Business Plans & Statements",
    color: "#059669",
    bg: "#D1FAE540",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Compliance",
    desc: "Full Regulatory Compliance",
    color: "#DC2626",
    bg: "#FEE2E240",
  },
];

const WHO = [
  {
    icon: "storefront-outline",
    label: "Shop Owners",
    color: C.teal,
    bg: "#E0F7FA",
  },
  {
    icon: "rocket-outline",
    label: "Startups",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    icon: "laptop-outline",
    label: "Freelancers",
    color: "#059669",
    bg: "#D1FAE5",
  },
  {
    icon: "business-outline",
    label: "SMBs",
    color: C.blueVibrant,
    bg: "#DBEAFE",
  },
  {
    icon: "person-outline",
    label: "Individuals",
    color: C.gold,
    bg: "#FEF3C7",
  },
  {
    icon: "construct-outline",
    label: "Contractors",
    color: "#DC2626",
    bg: "#FEE2E2",
  },
];

const STEPS = [
  {
    icon: "chatbubble-outline",
    title: "Consultation",
    desc: "Free initial meeting to understand your needs",
    color: C.blueVibrant,
    bg: "#DBEAFE",
  },
  {
    icon: "document-attach-outline",
    title: "Document Collection",
    desc: "We guide exactly what documents are required",
    color: C.teal,
    bg: "#CFFAFE",
  },
  {
    icon: "cog-outline",
    title: "Processing & Filing",
    desc: "Our expert team handles everything precisely",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    icon: "checkmark-circle-outline",
    title: "Confirmation",
    desc: "Acknowledgement delivered directly to you",
    color: "#059669",
    bg: "#D1FAE5",
  },
];

const TESTIMONIALS = [
  {
    text: "Very smooth and simple process. Highly professional team.",
    name: "Rahul S.",
    role: "Shop Owner, Asansol",
  },
  {
    text: "GST filing done in one day! Saved my time and all the stress.",
    name: "Priya M.",
    role: "Freelancer",
  },
  {
    text: "Honest and transparent advisory. I trust them completely.",
    name: "Arjun K.",
    role: "Business Owner",
  },
  {
    text: "Best taxation consultants in Asansol. Highly recommended.",
    name: "Neha T.",
    role: "Startup Founder",
  },
];

const CONTACTS = [
  {
    icon: "call-outline",
    label: "Phone",
    val: "+91 7482049372",
    color: C.blueVibrant,
    bg: "#EFF6FF",
    url: "tel:+917482049372",
  },
  {
    icon: "mail-outline",
    label: "Email",
    val: "teamzaidonn\n@gmail.com",
    color: "#059669",
    bg: "#F0FDF4",
    url: "mailto:teamzaidonn@gmail.com",
  },
];

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { backgroundColor: C.offWhite },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingTop: 56,
    paddingBottom: 44,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
  },

  // Seal (logo)
  sealWrap: { alignItems: "center", marginBottom: 16 },
  sealOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2.5,
    borderColor: C.gold,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  sealTick: {
    position: "absolute",
    width: 2,
    height: 5,
    backgroundColor: C.gold,
    opacity: 0.5,
    borderRadius: 1,
  },
  sealInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    borderColor: `${C.teal}88`,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(8,145,178,0.1)",
  },
  sealCenter: { alignItems: "center" },
  sealZ: {
    fontSize: 30,
    fontWeight: "900",
    color: C.gold,
    letterSpacing: -1,
    lineHeight: 32,
  },
  sealLetterSmall: {
    fontSize: 8,
    fontWeight: "800",
    color: C.tealLight,
    letterSpacing: 3,
  },
  sealArcText: {
    fontSize: 10,
    color: `${C.gold}BB`,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginTop: 6,
  },

  // Brand
  brandRow: { alignItems: "center", marginBottom: 4 },
  brandName: {
    fontSize: 44,
    fontWeight: "900",
    color: C.white,
    letterSpacing: 10,
    textAlign: "center",
  },

  // Ornamental divider
  ornDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    width: 200,
  },
  ornLine: { flex: 1, height: 1, backgroundColor: `${C.gold}66` },
  ornDiamond: {
    width: 8,
    height: 8,
    backgroundColor: C.gold,
    opacity: 0.8,
    transform: [{ rotate: "45deg" }],
    marginHorizontal: 10,
  },

  // Taglines
  heroTag1: {
    fontSize: 15,
    fontWeight: "700",
    color: C.tealLight,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  heroTag2: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 5,
    letterSpacing: 0.8,
  },

  // Pills
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 22,
    justifyContent: "center",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  pillTxt: { fontSize: 12, color: C.white, fontWeight: "600" },

  // Hero button
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    paddingVertical: 16,
    paddingLeft: 32,
    paddingRight: 16,
    borderRadius: 50,
    backgroundColor: C.blueVibrant,
    shadowColor: C.blueVibrant,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  heroBtnTxt: {
    fontSize: 16,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.3,
  },
  heroBtnArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Nameplate
  nameplate: { marginTop: 28, width: "100%" },
  nameplateInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 14,
  },
  nameplateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  nameplateAvatarTxt: { fontSize: 14, fontWeight: "900", color: C.navy },
  nameplateTitle: { fontSize: 14, fontWeight: "700", color: C.white },
  nameplateRole: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  nameplateVerified: { marginLeft: "auto" },

  // ── Stats band ────────────────────────────────────────────────────────────
  statsBand: {
    flexDirection: "row",
    backgroundColor: C.white,
    marginHorizontal: 20,
    marginTop: -26,
    borderRadius: 22,
    paddingVertical: 22,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumRow: { flexDirection: "row", alignItems: "flex-end" },
  statNum: { fontSize: 30, fontWeight: "900", color: C.blue },
  statSuffix: {
    fontSize: 20,
    fontWeight: "900",
    color: C.teal,
    paddingBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: C.slateMid,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 16,
  },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 8 },

  // ── About ─────────────────────────────────────────────────────────────────
  aboutWrap: { padding: 20, paddingTop: 28 },
  aboutCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: C.teal,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  aboutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  aboutBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  aboutBadgeLabel: { fontSize: 15, fontWeight: "700", color: C.navy },
  aboutBody: { fontSize: 14, color: C.slate, lineHeight: 23 },
  aboutEm: { fontWeight: "700", color: C.blue },
  aboutContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    flexWrap: "wrap",
  },
  aboutContact: { fontSize: 12, color: C.slateMid },
  aboutDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.slateMid,
  },

  // ── Section head ──────────────────────────────────────────────────────────
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 36,
    marginBottom: 16,
  },
  sectionAccentLine: {
    width: 5,
    height: 44,
    borderRadius: 3,
    backgroundColor: C.teal,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.navy,
    letterSpacing: -0.3,
  },
  sectionSub: { fontSize: 12, color: C.slateMid, marginTop: 2 },

  // ── Services ──────────────────────────────────────────────────────────────
  servGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 12,
  },
  servCard: {
    width: (width - 52) / 2,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  servIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  servTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.navy,
    marginBottom: 5,
  },
  servDesc: { fontSize: 12, color: C.slateLight, lineHeight: 18 },
  servAccentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.7,
  },

  // ── Who ───────────────────────────────────────────────────────────────────
  whoScroll: { paddingRight: 20, gap: 12, paddingBottom: 4 },
  whoCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    width: 100,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  whoIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  whoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.slate,
    textAlign: "center",
  },

  // ── Steps ─────────────────────────────────────────────────────────────────
  stepsWrap: { paddingHorizontal: 20 },
  stepRow: { flexDirection: "row", gap: 14, marginBottom: 6 },
  stepNumCol: { alignItems: "center", width: 40 },
  stepNumCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.navyMid,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  stepNumTxt: { fontSize: 16, fontWeight: "900", color: C.white },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: C.border,
    marginVertical: 2,
  },
  stepCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.navy,
    marginBottom: 4,
  },
  stepDesc: { fontSize: 12, color: C.slateLight, lineHeight: 18 },

  // ── Testimonials ─────────────────────────────────────────────────────────
  testScroll: { paddingRight: 20, paddingBottom: 8 },
  testCard: {
    width: width * 0.7,
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 22,
    marginRight: 16,
    borderTopWidth: 4,
    borderTopColor: C.gold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    overflow: "hidden",
  },
  testQuoteMark: {
    fontSize: 64,
    color: `${C.gold}30`,
    position: "absolute",
    top: 0,
    left: 14,
    fontWeight: "900",
    lineHeight: 70,
  },
  testStars: { flexDirection: "row", gap: 2, marginBottom: 12 },
  testText: {
    fontSize: 14,
    color: C.slate,
    lineHeight: 23,
    fontStyle: "italic",
    marginBottom: 18,
  },
  testAuthorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  testAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.blueVibrant,
    justifyContent: "center",
    alignItems: "center",
  },
  testAvatarTxt: { fontSize: 14, fontWeight: "800", color: C.white },
  testName: { fontSize: 13, fontWeight: "800", color: C.navy },
  testRole: { fontSize: 11, color: C.slateMid, marginTop: 1 },

  // ── Contact ───────────────────────────────────────────────────────────────
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 8,
  },
  contactCard: {
    width: (width - 52) / 2,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.slateLight,
    letterSpacing: 1.2,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  contactVal: {
    fontSize: 13,
    fontWeight: "700",
    color: C.navy,
    lineHeight: 19,
  },

  // ── CTA Banner ────────────────────────────────────────────────────────────
  ctaBanner: {
    backgroundColor: C.navy,
    margin: 20,
    borderRadius: 26,
    padding: 32,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.white,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  ctaSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 26,
    paddingHorizontal: 10,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnTxt: { fontSize: 15, fontWeight: "800", color: C.blue },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: C.navy,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  footerSeal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  footerSealRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: C.gold,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(201,168,76,0.1)",
  },
  footerSealZ: { fontSize: 22, fontWeight: "900", color: C.gold },
  footerBrand: {
    fontSize: 24,
    fontWeight: "900",
    color: C.white,
    letterSpacing: 5,
  },
  footerFarm: {
    fontSize: 9,
    color: C.tealLight,
    letterSpacing: 4,
    marginTop: 1,
  },
  footerTagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 22,
    letterSpacing: 0.5,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    marginBottom: 8,
  },
  footerLink: { fontSize: 12, color: C.tealLight, fontWeight: "600" },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 16,
  },
  footerContact: {
    flexDirection: "row",
    gap: 24,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  footerContactItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerContactTxt: { fontSize: 11, color: "rgba(255,255,255,0.55)" },
  footerCopy: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 },
  footerCredit: { fontSize: 11, color: C.teal, marginTop: 4 },
});
