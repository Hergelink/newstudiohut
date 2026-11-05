export default function ListingDetailLoading() {
  return (
    <main className="container animate-pulse py-10" aria-busy="true">
      <div className="h-5 w-52 rounded bg-secondary" />
      <div className="mt-8 h-14 w-3/4 rounded-2xl bg-secondary" />
      <div className="mt-8 aspect-[16/8] rounded-3xl bg-secondary" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="h-72 rounded-3xl bg-secondary" />
        <div className="h-72 rounded-3xl bg-secondary" />
      </div>
    </main>
  );
}
