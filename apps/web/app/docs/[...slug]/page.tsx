import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllDocs, getDocBySlug } from "@/lib/docs";
import { TocNav } from "@/components/TocNav";
import { ArticleBody } from "@/components/ArticleBody";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ChevronRightIcon } from "@/components/DocsIcons";

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
  const idx = allDocs.findIndex((d) => d.slug === slugPath);
  const prev = idx > 0 ? allDocs[idx - 1] : null;
  const next = idx >= 0 && idx < allDocs.length - 1 ? allDocs[idx + 1] : null;

  return (
    <>
      <ReadingProgress />
      
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main Content */}
        <article className="min-w-0">
          {/* Article Header */}
          <header className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#8B5CF6]">
              {doc.section}
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#FAFAFA] sm:text-5xl">
              {doc.title}
            </h1>
            {doc.description && (
              <p className="text-lg leading-relaxed text-zinc-400">
                {doc.description}
              </p>
            )}
          </header>

          {/* Divider */}
          <hr className="mb-8 border-white/10" />

          {/* Article Body */}
          <ArticleBody html={doc.html} />

          {/* Prev / Next Navigation */}
          <nav
            aria-label="Navigasi artikel"
            className="mt-16 grid grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-2"
          >
            {prev ? (
              <Link
                href={`/docs/${prev.slug}`}
                className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-[#8B5CF6]/50 hover:bg-white/10"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
                  Sebelumnya
                </div>
                <div className="text-base font-semibold text-zinc-200 transition-colors group-hover:text-[#8B5CF6]">
                  {prev.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/docs/${next.slug}`}
                className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5 text-right transition-all hover:border-[#8B5CF6]/50 hover:bg-white/10 sm:items-end"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Berikutnya
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </div>
                <div className="text-base font-semibold text-zinc-200 transition-colors group-hover:text-[#8B5CF6]">
                  {next.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </article>

        {/* Table of Contents Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(4rem+2rem)] space-y-6">
            <TocNav toc={doc.toc} />
            
            {/* Help CTA */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
              <h3 className="mb-2 text-sm font-semibold text-zinc-300">
                Butuh bantuan cepat?
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-zinc-500">
                Tanyakan ke asisten AI di pojok kanan bawah atau jelajahi template kami.
              </p>
              <Link
                href="/templates"
                className="flex items-center justify-center gap-2 rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#7C3AED]"
              >
                Jelajahi Template
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
