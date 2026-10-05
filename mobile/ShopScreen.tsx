import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { addToCart, fetchProducts, imageUrl, type Product, type SessionUser } from "./lib/api";
import { useCart } from "./lib/cart-store";
import { colors, formatNaira, fonts } from "./lib/theme";

export function ShopScreen({
  user,
  onRequireSignIn,
}: {
  user: SessionUser | null;
  onRequireSignIn: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const { refresh } = useCart();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts((await fetchProducts()).products);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach LisBee.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(product: Product) {
    setAdding(product.slug);
    try {
      await addToCart(product.slug, 1);
      // Pull the authoritative cart so the badge matches the server immediately.
      await refresh();
    } catch {
      // Surfaced on the Cart tab, which owns the error display.
    } finally {
      setAdding(null);
    }
  }

  if (loading && products.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Can’t reach LisBee</Text>
        <Text style={styles.note}>{error}</Text>
        <Pressable style={styles.button} onPress={() => void load()}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
    >
      {!user ? (
        <Pressable style={styles.signInHint} onPress={onRequireSignIn}>
          <Text style={styles.signInHintText}>
            Sign in to share this cart with your website account →
          </Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionTitle}>Gifts</Text>
      {products.map((product) => {
        const soldOut = product.stock_status === "out_of_stock";
        return (
          <View key={product.slug} style={styles.card}>
            {product.image ? (
              <Image
                source={{ uri: imageUrl(product.image) ?? "" }}
                style={styles.cardImage}
              />
            ) : (
              <View style={[styles.cardImage, styles.placeholder]} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{product.name}</Text>
              <Text style={styles.cardTagline}>{product.tagline}</Text>
              <Text style={styles.price}>{formatNaira(product.price)}</Text>
            </View>
            <Pressable
              style={[styles.addButton, soldOut && styles.addButtonDisabled]}
              disabled={soldOut || adding === product.slug}
              onPress={() => void handleAdd(product)}
            >
              <Text style={styles.addButtonText}>
                {soldOut ? "Sold out" : adding === product.slug ? "…" : "Add"}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 12,
  },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.espresso },
  card: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
  },
  cardImage: { width: 64, height: 64, borderRadius: 10 },
  placeholder: { backgroundColor: colors.cream },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: "600", color: colors.espresso },
  cardTagline: { fontSize: 12, color: colors.muted },
  price: { fontSize: 14, color: colors.cocoa, marginTop: 2 },
  addButton: {
    backgroundColor: colors.espresso,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  addButtonDisabled: { backgroundColor: colors.line },
  addButtonText: { color: colors.white, fontWeight: "600", fontSize: 13 },
  button: {
    backgroundColor: colors.espresso,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonText: { color: colors.white, fontWeight: "600" },
  emptyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.espresso },
  note: { fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: "center" },
  signInHint: { backgroundColor: colors.cream, borderRadius: 12, padding: 12 },
  signInHintText: { color: colors.cocoa, fontSize: 13 },
});
