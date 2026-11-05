import { BrandLogo } from "@/components/brand-logo";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,hsl(var(--accent)/0.12),transparent_35%),radial-gradient(circle_at_90%_90%,hsl(var(--primary)/0.12),transparent_35%)]" />
      <section className="w-full max-w-md rounded-[2rem] border bg-card p-7 shadow-soft sm:p-9">
        <BrandLogo />
        <h1 className="mt-10 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
