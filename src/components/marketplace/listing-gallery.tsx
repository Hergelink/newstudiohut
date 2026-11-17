"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

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
  const t = useTranslations("Gallery");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const active = activeIndex === null ? null : images[activeIndex];
  function move(direction: number) {
    setActiveIndex((current) =>
      current === null
        ? null
        : (current + direction + images.length) % images.length,
    );
  }
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
    <Dialog.Root
      open={activeIndex !== null}
      onOpenChange={(open) => {
        if (!open) setActiveIndex(null);
      }}
    >
      <section
        aria-label={label}
        className="grid gap-2 overflow-hidden rounded-3xl md:grid-cols-2 lg:auto-rows-[15rem] lg:grid-cols-4"
      >
        {images.map((image, index) => (
          <button
            type="button"
            key={image.id}
            aria-label={t("open", { index: index + 1 })}
            aria-haspopup="dialog"
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setActiveIndex(index);
            }}
            className={cn(
              "relative min-h-56 cursor-zoom-in overflow-hidden bg-secondary focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring",
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
          </button>
        ))}
      </section>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 text-white outline-none"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              move(1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              move(-1);
            }
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <Dialog.Title className="truncate text-base font-semibold sm:text-xl">
              {listingName}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t("close")}
              className="shrink-0 rounded-full bg-white/15 p-3 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div
            className="relative h-[65dvh] touch-pan-y sm:h-[72dvh]"
            onTouchStart={(event) => {
              const point = event.touches[0];
              touchStart.current = { x: point.clientX, y: point.clientY };
            }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              touchStart.current = null;
              const end = event.changedTouches[0];
              if (
                start &&
                end &&
                Math.abs(end.clientX - start.x) > 50 &&
                Math.abs(end.clientX - start.x) >
                  Math.abs(end.clientY - start.y)
              )
                move(end.clientX < start.x ? 1 : -1);
            }}
            onTouchCancel={() => {
              touchStart.current = null;
            }}
          >
            {active ? (
              <Image
                key={active.id}
                src={active.url}
                alt={
                  active.altText || `${listingName} ${(activeIndex ?? 0) + 1}`
                }
                fill
                sizes="100vw"
                quality={90}
                className="select-none object-contain"
                draggable={false}
              />
            ) : null}
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={t("previous")}
                  onClick={() => move(-1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:left-3"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  aria-label={t("next")}
                  onClick={() => move(1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:right-3"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            ) : null}
          </div>
          <p
            role="status"
            aria-live="polite"
            className="mt-4 text-center text-sm text-white/80"
          >
            {t("position", {
              index: (activeIndex ?? 0) + 1,
              count: images.length,
            })}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
