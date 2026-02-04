export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16">
      <div className="relative border-t border-white/10 bg-black/35">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[1100px] h-[420px] rounded-full bg-white/6 blur-3xl opacity-60" />
          <div className="absolute -bottom-52 right-[-220px] w-[680px] h-[680px] rounded-full bg-white/5 blur-3xl opacity-40" />
        </div>

        <div className="relative px-6 py-12 flex justify-center">
          <div className="w-full max-w-6xl">
            <div className="flex items-start justify-between gap-10 flex-wrap">
              
              {/* LEFT */}
              <div className="min-w-[260px]">
                <div className="text-sm font-semibold tracking-wide">
                  © {year} ReForge
                </div>

                <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed max-w-md">
                  Some websites block scraping or require login. For best demos, try
                  documentation/marketing sites.
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--border-subtle)] bg-black/20 text-[11px] text-[var(--text-secondary)]">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Demo-ready • Safe preview
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-end gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-subtle)] bg-black/20 text-xs text-[var(--text-secondary)]">
                  <span className="opacity-90">Clone</span>
                  <span className="opacity-40">•</span>
                  <span className="opacity-90">Inspect</span>
                  <span className="opacity-40">•</span>
                  <span className="opacity-90">Rebuild</span>
                </div>

                <div className="text-[11px] text-[var(--text-secondary)] opacity-80">
                  Make your own websites
                </div>
              </div>
            </div>

            <div className="mt-10 h-px w-full bg-white/10" />

            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-[11px] text-[var(--text-secondary)] opacity-80">
                Made with React • Tailwind • Node
              </div>

              <div className="text-[11px] text-[var(--text-secondary)] opacity-80">
                Tip: Try <span className="text-white/80">react.dev</span> or{" "}
                <span className="text-white/80">tailwindcss.com</span>
              </div>
            </div>

            <div className="h-2" />
          </div>
        </div>
      </div>
    </footer>
  );
}
