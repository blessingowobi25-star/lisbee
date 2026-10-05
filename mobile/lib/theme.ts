/** Colours mirrored from the website's Tailwind theme. */
export const colors = {
  espresso: "#241109",
  cocoa: "#4a3f38",
  muted: "#6e5c50",
  gold: "#a87b3f",
  line: "#e7dcd0",
  cream: "#faf6f0",
  white: "#ffffff",
  green: "#1f6b4a",
  red: "#9b2c2c",
};

export const fonts = {
  display: "Georgia",
  body: "System",
};

/** ₦20,000 — matching the site's formatNaira so both clients read identically. */
export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
