"use client";

/** Posts to the sign-out route, which clears the session and returns home. */
export function SignOutButton({ className = "btn btn-outline btn-sm" }: { className?: string }) {
  return (
    <form action="/api/auth/signout" method="post">
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
