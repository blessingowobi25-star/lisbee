"use client";

import { track } from "@/lib/analytics";
import { DEFAULT_WHATSAPP, whatsappLink } from "@/lib/format";

function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.25 8.21Z" />
    </svg>
  );
}

/** Floating WhatsApp button, present on mobile and desktop. */
export function WhatsAppFab({ number = DEFAULT_WHATSAPP }: { number?: string }) {
  return (
    <a
      href={whatsappLink(number, "Hi LisBee, I'd like to ask a question about your gifts.")}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { location: "floating_button" })}
      aria-label="Chat with LisBee on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f6e43] text-white shadow-[0_12px_30px_-8px_rgba(36,17,9,0.5)] transition-transform hover:scale-105 md:bottom-7 md:right-7"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}

export { WhatsAppIcon };
