function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`glass-panel rounded-2xl ${className}`}><div className="skeleton-shimmer h-full w-full rounded-2xl" /></div>;
}

export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <div className="skeleton-shimmer h-9 w-56 rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SkeletonCard className="h-56 lg:col-span-7" />
        <SkeletonCard className="h-56 lg:col-span-5" />
      </div>
    </main>
  );
}
