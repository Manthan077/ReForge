import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Layout from "../components/Layout";
import JSZip from "jszip";
import { useAppContext } from "../context/appContextStore";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
/* ---------------- COMPONENT ---------------- */

export default function PreviewPage() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const toastTimerRef = useRef(null);
  const liveHtmlRef = useRef("");

  const {
    websiteUrl,
    generatedHtml,
    setGeneratedHtml,
    themeCss,
  } = useAppContext();

  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [detectedTheme, setDetectedTheme] = useState(null);

  // Detect theme from scraped CSS
  useEffect(() => {
    if (!themeCss) return;
    
    const darkKeywords = ['#000', 'rgb(0,0,0)', 'rgb(0, 0, 0)', 'black', 'dark'];
    const lightKeywords = ['#fff', 'rgb(255,255,255)', 'rgb(255, 255, 255)', 'white', 'light'];
    
    const cssLower = themeCss.toLowerCase();
    const darkCount = darkKeywords.filter(k => cssLower.includes(k)).length;
    const lightCount = lightKeywords.filter(k => cssLower.includes(k)).length;
    
    const isOriginallyDark = darkCount > lightCount;
    setDetectedTheme(isOriginallyDark ? 'dark' : 'light');
    setIsDarkMode(false); // Start with original theme
  }, [themeCss]);

  const bodyOnly = useMemo(() => String(generatedHtml || ""), [generatedHtml]);
  const hasSite = bodyOnly.trim().length > 0;

  /* ---------------- HELPERS ---------------- */

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3000);
  };

  const getIframeDoc = () =>
    iframeRef.current?.contentDocument ||
    iframeRef.current?.contentWindow?.document ||
    null;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  /* 🔒 Preserve scroll position */
  const syncFromIframe = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return;

    doc.querySelectorAll("script[data-reforge-builder]").forEach((s) => s.remove());
    doc.getElementById("__reforge_builder_hint")?.remove();

    // store without re-rendering iframe
    liveHtmlRef.current = doc.body.innerHTML || "";
  }, []);

  /* ---------------- DYNAMIC STYLE INJECTION ---------------- */
  
  // Inject image counter-invert style dynamically without reloading iframe
  useEffect(() => {
    const doc = getIframeDoc();
    if (!doc) return;

    // Remove existing dark mode style if present
    const existingStyle = doc.getElementById('__reforge_dark_mode_style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new style if dark mode is active
    if (isDarkMode) {
      const style = doc.createElement('style');
      style.id = '__reforge_dark_mode_style';
      style.textContent = `
        img, video, picture, [style*="background-image"] {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `;
      doc.head.appendChild(style);
    }
  }, [isDarkMode]);

  /* ---------------- THEME CSS ---------------- */

  const themeStyle = useMemo(() => {
    // Keep empty to prevent iframe reload
    return ``;
  }, []);

  /* ---------------- BUILDER OVERLAY ---------------- */

  const builderOverlay = useMemo(() => {
    if (!hasSite) return "";

    return `
<style>
#__reforge_builder_hint{
  position:fixed;
  left:16px;
  bottom:16px;
  z-index:2147483647;
  background:rgba(0,0,0,.6);
  color:#fff;
  padding:8px 12px;
  border-radius:12px;
  font-size:12px;
  pointer-events:none;
}
[data-rf-outline="1"]{
  outline:2px solid rgba(255,255,255,.6);
  outline-offset:4px;
  cursor:pointer;
}
</style>

<div id="__reforge_builder_hint">
  Click text or image to edit
</div>

<script data-reforge-error-suppression>
// Suppress all errors from scraped site scripts
window.addEventListener('error', function(e) {
  e.preventDefault();
  e.stopPropagation();
  return true;
}, true);

// Suppress unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
  e.preventDefault();
  e.stopPropagation();
}, true);

// Create stub functions for common missing functions
window.w3_close_all_topnav = function() {};
window.w3_open = function() {};
window.w3_close = function() {};
</script>

<script data-reforge-builder>
(function(){
  if(window.__RF_BUILDER__) return;
  window.__RF_BUILDER__ = true;

  const ensureId = (el) => {
    if(!el.dataset.rfId){
      el.dataset.rfId = "rf_" + Math.random().toString(36).slice(2,9);
    }
    return el.dataset.rfId;
  };

  let last=null;

  document.addEventListener("mousemove",e=>{
    if(last) last.removeAttribute("data-rf-outline");
    const t=e.target;
    if(!t || t===document.body) return;
    t.setAttribute("data-rf-outline","1");
    last=t;
  },{passive:true});

  document.addEventListener("click",e=>{
    const t=e.target;
    if(!t || t===document.body) return;

    if(t.tagName.toLowerCase()==="img"){
      e.preventDefault();
      parent.postMessage({
        type:"RF_SELECT",
        kind:"img",
        rfId: ensureId(t),
        value: t.getAttribute("src") || "",
        alt: t.getAttribute("alt") || ""
      },"*");
      return;
    }

    if(t.innerText && t.innerText.trim()){
      e.preventDefault();
      parent.postMessage({
        type:"RF_SELECT",
        kind:"text",
        rfId: ensureId(t),
        value: t.innerText.trim()
      },"*");
    }
  },true);
})();
</script>
`;
  }, [hasSite]);

  /* ---------------- IFRAME HTML ---------------- */

  const iframeHtml = useMemo(() => {
    if (!hasSite || !websiteUrl) return "";

    const base = websiteUrl.endsWith("/") ? websiteUrl : websiteUrl + "/";

    return `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<base href="${base}">
<style>${themeCss || ""}</style>
<style>${themeStyle}</style>
</head>
<body>
${bodyOnly}
${builderOverlay}
</body>
</html>
`;
  }, [hasSite, websiteUrl, bodyOnly, themeCss, themeStyle, builderOverlay]);

  /* ---------------- MESSAGE HANDLER ---------------- */

  useEffect(() => {
    liveHtmlRef.current = generatedHtml || "";
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e?.data?.type === "RF_SELECT") {
        setSelected({
          kind: e.data.kind,
          rfId: e.data.rfId,
          value: e.data.value,
          alt: e.data.alt || "",
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  /* ---------------- APPLY EDITS ---------------- */

  const applyTextEdit = () => {
    const doc = getIframeDoc();
    if (!doc || !selected?.rfId) return;

    const el = doc.querySelector(`[data-rf-id="${selected.rfId}"]`);
    if (!el) return;

    el.innerText = selected.value;
    syncFromIframe();
    showToast("Text updated");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelected({ ...selected, value: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const applyImageEdit = () => {
    const doc = getIframeDoc();
    if (!doc || !selected?.rfId) return;

    const img = doc.querySelector(`img[data-rf-id="${selected.rfId}"]`);
    if (!img) {
      showToast("Image not found");
      return;
    }

    img.src = selected.value;
    syncFromIframe();
    showToast("Image updated");
  };

  /* ---------------- EXPORT ---------------- */

  const downloadZip = async () => {
    if (!hasSite || !websiteUrl) return;
    setBusy(true);
    showToast("Preparing export...");

    try {
      // Sync any edits from the iframe
      syncFromIframe();
      
      const editedHtml = liveHtmlRef.current || generatedHtml;

      showToast("Downloading all assets...");

      // Send edited HTML to backend to bundle with all assets
      const res = await fetch(`${API}/export-with-edits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          websiteUrl,
          editedHtml,
          themeCss: themeCss || ""
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(errorText || "Export failed");
      }

      showToast("Generating ZIP...");

      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Empty file received");
      }

      showToast("Downloading...");

      // Download the ZIP file
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "reforge-export.zip";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
      }, 200);

      showToast("✅ ZIP exported successfully!");
    } catch (err) {
      console.error("Export failed:", err);
      showToast("❌ Export failed - " + err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <section className="px-6 pt-28 pb-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_420px] gap-6">
          {/* PREVIEW */}
          <div className="rounded-3xl border overflow-hidden bg-white">
            <div
              style={
                isDarkMode
                  ? {
                      filter: "invert(1) hue-rotate(180deg)",
                    }
                  : {}
              }
            >
              <iframe
                ref={iframeRef}
                title="Preview"
                className="w-full h-[80vh]"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={iframeHtml}
                style={{
                  colorScheme: "normal"
                }}
              />
            </div>
          </div>

          {/* EDITOR */}
          <div className="rounded-3xl border bg-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Editor</div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border text-xs">
                  <span className="h-2 w-2 rounded-full bg-green-400"></span>
                  <span className="text-[var(--text-secondary)]">
                    {detectedTheme === 'dark' ? 'Originally Dark' : 'Originally Light'}
                  </span>
                </div>
                
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border hover:bg-black/30 transition-colors text-xs"
                  title={`Switch to ${isDarkMode ? 'Original' : (detectedTheme === 'dark' ? 'Light' : 'Dark')} Mode`}
                >
                  {isDarkMode ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12h18M3 6h18M3 18h18"/>
                      </svg>
                      <span>Original</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {detectedTheme === 'dark' ? (
                          <>
                            <circle cx="12" cy="12" r="5"/>
                            <line x1="12" y1="1" x2="12" y2="3"/>
                            <line x1="12" y1="21" x2="12" y2="23"/>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                            <line x1="1" y1="12" x2="3" y2="12"/>
                            <line x1="21" y1="12" x2="23" y2="12"/>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                          </>
                        ) : (
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        )}
                      </svg>
                      <span>{detectedTheme === 'dark' ? 'Light' : 'Dark'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!selected && (
              <div className="text-sm text-[var(--text-secondary)]">
                Click any text or image in preview
              </div>
            )}

            {selected?.kind === "text" && (
              <>
                <textarea
                  value={selected.value}
                  onChange={(e) =>
                    setSelected({ ...selected, value: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border outline-none text-white"
                />
                <button
                  onClick={applyTextEdit}
                  className="w-full px-5 py-3 rounded-2xl bg-white text-black font-semibold"
                >
                  Apply Text
                </button>
              </>
            )}

            {selected?.kind === "img" && (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-2 block">
                      Upload from Device
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="block w-full px-4 py-3 rounded-2xl bg-black/20 border text-center cursor-pointer hover:bg-black/30 transition-colors"
                    >
                      <span className="text-sm">📁 Choose File</span>
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[var(--rf-bg)] px-2 text-[var(--text-secondary)]">
                        OR
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-2 block">
                      Direct URL
                    </label>
                    <input
                      value={selected.value}
                      onChange={(e) =>
                        setSelected({ ...selected, value: e.target.value })
                      }
                      placeholder="Paste image URL..."
                      className="w-full px-4 py-3 rounded-2xl bg-black/20 border outline-none text-white"
                    />
                  </div>

                  {selected.value && (
                    <div className="rounded-xl overflow-hidden border">
                      <img
                        src={selected.value}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <button
                    onClick={applyImageEdit}
                    disabled={!selected.value}
                    className="w-full px-5 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-50"
                  >
                    Apply Image
                  </button>
                </div>
              </>
            )}

            <button
              onClick={downloadZip}
              disabled={busy}
              className="w-full px-5 py-3 rounded-2xl border"
            >
              {busy ? "Exporting…" : "Export ZIP"}
            </button>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl">
            {toast}
          </div>
        )}
      </section>
    </Layout>
  );
}