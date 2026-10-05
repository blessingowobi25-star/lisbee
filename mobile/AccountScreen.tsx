import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { signIn, type SessionUser } from "./lib/api";
import { colors, fonts } from "./lib/theme";

/**
 * Sign in with the SAME email as the website.
 *
 * There is no mobile-only account: the token endpoint looks the user up by email
 * and returns a bearer token for the existing account, which is why the cart on
 * this phone matches the cart on the website.
 */
export function AccountScreen({
  user,
  onSignedIn,
  onSignOut,
}: {
  user: SessionUser | null;
  onSignedIn: (user: SessionUser) => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await signIn(name.trim(), email.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.accountCard}>
          <Text style={styles.accountName}>{user.name}</Text>
          <Text style={styles.accountEmail}>{user.email}</Text>
          <Text style={styles.accountBadge}>
            {user.role === "admin" ? "Staff account" : "Customer account"}
          </Text>
        </View>
        <Text style={styles.note}>
          Signed in on this phone and on lisbee.vercel.app with the same account, so
          your cart is shared between them.
        </Text>
        <Pressable style={styles.buttonOutline} onPress={onSignOut}>
          <Text style={styles.buttonOutlineText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Sign in</Text>
      <Text style={styles.note}>
        Use the same email you use on the website. No password needed.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}

      <Pressable
        style={[styles.button, (busy || !name || !email) && styles.buttonDisabled]}
        disabled={busy || !name || !email}
        onPress={() => void handleSignIn()}
      >
        <Text style={styles.buttonText}>{busy ? "Signing in…" : "Sign in"}</Text>
      </Pressable>

      <Text style={styles.note}>
        You can browse and build a cart without signing in. Sign in to see the same
        cart you started on the website.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.espresso },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.espresso,
  },
  inlineError: { color: colors.red, fontSize: 13 },
  button: {
    backgroundColor: colors.espresso,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: colors.white, fontWeight: "600" },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.espresso,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonOutlineText: { color: colors.espresso, fontWeight: "600" },
  accountCard: {
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 18,
  },
  accountName: { fontFamily: fonts.display, fontSize: 20, color: colors.espresso },
  accountEmail: { color: colors.cocoa },
  accountBadge: { color: colors.gold, fontSize: 12, marginTop: 4 },
  note: { fontSize: 12, color: colors.muted, lineHeight: 18 },
});
