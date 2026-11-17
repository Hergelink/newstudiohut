import { cn } from "@/lib/utils";

export function BrandRing({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute aspect-square rounded-full border-[22px] border-studio-blue sm:border-[28px]",
        className,
      )}
    />
  );
}
