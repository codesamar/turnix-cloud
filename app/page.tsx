export default function Home() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Next.js Boilerplate Turnix
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          Starter project with App Router, TypeScript, Tailwind CSS, and
          shadcn/ui components. Start building your project from here.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noreferrer"
        >
          Next.js Docs
        </a>
        <a
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          href="https://ui.shadcn.com/docs"
          target="_blank"
          rel="noreferrer"
        >
          shadcn/ui Docs
        </a>
      </div>
    </div>
  );
}
