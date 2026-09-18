export default function MonitorLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
      <div className="skeleton-shimmer h-9 w-56 rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-panel h-28 rounded-2xl">
            <div className="skeleton-shimmer h-full w-full rounded-2xl" />
          </div>
        ))}
      </div>
      <div className="glass-panel h-56 rounded-2xl">
        <div className="skeleton-shimmer h-full w-full rounded-2xl" />
      </div>
    </main>
  );
}
