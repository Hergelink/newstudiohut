import {
  AudioLines,
  Building2,
  Camera,
  Footprints,
  MicVocal,
  PartyPopper,
} from "lucide-react";
import { categoryVisual } from "@/modules/categories/presentation";

const icons = {
  camera: Camera,
  music: AudioLines,
  microphone: MicVocal,
  dance: Footprints,
  event: PartyPopper,
  space: Building2,
};

export function CategoryIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Icon = icons[categoryVisual(slug)];
  return <Icon className={className} strokeWidth={1.5} aria-hidden="true" />;
}
