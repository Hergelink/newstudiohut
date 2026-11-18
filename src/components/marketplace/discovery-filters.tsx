"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DiscoveryFilters({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        aria-controls="discovery-filters"
        className="w-full justify-between lg:hidden"
        onClick={() => setOpen(!open)}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          {label}
        </span>
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>
      <div
        id="discovery-filters"
        className={`${open ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}
      >
        {children}
      </div>
    </>
  );
}
