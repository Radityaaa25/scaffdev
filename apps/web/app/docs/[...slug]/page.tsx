import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllDocs, getDocBySlug } from "@/lib/docs";

interface DocArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    slug: [doc.slug],
  }));
}

export default async function DocArticlePage({ params }: DocArticlePageProps) {
  const resolvedParams = await params;
  const slugPath = resolvedParams.slug.join("/");
  const doc = await getDocBySlug(slugPath);

  if (!doc) {
    notFound();
  }

  const allDocs = getAllDocs();

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-20 bg-[#131316] border border-[#26262B] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Dokumentasi Publik
            </h3>
            <nav className="space-y-1">
              {allDocs.map((item) => {
                const isActive = item.slug === slugPath;
                return (
                  <Link
                    key={item.slug}
                    href={`/docs/${item.slug}`}
                    className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#8B5CF6]/15 text-[#8B5CF6] border-l-2 border-[#8B5CF6]"
                        : "text-zinc-400 hover:text-[#FAFAFA] hover:bg-[#26262B]/50"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-[#26262B]">
              <Link
                href="/templates"
                className="block text-xs text-center font-medium text-white bg-[#8B5CF6] hover:bg-[#7C3AED] py-2 px-3 rounded-lg transition-colors"
              >
                Lihat Katalog Template →
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-[#131316] border border-[#26262B] rounded-xl p-6 sm:p-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-zinc-500 font-mono mb-6">
            <Link href="/docs" className="hover:text-zinc-300">
              Dokumentasi
            </Link>
            <span>/</span>
            <span className="text-[#8B5CF6] truncate">{doc.title}</span>
          </nav>

          {/* Render Markdown HTML with Custom Prose Styling */}
          <article
            className="prose prose-invert max-w-none 
              prose-headings:text-[#FAFAFA] prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-6 prose-h1:border-b prose-h1:border-[#26262B] prose-h1:pb-4
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-[#FAFAFA]
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-[#8B5CF6]
              prose-p:text-zinc-300 prose-p:text-sm prose-p:leading-relaxed prose-p:my-3
              prose-ul:my-3 prose-ul:text-sm prose-ul:text-zinc-300 prose-ul:list-disc prose-ul:list-inside
              prose-ol:my-3 prose-ol:text-sm prose-ol:text-zinc-300 prose-ol:list-decimal prose-ol:list-inside
              prose-li:my-1
              prose-pre:bg-[#0A0A0B] prose-pre:border prose-pre:border-[#26262B] prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-4 prose-pre:overflow-x-auto
              prose-code:font-mono prose-code:text-[#8B5CF6] prose-code:bg-[#0A0A0B] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
              prose-hr:border-[#26262B] prose-hr:my-8
              prose-a:text-[#8B5CF6] prose-a:underline hover:prose-a:text-[#7C3AED]
              prose-blockquote:border-l-2 prose-blockquote:border-[#8B5CF6] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-zinc-400"
            dangerouslySetInnerHTML={{ __html: doc.html }}
          />

          {/* Footer Back Link */}
          <div className="mt-12 pt-6 border-t border-[#26262B] flex items-center justify-between">
            <Link
              href="/docs"
              className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              ← Kembali ke Daftar Dokumentasi
            </Link>
            <Link
              href="/templates"
              className="text-xs font-medium text-[#8B5CF6] hover:underline"
            >
              Coba Template Sekarang →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}