export default function LocaleLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background" role="status" aria-label="Loading">
      <div className="flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
        <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
      </div>
    </div>
  );
}
