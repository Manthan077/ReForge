import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col relative">
      {/* GLOBAL BACKDROP */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[980px] h-[520px] rounded-full bg-white/7 blur-3xl opacity-60" />
        <div className="absolute top-44 -left-40 w-[640px] h-[640px] rounded-full bg-white/6 blur-3xl opacity-45" />
        <div className="absolute bottom-[-220px] right-[-240px] w-[720px] h-[720px] rounded-full bg-white/6 blur-3xl opacity-35" />

        {/* NEW: bottom fade so the page clearly "ends" near the footer */}
        <div className="absolute bottom-0 left-0 right-0 h-[360px] bg-gradient-to-b from-transparent via-black/20 to-black/55" />
      </div>

      <main className="flex-1 pb-4">{children}</main>

      {/* FOOTER END-CAP ZONE (matches hero vibe) */}
      <div className="relative">
        {/* NEW: glow band behind footer to "close" the page */}
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-[240px] -z-10">
          <div className="mx-auto w-full max-w-6xl px-6 h-full">
            <div className="h-full rounded-[32px] bg-white/5 blur-3xl opacity-60" />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
