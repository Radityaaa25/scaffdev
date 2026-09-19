/** Skeleton instan saat navigasi ke halaman detail template (anti kesan lag). */
export default function TemplateDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl animate-pulse" aria-hidden="true">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-16 rounded bg-zinc-800/80" />
        <div className="h-3 w-3 rounded bg-zinc-800/60" />
        <div className="h-3 w-24 rounded bg-zinc-800/80" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-24 rounded-md bg-zinc-800/80" />
            <div className="h-5 w-32 rounded-md bg-zinc-800/60" />
          </div>
          <div className="h-8 w-72 max-w-full rounded-lg bg-zinc-800/80" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-zinc-800/60" />
      </div>

      {/* Screenshot */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#26262B] bg-[#131316] mb-2">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6]" />
        </div>
      </div>

      {/* Action box */}
      <div className="bg-[#131316] border border-[#26262B] rounded-2xl p-6 mt-8">
        <div className="h-5 w-56 rounded bg-zinc-800/80 mb-2" />
        <div className="h-4 w-96 max-w-full rounded bg-zinc-800/60" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#131316] border border-[#26262B] rounded-2xl p-6 space-y-3">
            <div className="h-5 w-40 rounded bg-zinc-800/80" />
            <div className="h-3 w-full rounded bg-zinc-800/60" />
            <div className="h-3 w-5/6 rounded bg-zinc-800/60" />
          </div>
          <div className="bg-[#131316] border border-[#26262B] rounded-2xl p-6 space-y-3">
            <div className="h-5 w-48 rounded bg-zinc-800/80" />
            <div className="h-3 w-full rounded bg-zinc-800/60" />
            <div className="h-3 w-4/6 rounded bg-zinc-800/60" />
          </div>
        </div>
        <div className="bg-[#131316] border border-[#26262B] rounded-2xl p-6 space-y-3 h-fit">
          <div className="h-5 w-36 rounded bg-zinc-800/80" />
          <div className="h-16 rounded-xl bg-zinc-800/60" />
          <div className="h-16 rounded-xl bg-zinc-800/60" />
        </div>
      </div>
    </div>
  );
}
