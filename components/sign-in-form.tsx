"use client";

import Link from "next/link";
import { useState } from "react";
import { track } from "@/lib/analytics";

interface Props {
  googleEnabled: boolean;
  next: string;
  error?: string;
}

export function SignInForm({ googleEnabled, next, error }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState(error ?? "");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, next }),
      });
      const data = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "We could not sign you in. Please try again.");
        return;
      }
      track("sign_up", { method: "email" });
      window.location.href = data.redirect ?? "/account";
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
      {googleEnabled && (
        <>
          <a
            href="/api/auth/google"
            className="btn btn-outline w-full"
            aria-label="Continue with Google"
          >
            <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
              />
              <path
                fill="#FBBC05"
                d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
              />
            </svg>
            Continue with Google
          </a>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="field-label">Your name</span>
          <input
            required
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adaeze Okafor"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="field-label">Email address</span>
          <input
            required
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        {message && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {message}
          </p>
        )}

        <button type="submit" disabled={status === "sending"} className="btn btn-primary w-full">
          {status === "sending" ? "Signing in…" : "Continue with email"}
        </button>
      </form>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        An account lets you see your order history and track deliveries. You can also check out as a
        guest —{" "}
        <Link href="/shop" className="underline">
          continue shopping
        </Link>{" "}
        without signing in.
      </p>
    </div>
  );
}

/**
 * Staff sign-in, deliberately kept off the customer page so the public site
 * never advertises that an admin back door exists. Reached only by someone
 * who already knows the address, and still gated by the access code.
 */
export function StaffSignInPanel({ error }: { error?: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [message, setMessage] = useState(error ?? "");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Staff", email, admin_code: code, next: "/admin" }),
      });
      const data = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) {
        setStatus("idle");
        setMessage(data.error ?? "Sign-in failed.");
        return;
      }
      window.location.href = data.redirect ?? "/admin";
    } catch {
      setStatus("idle");
      setMessage("Network error — please try again.");
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="field-label">Staff email</span>
          <input
            required
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block">
          <span className="field-label">Access code</span>
          <input
            required
            type="password"
            className="field"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {message && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {message}
          </p>
        )}

        <button type="submit" disabled={status === "sending"} className="btn btn-primary w-full">
          {status === "sending" ? "Signing in…" : "Staff sign in"}
        </button>
      </form>

      <p className="mt-5 text-xs text-muted">
        <Link href="/sign-in" className="underline">
          Customer sign in
        </Link>
      </p>
    </div>
  );
}
