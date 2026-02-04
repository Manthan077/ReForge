import { useMemo, useState } from "react";

const STEPS = [
  {
    n: "01",
    title: "Paste URL",
    short: "Provide a public website link.",
    backTitle: "What happens here",
    backBody:
      "Paste any public website URL (landing pages, docs, portfolios work best). We automatically normalize it to HTTPS so you can move fast during demos.",
    icon: "🔗",
  },
  {
    n: "02",
    title: "Extract Frontend",
    short: "Clone HTML, CSS and assets.",
    backTitle: "What happens here",
    backBody:
      "We scrape the page HTML, stylesheets, images and layout structure. The site is converted into a clean static snapshot that can be edited safely.",
    icon: "🧩",
  },
  {
    n: "03",
    title: "Open Builder Workspace",
    short: "See the site in an isolated sandbox.",
    backTitle: "What happens here",
    backBody:
      "The extracted website is loaded inside a secure iframe. Nothing executes outside the sandbox, so you can safely inspect and modify the site.",
    icon: "🛡️",
  },
  {
    n: "04",
    title: "Edit & Export",
    short: "Edit content visually and download.",
    backTitle: "What happens here",
    backBody:
      "Click any text to edit it, replace images, change colors and fonts, reorder sections, or remove blocks. When done, export a ready-to-use ZIP.",
    icon: "🛠️",
  },
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function HowItWorksFlow() {
  const steps = useMemo(() => STEPS, []);
  const [active, setActive] = useState(null);

  return (
    <div className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white/5 p-10 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[900px] h-[280px] rounded-full bg-white/5 blur-3xl opacity-60" />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="text-left">
          <div className="text-2xl font-semibold">How it works</div>
          <div className="mt-2 text-sm text-[var(--text-secondary)]">
            Click a stage to flip and understand it instantly.
          </div>
        </div>

        <div className="text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)] bg-black/10 px-3 py-2 rounded-full">
          URL → Extract → Preview → Edit
        </div>
      </div>

      <div className="relative mt-8 grid gap-6 lg:grid-cols-4">
        {steps.map((s, i) => {
          const flipped = active === i;

          return (
            <button
              key={s.n}
              type="button"
              onClick={() => setActive((prev) => (prev === i ? null : i))}
              className={cx(
                "group text-left rounded-3xl border border-[var(--border-subtle)] bg-black/15 p-0",
                "transition duration-300 hover:-translate-y-1 hover:bg-black/25 hover:border-white/25",
                "shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              )}
              aria-pressed={flipped}
              title="Click to flip"
            >
              <div className="[perspective:1200px]">
                <div
                  className={cx(
                    "relative rounded-3xl",
                    "h-[250px] sm:h-[260px]",
                    "[transform-style:preserve-3d]",
                    "transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]",
                    flipped ? "[transform:rotateY(180deg)]" : ""
                  )}
                >
                  {/* FRONT */}
                  <div
                    className={cx(
                      "absolute inset-0 rounded-3xl p-7",
                      "[backface-visibility:hidden]",
                      "overflow-hidden"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)] tracking-wide">
                        STAGE
                      </span>
                      <span className="text-sm font-semibold">{s.n}</span>
                    </div>

                    <div className="mt-5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl border border-[var(--border-subtle)] bg-white/5 flex items-center justify-center text-lg shrink-0">
                        {s.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xl font-semibold leading-snug line-clamp-2">
                          {s.title}
                        </div>
                        <div className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                          {s.short}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-[2px] w-2/3 bg-white/25 rounded-full group-hover:w-full transition-all duration-500" />
                    </div>

                    <div className="absolute left-7 right-7 bottom-6 text-[11px] text-[var(--text-secondary)] opacity-75 flex items-center justify-between">
                      <span>Click to flip</span>
                      <span className="opacity-70">↻</span>
                    </div>
                  </div>

                  {/* BACK */}
                  <div
                    className={cx(
                      "absolute inset-0 rounded-3xl p-7",
                      "[backface-visibility:hidden]",
                      "[transform:rotateY(180deg)]",
                      "overflow-hidden"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)] tracking-wide">
                        DETAILS
                      </span>
                      <span className="text-sm font-semibold">{s.n}</span>
                    </div>

                    <div className="mt-5 text-lg font-semibold line-clamp-2">
                      {s.backTitle}
                    </div>

                    <div className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-6">
                      {s.backBody}
                    </div>

                    <div className="absolute left-7 right-7 bottom-6 text-[11px] text-[var(--text-secondary)] opacity-80 flex items-center justify-between">
                      <span>Click to close</span>
                      <span className="opacity-70">↺</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-7 rounded-2xl border border-[var(--border-subtle)] bg-black/10 p-4 text-sm text-[var(--text-secondary)]">
        Tip: ReForge works best with landing pages, documentation sites, and portfolios. Some sites may block scraping.
      </div>
    </div>
  );
}
