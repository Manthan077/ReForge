import { useState } from "react";
import { AppContext } from "./appContextStore";

function stripReforgeOverlay(html) {
  const s = String(html || "");
  if (!s) return "";

  let out = s;

  out = out.replace(/<div[^>]*id=["']__reforge_hint["'][\s\S]*?<\/div>/gi, "");
  out = out.replace(/<div[^>]*id=["']__reforge_builder_hint["'][\s\S]*?<\/div>/gi, "");

  out = out.replace(
    /<script[^>]*data-reforge-overlay=["']1["'][\s\S]*?<\/script>/gi,
    ""
  );
  out = out.replace(
    /<script[^>]*data-reforge-builder=["']1["'][\s\S]*?<\/script>/gi,
    ""
  );

  out = out.replace(/\sdata-rf-outline=["']1["']/gi, "");

  return out.trim();
}

const DEFAULT_BUILDER_THEME = {
  fontFamily: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`,
  bg: "#0b0b0b",
  text: "#f5f5f5",
  primary: "#8b9cff",
  muted: "rgba(255,255,255,0.70)",
  border: "rgba(255,255,255,0.14)",
};

export function AppProvider({ children }) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [structure, setStructure] = useState([]);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [versions, setVersions] = useState([]);
  const [themeCss, setThemeCss] = useState("");
  const [builderTheme, setBuilderTheme] = useState(DEFAULT_BUILDER_THEME);
  const [hiddenSections, setHiddenSections] = useState({});
  const [stylesheets, setStylesheets] = useState([]);

  const saveVersion = (html) => {
    const safeHtml = stripReforgeOverlay(html);
    if (!safeHtml) return;

    setVersions((prev) => [
      {
        id: Date.now(),
        html: safeHtml,
        timestamp: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  const resetProject = () => {
    setWebsiteUrl("");
    setStructure([]);
    setGeneratedHtml("");
    setVersions([]);
    setThemeCss("");
    setBuilderTheme(DEFAULT_BUILDER_THEME);
    setHiddenSections({});
  };

  const startRebuild = (
  url,
  detectedStructure,
  bodyHtml = "",
  scrapedCss = "",
  cssLinks = []
  ) => {
    setWebsiteUrl(url);
    setStructure(detectedStructure || []);
    setGeneratedHtml(bodyHtml || ""); 
    setVersions([]);
    setThemeCss(scrapedCss || "");
    setBuilderTheme(DEFAULT_BUILDER_THEME);
    setHiddenSections({});
    setStylesheets(cssLinks);
  };

  const value = {
    websiteUrl,
    setWebsiteUrl,

    structure,
    setStructure,

    generatedHtml,
    setGeneratedHtml,

    versions,
    saveVersion,

    stylesheets,
    setStylesheets,

    startRebuild,
    resetProject,

    themeCss,
    setThemeCss,

    builderTheme,
    setBuilderTheme,

    hiddenSections,
    setHiddenSections,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
