import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
        className,
      )}
      aria-label="StudioHut"
    >
      <Image
        src="/studiohut-logo.png"
        alt="StudioHut"
        width={300}
        height={70}
        priority
        className="h-auto w-[138px] sm:w-[164px]"
      />
    </Link>
  );
}
