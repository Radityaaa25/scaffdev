export default function IntegrasiLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="skeleton-shimmer h-9 w-64 rounded-xl" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-panel rounded-2xl p-5">
            <div className="skeleton-shimmer h-5 w-2/3 rounded-lg" />
            <div className="skeleton-shimmer mt-2 h-4 w-1/3 rounded-lg" />
            <div className="skeleton-shimmer mt-4 h-9 rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
