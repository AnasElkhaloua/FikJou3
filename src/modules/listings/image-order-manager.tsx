"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";

type ManagedImage = Readonly<{ deliveryUrl: string; id: string }>;

export function ImageOrderManager({
  images: initialImages,
  labels,
}: Readonly<{
  images: readonly ManagedImage[];
  labels: { down: string; image: string; remove: string; up: string };
}>) {
  const [images, setImages] = useState([...initialImages]);

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= images.length) return;
    setImages((current) => {
      const next = [...current];
      const [entry] = next.splice(index, 1);
      if (entry) next.splice(target, 0, entry);
      return next;
    });
  }

  return (
    <div className="image-order-list">
      {images.map((image, index) => (
        <div className="image-order-item" key={image.id}>
          {/* eslint-disable-next-line @next/next/no-img-element -- authenticated local/provider image URL */}
          <img alt={`${labels.image} ${index + 1}`} src={image.deliveryUrl} />
          <input name="imageOrder" type="hidden" value={image.id} />
          <div className="image-order-actions">
            <button
              aria-label={labels.up}
              disabled={index === 0}
              onClick={() => move(index, -1)}
              type="button"
            >
              <ArrowUp aria-hidden="true" size={18} />
            </button>
            <button
              aria-label={labels.down}
              disabled={index === images.length - 1}
              onClick={() => move(index, 1)}
              type="button"
            >
              <ArrowDown aria-hidden="true" size={18} />
            </button>
          </div>
          <label className="check-field compact">
            <input name="removeImageId" type="checkbox" value={image.id} />
            <span>{labels.remove}</span>
          </label>
        </div>
      ))}
    </div>
  );
}
