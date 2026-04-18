import Image from "next/image";

import { cn } from "@/lib/utils/cn";

export function RemoteImage({
  src,
  alt,
  className,
  sizes = "100vw",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={900}
      unoptimized
      sizes={sizes}
      priority={priority}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
