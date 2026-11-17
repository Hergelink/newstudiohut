import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type PlatformLabels = {
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  statement: string;
};

export function StudioPlatformSection({ labels }: { labels: PlatformLabels }) {
  return (
    <section
      aria-labelledby="studio-platform-title"
      className="overflow-hidden bg-studio-blue py-14 text-white sm:py-20 lg:py-24"
    >
      <div className="container grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            {labels.eyebrow}
          </p>
          <h2
            id="studio-platform-title"
            className="mt-5 whitespace-pre-line text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl"
          >
            {labels.title}
          </h2>
          <p className="mt-5 max-w-sm text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
            {labels.body}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-auto min-h-12 max-w-full whitespace-normal bg-white px-6 py-3 text-studio-blue hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-studio-blue"
          >
            <Link href="/studios">
              {labels.action}
              <ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="relative isolate flex min-h-[300px] items-center justify-center px-7 pb-8 pt-24 sm:min-h-[380px] sm:px-12 sm:pt-28">
          <svg
            viewBox="0 0 600 420"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute inset-0 -z-10 size-full overflow-visible"
          >
            <path
              d="M 2 100 L 200 2 V 100 L 398 2 V 100 L 598 2 V 418 H 2 Z"
              className="fill-studio-red stroke-black"
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <p className="max-w-lg whitespace-pre-line text-center text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.045em]">
            {labels.statement}
          </p>
        </div>
      </div>
    </section>
  );
}
