"use client";

import Image from "next/image";
import { useState } from "react";

/** Main image + thumbnail strip for the product page. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const list = images.length > 0 ? images : [];
  const [active, setActive] = useState(0);
  const current = list[active] ?? null;

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[2rem] border border-dashed border-line bg-sand text-sm text-muted">
        Product image coming soon
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-line bg-sand">
        <Image
          src={current}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {list.length > 1 && (
        <div className="mt-4 flex gap-3">
          {list.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 overflow-hidden rounded-2xl border-2 transition ${
                i === active ? "border-honey" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
