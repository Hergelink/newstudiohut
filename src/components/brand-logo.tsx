import { Aperture } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}
      aria-label="Studiohut"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Aperture className="size-5" aria-hidden="true" />
      </span>
      <span className="text-xl">studiohut</span>
    </Link>
  );
}
