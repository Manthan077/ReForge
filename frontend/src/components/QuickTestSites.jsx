import { useMemo, useState } from "react";

export default function QuickTestSites({ sites = [], onPick }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => s.toLowerCase().includes(q));
  }, [query, sites]);

  const CopyIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 9h10v10H9V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const SparkIcon = ({ className = "" }) => (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19 13l.9 2.7L23 17l-2.7.9L19 21l-.9-2.7L15 17l2.7-.9L19 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );

  const handleCopy = async (site) => {
    try {
      await navigator.clipboard.writeText(`https://${site}`);
    } catch {
      // ignore silently
    }
  };

  return (
    <div className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white/5 p-10 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[260px] rounded-full bg-white/5 blur-3xl opacity-60" />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="text-center md:text-left w-full md:w-auto">
          <div className="text-2xl font-semibold">Quick test sites</div>
          <div className="mt-2 text-sm text-[var(--text-secondary)]">
            Click to autofill a safe public site for demos.
          </div>
        </div>

        {/* Search */}
        <div className="w-full md:w-[360px]">
          <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-black/10 overflow-hidden focus-within:border-white/25 focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] transition">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sites… (e.g. react, tailwind)"
              className="w-full bg-transparent outline-none px-4 py-3 text-sm text-white"
            />
            {query.trim() && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 transition text-[var(--text-secondary)]"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((site) => (
          <div
            key={site}
            className="group relative rounded-3xl border border-[var(--border-subtle)] bg-black/10 overflow-hidden transition
                       hover:bg-black/20 hover:border-white/20 hover:-translate-y-[2px]
                       hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
          >
            {/* hover shimmer */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
              <div className="absolute -left-1/2 top-0 h-full w-1/2 bg-white/10 blur-2xl animate-[qtsShimmer_1.4s_linear_infinite]" />
            </div>

            {/* ✅ clickable card (NOT a button) */}
            <div
              role="button"
              tabIndex={0}
              title="Click to autofill"
              onClick={() => onPick?.(site)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onPick?.(site);
              }}
              className="w-full text-left p-6 cursor-pointer outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{site}</div>
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">Click to autofill</div>
                </div>

                <div className="shrink-0 h-10 w-10 rounded-2xl border border-[var(--border-subtle)] bg-white/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-white transition">
                  <SparkIcon />
                </div>
              </div>

              {/* bottom actions */}
              <div className="mt-5 flex items-center justify-between">
                <span className="text-[11px] text-white/50 group-hover:text-white/70 transition">
                  https://{site}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(site);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 text-[11px] text-[var(--text-secondary)] flex items-center gap-2"
                  title="Copy URL"
                >
                  <CopyIcon />
                  Copy
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center text-sm text-[var(--text-secondary)] py-10">
            No matches. Try another keyword.
          </div>
        )}
      </div>

      {/* keyframes local */}
      <style>{`
        @keyframes qtsShimmer {
          0% { transform: translateX(0); opacity: .16; }
          50% { opacity: .35; }
          100% { transform: translateX(220%); opacity: .16; }
        }
      `}</style>
    </div>
  );
}
