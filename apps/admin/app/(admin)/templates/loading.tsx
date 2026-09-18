export default function TemplatesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="skeleton-shimmer h-9 w-64 rounded-xl" />
      <div className="glass-panel mt-6 overflow-hidden rounded-2xl p-5">
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
