import { ImageIcon } from "lucide-react";
import Image from "next/image";

import type { MarketplaceListingImage } from "@/modules/listings/detail-service";
import { cn } from "@/lib/utils";

export function ListingGallery({
  images,
  listingName,
  label,
}: {
  images: MarketplaceListingImage[];
  listingName: string;
  label: string;
}) {
  if (!images.length) {
    return (
      <section
        aria-label={label}
        className="grid aspect-[16/8] place-items-center overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_25%_20%,hsl(var(--accent)/0.18),transparent_35%),linear-gradient(145deg,hsl(var(--secondary)),hsl(var(--muted)))]"
      >
        <ImageIcon
          className="size-14 text-muted-foreground/50"
          aria-hidden="true"
        />
      </section>
    );
  }

  return (
    <section
      aria-label={label}
      className="grid gap-2 overflow-hidden rounded-3xl md:grid-cols-2 lg:auto-rows-[15rem] lg:grid-cols-4"
    >
      {images.map((image, index) => (
        <figure
          key={image.id}
          className={cn(
            "relative min-h-56 overflow-hidden bg-secondary",
            index === 0 && "md:col-span-2 lg:row-span-2 lg:min-h-0",
          )}
        >
          <Image
            src={image.url}
            alt={image.altText || `${listingName} ${index + 1}`}
            fill
            priority={index === 0}
            sizes={
              index === 0
                ? "(min-width: 1024px) 50vw, 100vw"
                : "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            }
            className="object-cover transition duration-500 hover:scale-[1.02]"
          />
        </figure>
      ))}
    </section>
  );
}
