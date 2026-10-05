import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { imageUrl } from "./lib/api";
import { useCart } from "./lib/cart-store";
import { colors, formatNaira, fonts } from "./lib/theme";

/**
 * The cart tab.
 *
 * Every line here came from the server on the last poll or tap — there is no
 * local copy — so what you see is what the website sees for the same account.
 */
export function CartScreen({ onShop }: { onShop: () => void }) {
  const { lines, count, subtotal, loading, syncing, error, setQuantity, remove } = useCart();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.note}>
          Add a gift here or on the website — it appears in both.
        </Text>
        <Pressable style={styles.button} onPress={onShop}>
          <Text style={styles.buttonText}>Browse gifts</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.syncRow}>
        <Text style={styles.syncText}>
          {syncing ? "Syncing…" : "Synced with lisbee.vercel.app"}
        </Text>
        <Text style={styles.syncCount}>
          {count} item{count === 1 ? "" : "s"}
        </Text>
      </View>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}

      {lines.map((line) => (
        <View key={line.slug} style={styles.cartRow}>
          {line.image ? (
            <Image source={{ uri: imageUrl(line.image) ?? "" }} style={styles.cartImage} />
          ) : (
            <View style={[styles.cartImage, styles.placeholder]} />
          )}
          <View style={styles.cartInfo}>
            <Text style={styles.cardName}>{line.name}</Text>
            <Text style={styles.price}>{formatNaira(line.price)}</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepButton}
                onPress={() => void setQuantity(line.slug, line.quantity - 1)}
              >
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{line.quantity}</Text>
              <Pressable
                style={styles.stepButton}
                onPress={() => void setQuantity(line.slug, line.quantity + 1)}
              >
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.cartRight}>
            <Text style={styles.lineTotal}>{formatNaira(line.price * line.quantity)}</Text>
            <Pressable onPress={() => void remove(line.slug)}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>{formatNaira(subtotal)}</Text>
      </View>
      <Text style={styles.note}>
        Delivery is confirmed at checkout. Pay by bank transfer using the details on
        the website.
      </Text>
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
  syncRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncText: { fontSize: 12, color: colors.green },
  syncCount: { fontSize: 12, color: colors.muted },
  inlineError: { color: colors.red, fontSize: 13 },
  cartRow: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
  },
  cartImage: { width: 56, height: 56, borderRadius: 10 },
  placeholder: { backgroundColor: colors.cream },
  cartInfo: { flex: 1, gap: 4 },
  cartRight: { alignItems: "flex-end", justifyContent: "space-between" },
  cardName: { fontSize: 15, fontWeight: "600", color: colors.espresso },
  price: { fontSize: 14, color: colors.cocoa },
  lineTotal: { fontWeight: "700", color: colors.espresso },
  remove: { fontSize: 12, color: colors.red },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 16, color: colors.espresso },
  stepValue: {
    fontWeight: "600",
    color: colors.espresso,
    minWidth: 16,
    textAlign: "center",
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 14,
  },
  totalLabel: { fontSize: 15, color: colors.cocoa },
  totalValue: { fontSize: 17, fontWeight: "700", color: colors.espresso },
  emptyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.espresso },
  note: { fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: "center" },
  button: {
    backgroundColor: colors.espresso,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonText: { color: colors.white, fontWeight: "600" },
});
