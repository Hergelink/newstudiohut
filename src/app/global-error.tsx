"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="tr">
      <body>
        <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Studiohut
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Bir hata oluştu
            </h1>
            <p className="mt-3 text-muted-foreground">
              Sayfa yüklenemedi. Lütfen tekrar deneyin.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              Tekrar dene
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
