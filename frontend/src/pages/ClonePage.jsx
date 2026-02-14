import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/appContextStore";
import HowItWorksFlow from "../components/HowItWorksFlow";
import QuickTestSites from "../components/QuickTestSites";

function isValidHttpUrl(value) {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const QUICK_SITES = [
  "react.dev",
  "nextjs.org",
  "tailwindcss.com",
  "developer.mozilla.org",
  "getbootstrap.com",
  "w3schools.com",
  "vercel.com",
  "code.visualstudio.com",
];

const LOGO_SRC = "/ReForge.png";

function cleanStructure(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const normType = (t) => String(t || "").toLowerCase().trim();

  const pickBest = (type) => {
    const list = arr.filter((s) => normType(s?.type) === type);
    if (!list.length) return null;

    // keep your scoring idea but DON'T change ids
    const score = (s) => {
      const h = String(s?.heading || "");
      let sc = 0;
      if (h.trim()) sc += 10;
      sc += Math.min(h.trim().length, 30) / 3;
      if (String(s?.id || "").trim()) sc += 2;
      return sc;
    };

    return list.sort((a, b) => score(b) - score(a))[0];
  };

  const hero = pickBest("hero");
  const content = pickBest("content");
  const grid = pickBest("grid");
  const footer = pickBest("footer");

  // keep original ids. If any missing, fallback to first matching or create minimal placeholders
  const out = [hero, content, grid, footer].filter(Boolean);

  // If scrape returns too little, keep whatever we have (no ID rewriting)
  return out.length ? out : arr.slice(0, 4);
}

export default function ClonePage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | scraping | ready | error
  const [message, setMessage] = useState("");

  const [previewHtml, setPreviewHtml] = useState("");

  const [downloading, setDownloading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [pasting, setPasting] = useState(false);

  const [detectedStructure, setDetectedStructure] = useState([]);

  const navigate = useNavigate();

  const { startRebuild, setThemeCss, themeCss, setGeneratedHtml } = useAppContext();

  const previewRef = useRef(null);
  const trimmedUrl = useMemo(() => url.trim(), [url]);

  const normalizeUrl = (input) => {
    const v = (input || "").trim();
    if (!v) return "";
    if (v.startsWith("http://") || v.startsWith("https://")) return v;
    return `https://${v}`;
  };

  const LANDING_THEME_CSS = `
  :root{
    --rf-bg:#ffffff;
    --rf-text:#000000;
    --rf-primary:#2563eb;
    --rf-muted:#6b7280;
    --rf-border:#e5e7eb;
    --rf-font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }
  html,body{
    background:var(--rf-bg);
    color:var(--rf-text);
    font-family:var(--rf-font);
  }
  img{ max-width:100%; height:auto; }
  `.trim();

  const normalizedUrl = useMemo(() => normalizeUrl(trimmedUrl), [trimmedUrl]);

  const urlValidity = useMemo(() => {
    const raw = trimmedUrl || "";
    if (!raw) return "empty";
    if (raw.length < 3) return "empty";
    return isValidHttpUrl(normalizedUrl) ? "valid" : "invalid";
  }, [trimmedUrl, normalizedUrl]);

  const canExtract = useMemo(
    () => urlValidity === "valid" && status !== "scraping",
    [urlValidity, status]
  );

  const [stepIndex, setStepIndex] = useState(-1);
  const steps = useMemo(
    () => [
      "Validating URL",
      "Scraping HTML structure",
      "Extracting CSS styles",
      "Detecting layout blocks",
      "Building sandbox preview",
    ],
    []
  );

  const progressPct = useMemo(() => {
    if (status !== "scraping" || stepIndex < 0) return 0;
    const total = Math.max(steps.length, 1);
    const clamped = Math.min(Math.max(stepIndex, 0), total - 1);
    return Math.round(((clamped + 1) / total) * 100);
  }, [status, stepIndex, steps.length]);

  const timersRef = useRef([]);
  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const startProgress = () => {
    clearTimers();
    setStepIndex(0);
    for (let i = 1; i < steps.length; i++) {
      timersRef.current.push(setTimeout(() => setStepIndex(i), i * 1100));
    }
  };

  const stopProgress = () => {
    clearTimers();
    setStepIndex(-1);
  };

  const scrollToPreview = () => {
    if (!previewRef.current) return;
    previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startScraping = async () => {
    if (status === "scraping") return;

    setMessage("");
    setPreviewHtml("");
    setDetectedStructure([]);

    // clear any previous theme css
    if (typeof setThemeCss === "function") setThemeCss("");

    if (!trimmedUrl) {
      setMessage("Please enter a website URL.");
      return;
    }

    const fixedUrl = normalizedUrl;
    if (!isValidHttpUrl(fixedUrl)) {
      setMessage("Enter a valid link (example: https://example.com).");
      return;
    }

    setUrl(fixedUrl);
    setStatus("scraping");
    startProgress();

    try {
      const res = await fetch("http://localhost:5000/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: fixedUrl }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Scrape failed");
      }

      const data = await res.json();
      stopProgress();

      const cleaned = cleanStructure(data.structure);
      setDetectedStructure(cleaned);

      setPreviewHtml(data.bodyOnlyHtml || "");
      setGeneratedHtml(data.bodyOnlyHtml || "");

      if (typeof setThemeCss === "function" && typeof data.css === "string") {
        setThemeCss(data.css);
      }

      setStatus("ready");
      setMessage("Ready — extraction completed successfully.");
    } catch (err) {
      console.error(err);
      stopProgress();
      setStatus("error");
      setMessage(
        "Extraction failed. Try a simpler public site (docs/landing pages). Some sites block scraping."
      );
    }
  };

  const downloadStaticClone = async () => {
    setMessage("");

    const fixedUrl = normalizedUrl;
    if (!fixedUrl) {
      setMessage("Please enter a website URL first.");
      return;
    }
    if (!isValidHttpUrl(fixedUrl)) {
      setMessage("Enter a valid link (example: https://example.com).");
      return;
    }
    if (downloading) return;

    setDownloading(true);

    try {
      const res = await fetch("http://localhost:5000/clone-static", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: fixedUrl }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(errorText || "Download failed");
      }

      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error("Empty file");

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "static-website-clone.zip";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      }, 200);
    } catch (err) {
      console.error(err);
      setMessage("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const resetUI = () => {
    stopProgress();
    setStatus("idle");
    setMessage("");
    setPreviewHtml("");
    setDetectedStructure([]);
    setDownloading(false);
    if (typeof setThemeCss === "function") setThemeCss("");
  };

  const clearUrl = () => {
    if (status === "scraping") return;
    setUrl("");
    setMessage("");
  };

  const pasteFromClipboard = async () => {
    if (status === "scraping") return;
    setMessage("");
    setPasting(true);
    try {
      const text = await navigator.clipboard.readText();
      const v = (text || "").trim();
      if (!v) {
        setMessage("Clipboard is empty.");
        return;
      }
      setUrl(v);
    } catch {
      setMessage("Clipboard access blocked. Use Ctrl+V inside the field.");
    } finally {
      setPasting(false);
    }
  };

  // wrap body-only html into a doc for iframe preview
  const iframeDoc = useMemo(() => {
  if (!previewHtml) return "";

  const baseHref = normalizedUrl.endsWith("/")
    ? normalizedUrl
    : `${normalizedUrl}/`;

  const css = `
  <style data-reforge-scraped>
  ${themeCss || ""}
  </style>
  <style data-reforge-landing-theme>
  ${LANDING_THEME_CSS}
  </style>
  `;

  return `<!doctype html>
  <html>
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base href="${baseHref}">
  ${css}
  </head>
  <body>
  ${previewHtml}
  </body>
  </html>`;
  }, [previewHtml, LANDING_THEME_CSS, normalizedUrl, themeCss]);

  const LockIcon = ({ className = "" }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11V8.5C7 5.462 9.462 3 12.5 3C15.538 3 18 5.462 18 8.5V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11H18.5C19.6046 11 20.5 11.8954 20.5 13V19C20.5 20.1046 19.6046 21 18.5 21H6.5C5.39543 21 4.5 20.1046 4.5 19V13C4.5 11.8954 5.39543 11 6.5 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );

  const ExtractIcon = ({ className = "" }) => (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3H5a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 21h2a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".9" />
      <path
        d="M12 5l.8 2.6L15.5 8.4l-2.6.8-.9 2.8-.8-2.6-2.7-.8 2.6-.8L12 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ArrowIcon = ({ className = "" }) => (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <Layout>
      <section className="px-6 pt-0 pb-14 flex justify-center">
        <div className="w-full max-w-6xl">
          {/* TOP ROW */}
          <div className="grid grid-cols-3 items-center pt-12 pb-8 gap-6">
            <div className="flex justify-start pt-1">
              <div className="px-4 py-2 rounded-full border border-[var(--border-subtle)] bg-white/5 text-sm text-[var(--text-secondary)] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Frontend Builder
              </div>
            </div>

            <div className="flex justify-center">
              <div className="flex items-center gap-5 sm:gap-6">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-[var(--border-subtle)] bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  <img src={LOGO_SRC} alt="ReForge logo" className="h-full w-full object-cover" />
                </div>

                <div className="text-left">
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                    REFORGE
                  </h1>
                  <div className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
                    Extract • Clone • Make it yours
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setInfoOpen(true)}
                className="px-5 py-2 rounded-full border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 transition text-sm text-[var(--text-secondary)] flex items-center gap-2"
              >
                <span className="h-2 w-2 rounded-full bg-green-400" />
                About
              </button>
            </div>
          </div>

          <p className="mt-5 text-lg sm:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto text-center leading-relaxed">
            Clone any public website frontend into a sandbox preview, then rebuild a fresh UI with the same
            structure using Builder.
          </p>

          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-subtle)] bg-white/5 text-xs text-[var(--text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Preview • Builder • Export ZIP
              </span>

              {urlValidity !== "empty" && (
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-full border text-xs
                    ${
                      urlValidity === "valid"
                        ? "border-green-500/25 bg-green-500/10 text-green-200"
                        : "border-red-500/25 bg-red-500/10 text-red-200"
                    }`}
                >
                  {urlValidity === "valid" ? "Valid URL" : "Invalid URL"}
                </span>
              )}
            </div>
          </div>

          <HowItWorksFlow />

          {/* INPUT */}
          <div className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white/5 p-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="text-left">
                <div className="text-2xl font-semibold">Website URL</div>
                <div className="mt-2 text-sm text-[var(--text-secondary)]">
                  Paste a full link or a domain (we auto-fix to https://).
                </div>
              </div>

              {urlValidity !== "empty" && (
                <div
                  className={`mt-1 inline-flex items-center px-3 py-2 rounded-full border text-xs
                    ${
                      urlValidity === "valid"
                        ? "border-green-500/25 bg-green-500/10 text-green-200"
                        : "border-red-500/25 bg-red-500/10 text-red-200"
                    }`}
                >
                  {urlValidity === "valid" ? "Valid" : "Invalid"}
                </div>
              )}
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-[1fr_260px]">
              <div
                className="
                  relative rounded-3xl border border-[var(--border-subtle)] bg-black/10 overflow-hidden
                  transition hover:bg-black/15
                  focus-within:border-white/25
                  focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]
                "
              >
                {status === "scraping" && (
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-1/2 top-0 h-full w-1/2 bg-white/10 blur-2xl animate-[shimmer_1.4s_linear_infinite]" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          setMessage("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") startScraping();
                          if (e.key === "Escape") clearUrl();
                        }}
                        placeholder="https://example.com or react.dev"
                        className="w-full bg-transparent outline-none text-base text-white pr-24"
                      />

                      {url.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={clearUrl}
                          aria-label="Clear URL"
                          title="Clear"
                          className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 transition flex items-center justify-center text-[var(--text-secondary)]"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {urlValidity !== "empty" && (
                      <span
                        className={`shrink-0 inline-flex items-center px-3 py-2 rounded-full border text-xs select-none
                          ${
                            urlValidity === "valid"
                              ? "border-green-500/25 bg-green-500/10 text-green-200"
                              : "border-red-500/25 bg-red-500/10 text-red-200"
                          }`}
                      >
                        {urlValidity === "valid" ? "Valid" : "Invalid"}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={pasteFromClipboard}
                      disabled={status === "scraping" || pasting}
                      className={`shrink-0 px-4 py-2 rounded-xl border transition text-xs flex items-center gap-2 active:scale-[0.98]
                        ${
                          status === "scraping" || pasting
                            ? "border-gray-700 text-gray-400 cursor-not-allowed"
                            : "border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]"
                        }`}
                      title="Paste a URL from your clipboard"
                    >
                      {pasting ? (
                        <>
                          <Spinner /> Pasting…
                        </>
                      ) : (
                        "Paste"
                      )}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs text-[var(--text-secondary)] opacity-80">
                      Recommended: documentation sites and marketing pages for stable previews.
                    </div>

                    {urlValidity === "valid" && status !== "scraping" && (
                      <div className="text-xs text-white/60">
                        Press <span className="text-white/80">Enter</span> to extract.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button
                  onClick={startScraping}
                  disabled={!canExtract}
                  title={
                    canExtract
                      ? "Extract frontend"
                      : urlValidity === "invalid"
                      ? "Enter a valid URL to unlock extraction"
                      : "Paste a URL to unlock extraction"
                  }
                  className={`
                    w-full h-full min-h-[88px]
                    rounded-3xl font-semibold transition relative overflow-hidden
                    flex items-center justify-center gap-2
                    ${
                      status === "scraping"
                        ? "bg-white/70 text-black cursor-not-allowed"
                        : canExtract
                        ? "bg-white text-black hover:opacity-95 hover:-translate-y-[1px]"
                        : "bg-white/35 text-black/70 cursor-not-allowed"
                    }
                  `}
                >
                  {canExtract && status !== "scraping" && (
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute -inset-20 bg-white/10 blur-2xl" />
                    </div>
                  )}

                  <div className="relative flex items-center gap-2">
                    {status === "scraping" ? (
                      <>
                        <Spinner /> Extracting…
                      </>
                    ) : (
                      <>
                        {canExtract ? (
                          <ExtractIcon className="text-black/70" />
                        ) : (
                          <LockIcon className="text-black/50" />
                        )}
                        <span>Extract Frontend</span>
                        {canExtract && <ArrowIcon className="text-black/60" />}
                      </>
                    )}
                  </div>
                </button>

                {!canExtract && status !== "scraping" && (
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3 opacity-0 group-hover:opacity-100 transition">
                    <div className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-black/80 text-xs text-[var(--text-secondary)] shadow-lg whitespace-nowrap">
                      {urlValidity === "invalid" ? "Enter a valid URL to unlock" : "Paste a URL to unlock"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {status === "scraping" && (
              <div className="mt-7 rounded-2xl border border-[var(--border-subtle)] bg-black/10 p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <div className="text-sm text-[var(--text-secondary)]">
                      {steps[Math.max(stepIndex, 0)]}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] opacity-90">{progressPct}% complete</div>
                </div>

                <div className="mt-4 grid gap-2">
                  {steps.map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${i <= stepIndex ? "bg-white" : "bg-white/20"}`} />
                      <div className={`text-xs ${i <= stepIndex ? "text-white" : "text-[var(--text-secondary)]"}`}>
                        {s}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-white/30 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            {status === "ready" && (
              <div className="mt-7 rounded-2xl border border-[var(--border-subtle)] bg-black/10 p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-green-400 font-semibold">✅ Ready — preview generated</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                      Jump to the preview section or export the ZIP.
                    </div>
                  </div>

                  <button
                    onClick={scrollToPreview}
                    className="px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition"
                  >
                    View Preview ↓
                  </button>
                </div>
              </div>
            )}

            {message && status !== "scraping" && (
              <div
                className={`mt-7 rounded-2xl border p-4 text-sm leading-relaxed
                  ${
                    status === "error"
                      ? "border-red-600/30 bg-red-500/5 text-red-300"
                      : "border-[var(--border-subtle)] bg-black/10 text-[var(--text-secondary)]"
                  }`}
              >
                {status === "error" ? "❌ " : status === "ready" ? "✅ " : "ℹ️ "}
                {message}
              </div>
            )}

            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(0); opacity: .18; }
                50% { opacity: .45; }
                100% { transform: translateX(220%); opacity: .18; }
              }
            `}</style>
          </div>

          <QuickTestSites
            sites={QUICK_SITES}
            onPick={(site) => {
              setUrl(`https://${site}`);
              setMessage("");
            }}
          />

          {status === "ready" && (
            <div ref={previewRef} className="mt-12 space-y-5">
              {detectedStructure?.length > 0 && (
                <div className="text-center text-sm text-[var(--text-secondary)]">
                  Detected sections:{" "}
                  <span className="text-white font-semibold">{detectedStructure.length}</span>
                </div>
              )}

              <div className="rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-black">
                <div className="px-5 py-4 text-sm text-[var(--text-secondary)] border-b border-[var(--border-subtle)] bg-black/70 flex items-center justify-between">
                  <span>Sandbox Preview</span>
                  <span className="text-xs opacity-70">Static iframe</span>
                </div>

                <iframe
                  title="Static Preview"
                  srcDoc={iframeDoc}
                  sandbox="allow-same-origin"
                  className="w-full h-[680px] bg-white"
                />
              </div>

              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  onClick={downloadStaticClone}
                  disabled={downloading}
                  className={`px-6 py-3 rounded-2xl border transition flex items-center gap-2
                    ${
                      downloading
                        ? "border-gray-700 text-gray-400 cursor-not-allowed"
                        : "border-[var(--border-subtle)] hover:bg-white/5 text-white"
                    }`}
                >
                  {downloading && <Spinner />}
                  {downloading ? "Downloading…" : "Download ZIP"}
                </button>

                <button
                  className="px-6 py-3 rounded-2xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-white/5 transition"
                  onClick={() => {
                    startRebuild(
                      normalizedUrl,
                      detectedStructure,
                      previewHtml,
                      typeof themeCss === "string" ? themeCss : ""
                    );

                    navigate("/preview");
                  }}
                >
                  Open in Builder
                </button>

                <button
                  onClick={resetUI}
                  className="px-6 py-3 rounded-2xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-white/5 transition"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {infoOpen && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/70" onClick={() => setInfoOpen(false)} />
              <div className="absolute right-6 top-6 w-[92vw] max-w-lg rounded-3xl border border-[var(--border-subtle)] bg-black p-7 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold">ReForge</div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">Built by Manthan Sharma</div>
                  </div>
                  <button
                    onClick={() => setInfoOpen(false)}
                    className="h-10 w-10 rounded-2xl border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-6 grid gap-4 text-sm">
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/5 p-5">
                    <div className="font-semibold">What it does</div>
                    <div className="mt-2 text-[var(--text-secondary)] leading-relaxed">
                      URL → clone frontend (HTML/CSS) → sandbox preview → Builder → ZIP export.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/5 p-5">
                    <div className="font-semibold">Tech used</div>
                    <ul className="mt-2 list-disc pl-5 text-[var(--text-secondary)] space-y-1">
                      <li>React + Tailwind</li>
                      <li>React Router</li>
                      <li>Node backend endpoints</li>
                      <li>Sandboxed iframe preview</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => setInfoOpen(false)}
                    className="w-full px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
