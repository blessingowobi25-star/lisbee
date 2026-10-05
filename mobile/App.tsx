import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadSession, signOut, type SessionUser } from "./lib/api";
import { CartProvider, useCart } from "./lib/cart-store";
import { ShopScreen } from "./ShopScreen";
import { CartScreen } from "./CartScreen";
import { AccountScreen } from "./AccountScreen";
import { colors, fonts } from "./lib/theme";

type Tab = "shop" | "cart" | "account";

export default function App() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <CartProvider>
        <Shell />
      </CartProvider>
    </SafeAreaView>
  );
}

function Shell() {
  const [tab, setTab] = useState<Tab>("shop");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadSession()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.brand}>LisBee</Text>
        <Text style={styles.tagline}>Thoughtfully given. Happily received.</Text>
      </View>

      <View style={styles.body}>
        {booting ? null : (
          <>
            {tab === "shop" && <ShopScreen onRequireSignIn={() => setTab("account")} user={user} />}
            {tab === "cart" && <CartScreen onShop={() => setTab("shop")} />}
            {tab === "account" && (
              <AccountScreen user={user} onSignedIn={setUser} onSignOut={handleSignOut} />
            )}
          </>
        )}
      </View>

      <TabBar tab={tab} onChange={setTab} />
    </>
  );
}

/** The cart badge reads from the same server-backed store the Cart tab uses. */
function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const { count } = useCart();
  const tabs: { key: Tab; label: string }[] = [
    { key: "shop", label: "Shop" },
    { key: "cart", label: "Cart" },
    { key: "account", label: "Account" },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((t) => {
        const active = tab === t.key;
        return (
          <Pressable
            key={t.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(t.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {t.label}
              {t.key === "cart" && count > 0 ? ` (${count})` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: { fontFamily: fonts.display, fontSize: 30, color: colors.espresso },
  tagline: { fontSize: 12, color: colors.muted, marginTop: 2 },
  body: { flex: 1 },
  tabBar: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.line },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabActive: { borderTopWidth: 2, borderTopColor: colors.espresso },
  tabText: { fontSize: 13, color: colors.muted },
  tabTextActive: { color: colors.espresso, fontWeight: "700" },
});
