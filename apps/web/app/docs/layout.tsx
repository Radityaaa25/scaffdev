import { AskAI } from "@/components/AskAI";
import { DocsSidebar } from "@/components/DocsSidebar";
import { DocsTopbar } from "@/components/DocsTopbar";
import { getAllDocs } from "@/lib/docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docs = getAllDocs();

  return (
    <>
      {/* Topbar fixed dengan backdrop blur */}
      <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0B]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0A0A0B]/60">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <DocsTopbar docs={docs} />
          </div>
        </div>
      </div>

      {/* Container utama */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 lg:gap-10">
          {/* Sidebar navigasi: fixed width 280px */}
          <aside className="hidden shrink-0 lg:block lg:w-[280px]">
            <div className="sticky top-[calc(4rem+1px)] h-[calc(100vh-4rem-1px)] overflow-y-auto py-8 pr-6">
              <DocsSidebar docs={docs} />
            </div>
          </aside>

          {/* Konten utama */}
          <main className="min-w-0 flex-1 py-8 lg:py-10">
            {children}
          </main>
        </div>
      </div>
      
      <AskAI />
    </>
  );
}
