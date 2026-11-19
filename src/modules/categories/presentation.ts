export type CategoryVisual =
  "camera" | "music" | "microphone" | "dance" | "event" | "space";

// Presentation defaults only: the category list, names and destinations come from Supabase.
const visuals: Record<string, CategoryVisual> = {
  "fotograf-studyosu": "camera",
  "photography-studio": "camera",
  "muzik-studyosu": "music",
  "music-studio": "music",
  "podcast-studyosu": "microphone",
  "podcast-studio": "microphone",
  "dans-studyosu": "dance",
  "dance-studio": "dance",
  "etkinlik-alani": "event",
  "event-space": "event",
};

export function categoryVisual(slug: string): CategoryVisual {
  return Object.hasOwn(visuals, slug) ? visuals[slug] : "space";
}
