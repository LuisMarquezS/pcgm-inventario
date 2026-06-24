/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import type { ReactNode } from "react";

function isRemoteImage(src: string) {
  return /^https?:\/\//i.test(src);
}

export function ProductImagePreview({
  src,
  alt,
  fallback,
}: {
  src?: string | null;
  alt: string;
  fallback: ReactNode;
}) {
  if (!src) return <>{fallback}</>;

  if (isRemoteImage(src)) {
    return <img src={src} alt={alt} className="h-full w-full object-cover" referrerPolicy="no-referrer" />;
  }

  return <Image src={src} alt={alt} fill className="object-cover" />;
}
