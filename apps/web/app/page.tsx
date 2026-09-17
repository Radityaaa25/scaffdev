export default function LandingPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Scaff
        </h1>
        <p className="max-w-md text-foreground-muted">
          Landing page menyusul di fase berikutnya. Cek{" "}
          <code className="rounded border border-border bg-background-secondary px-1.5 py-0.5 font-mono text-sm">
            /builder
          </code>
          ,{" "}
          <code className="rounded border border-border bg-background-secondary px-1.5 py-0.5 font-mono text-sm">
            /templates
          </code>{" "}
          dan{" "}
          <code className="rounded border border-border bg-background-secondary px-1.5 py-0.5 font-mono text-sm">
            /docs
          </code>
          .
        </p>
      </div>
    </main>
  );
}