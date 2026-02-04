import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Layout from "../components/Layout";
import JSZip from "jszip";
import { useAppContext } from "../context/appContextStore";
import { useNavigate } from "react-router-dom";

/* ---------------- CONSTANTS ---------------- */

const FONT_OPTIONS = [
  { label: "System", value: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial` },
  { label: "Inter", value: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial` },
  { label: "Poppins", value: `Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial` },
  { label: "Montserrat", value: `Montserrat, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial` },
  { label: "Roboto", value: `Roboto, ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial` },
  { label: "Playfair", value: `Playfair Display, ui-serif, Georgia, "Times New Roman"` },
];

const DEFAULT_THEME = {
  fontFamily: FONT_OPTIONS[0].value,
  bg: "#0b0b0b",
  text: "#f5f5f5",
  primary: "#8b9cff",
  muted: "rgba(255,255,255,0.70)",
  border: "rgba(255,255,255,0.14)",
};

/* ---------------- UTILS ---------------- */

const clampHex = (v, fallback) =>
  /^#[0-9a-fA-F]{3,6}$/.test(String(v || "")) ? v : fallback;

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
  const [builderTheme, setBuilderTheme] = useState(DEFAULT_THEME);

  const bodyOnly = useMemo(() => String(generatedHtml || ""), [generatedHtml]);
  const hasSite = bodyOnly.trim().length > 0;

  /* ---------------- HELPERS ---------------- */

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2000);
  };

  const getIframeDoc = () =>
    iframeRef.current?.contentDocument ||
    iframeRef.current?.contentWindow?.document ||
    null;

  /* 🔒 Preserve scroll position */
  const syncFromIframe = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return;

    doc.querySelectorAll("script[data-reforge-builder]").forEach((s) => s.remove());
    doc.getElementById("__reforge_builder_hint")?.remove();

    // store without re-rendering iframe
    liveHtmlRef.current = doc.body.innerHTML || "";
  }, []);

  /* ---------------- THEME CSS ---------------- */

  const themeStyle = useMemo(() => {
    const t = builderTheme;
    return `
:root{
  --rf-bg:${clampHex(t.bg, DEFAULT_THEME.bg)};
  --rf-text:${clampHex(t.text, DEFAULT_THEME.text)};
  --rf-primary:${clampHex(t.primary, DEFAULT_THEME.primary)};
  --rf-muted:${t.muted};
  --rf-border:${t.border};
  --rf-font:${t.fontFamily};
}
html,body{
  background:var(--rf-bg);
  color:var(--rf-text);
  font-family:var(--rf-font);
}
a{color:inherit;}
button{font-family:var(--rf-font);}
`;
  }, [builderTheme]);

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
        value: t.getAttribute("src") || ""
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
    if (!hasSite) return;
    setBusy(true);

    try {
      syncFromIframe();

      const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${themeCss || ""}</style>
<style>${themeStyle}</style>
</head>
<body>
${liveHtmlRef.current || generatedHtml}
</body>
</html>
`;

      const zip = new JSZip();
      zip.file("index.html", html);

      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "reforge-export.zip";
      a.click();
      URL.revokeObjectURL(a.href);

      showToast("ZIP exported");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      <section className="px-6 py-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_420px] gap-6">
          {/* PREVIEW */}
          <div className="rounded-3xl border overflow-hidden bg-white">
            <iframe
              ref={iframeRef}
              title="Preview"
              className="w-full h-[80vh]"
              sandbox="allow-scripts allow-same-origin"
              srcDoc={iframeHtml}
            />
          </div>

          {/* EDITOR */}
          <div className="rounded-3xl border bg-white/5 p-5">
            <div className="text-sm font-semibold mb-3">Editor</div>

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
                  className="mt-3 w-full px-5 py-3 rounded-2xl bg-white text-black font-semibold"
                >
                  Apply Text
                </button>
              </>
            )}

            {selected?.kind === "img" && (
              <>
                <input
                  value={selected.value}
                  onChange={(e) =>
                    setSelected({ ...selected, value: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border outline-none text-white"
                />
                <button
                  onClick={applyImageEdit}
                  className="mt-3 w-full px-5 py-3 rounded-2xl bg-white text-black font-semibold"
                >
                  Apply Image
                </button>
              </>
            )}

            <button
              onClick={downloadZip}
              disabled={busy}
              className="mt-6 w-full px-5 py-3 rounded-2xl border"
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
