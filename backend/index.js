import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import JSZip from "jszip";
import fetch from "node-fetch";
import crypto from "crypto";
import AbortController from "abort-controller";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.options(/.*/, cors());

app.use((req, res, next) => {
  console.log(`➡️ ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.get("/ping", (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.use((req, res, next) => {
  res.setTimeout(180000, () => {
    console.error("❌ Response timeout:", req.method, req.url);
    if (!res.headersSent) res.status(504).json({ error: "Server timeout" });
  });
  next();
});

app.get("/", (_, res) => {
  res.send("Reforge backend running");
});

/* ---------------- HELPERS ---------------- */
function hashName(input) {
  return crypto.createHash("md5").update(input).digest("hex");
}

async function downloadAsset(url, timeout = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

function toAbsoluteUrl(raw, base) {
  try {
    if (!raw) return "";
    const v = String(raw).trim();
    if (!v) return "";
    if (v.startsWith("data:")) return v;
    if (v.startsWith("blob:")) return v;
    if (v.startsWith("//")) return new URL("https:" + v).href;
    return new URL(v, base).href;
  } catch {
    return "";
  }
}

function stripQueryHash(u) {
  return String(u || "").split("#")[0].split("?")[0];
}

function pickExtFromUrl(u, fallback) {
  const clean = stripQueryHash(u);
  const part = clean.split("/").pop() || "";
  const dot = part.lastIndexOf(".");
  if (dot === -1) return fallback;
  const ext = part.slice(dot + 1).toLowerCase();
  if (!ext || ext.length > 6) return fallback;
  return ext;
}

function guessFolderForExt(ext) {
  const e = String(ext || "").toLowerCase();
  if (e === "css") return "css";
  if (e === "js" || e === "mjs") return "js";
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"].includes(e)) return "images";
  if (["ico"].includes(e)) return "favicon";
  if (["woff", "woff2", "ttf", "otf", "eot"].includes(e)) return "fonts";
  return "assets";
}

function isProbablyFontUrl(u) {
  const ext = pickExtFromUrl(u, "");
  return ["woff", "woff2", "ttf", "otf", "eot"].includes(ext);
}

/* ---------------- CSS URL REWRITER ---------------- */
async function rewriteCssUrlsAndDownload({ cssText, cssFileUrl, assetsMap, zip }) {
  if (!cssText) return cssText;
  const re = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

  let out = cssText;
  const matches = [...cssText.matchAll(re)];

  for (const m of matches) {
    const rawInside = (m[2] || "").trim();
    if (!rawInside) continue;
    if (rawInside.startsWith("data:") || rawInside.startsWith("blob:")) continue;

    const abs = toAbsoluteUrl(rawInside, cssFileUrl);
    if (!abs) continue;

    const ext = pickExtFromUrl(abs, isProbablyFontUrl(abs) ? "woff2" : "png");
    const folder = guessFolderForExt(ext);
    const localPath = await ensureAssetDownloaded({
      absUrl: abs,
      folder,
      fallbackExt: ext,
      assetsMap,
      zip,
    });

    if (!localPath) continue;

    const relFromCss = localPath.startsWith("css/")
      ? localPath.replace(/^css\//, "")
      : `../${localPath}`;

    const safeRaw = rawInside.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const oneRe = new RegExp(`url\\(\\s*(['"]?)${safeRaw}\\1\\s*\\)`, "i");
    out = out.replace(oneRe, `url("${relFromCss}")`);
  }

  return out;
}

async function ensureAssetDownloaded({ absUrl, folder, fallbackExt, assetsMap, zip }) {
  if (!absUrl) return "";
  if (assetsMap.has(absUrl)) return assetsMap.get(absUrl);
  if (absUrl.startsWith("data:") || absUrl.startsWith("blob:")) return "";

  const data = await downloadAsset(absUrl);
  if (!data) return "";

  const ext = pickExtFromUrl(absUrl, fallbackExt || "bin");
  const name = `${hashName(absUrl)}.${ext}`;
  const localPath = `${folder}/${name}`;

  assetsMap.set(absUrl, localPath);
  zip.file(localPath, data);
  return localPath;
}

/* ---------------- PUPPETEER RENDER ---------------- */
async function getRenderedHTML(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();

    if (["media", "eventsource", "websocket"].includes(type)) {
      return req.abort();
    }

    req.continue();
  });

  const safeGoto = async () => {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 75000 });
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
      await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
    }
  };

  try {
    await safeGoto();
    await new Promise((r) => setTimeout(r, 3500));
    await page.evaluate(() => {
      const imgs = Array.from(document.images);

      imgs.forEach((img) => {
        if (!img.getAttribute("src") || img.getAttribute("src").startsWith("data:")) {
          const real =
            img.getAttribute("data-src") ||
            img.getAttribute("data-lazy") ||
            img.getAttribute("data-original") ||
            img.getAttribute("data-url");

          if (real) img.setAttribute("src", real);
        }
      });
    });

    const html = await page.content();
    return html;
  } finally {
    try { await page.close(); } catch {}
    try { await browser.close(); } catch {}
  }
}

/* ---------------- STRUCTURE EXTRACTION ---------------- */
function extractStructure(html) {
  const $ = cheerio.load(html);
  const structure = [];

  $("section, header, footer, main").each((i, el) => {
    let type = "content";
    if ($(el).find("h1").length) type = "hero";
    if ($(el).text().match(/feature|benefit/i)) type = "grid";
    if ($(el).is("footer")) type = "footer";

    structure.push({
      id: `section_${i}`,
      type,
      heading: $(el).find("h1,h2").first().text() || type,
    });
  });

  return structure.length ? structure : [{ id: "section_0", type: "hero", heading: "Hero" }];
}

/* ---------------- SCRAPE ---------------- */
app.post("/scrape", async (req, res) => {
  const { websiteUrl } = req.body;
  if (!websiteUrl) return res.status(400).json({ error: "websiteUrl required" });

  try {
    const html = await getRenderedHTML(websiteUrl);
    const structure = extractStructure(html);
    const $ = cheerio.load(html);

    $("section, header, footer, main").each((i, el) => {
      $(el).attr("data-section-id", `section_${i}`);
    });

    const bodyOnlyHtml = $("body").html() || "";

    const cssLinks = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr("href");
      const abs = toAbsoluteUrl(href, websiteUrl);
      if (abs) cssLinks.push(abs);
    });

    const cssTexts = await Promise.all(
      cssLinks.map(async (url) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return "";
          return await r.text();
        } catch {
          return "";
        }
      })
    );

    const combinedCss = cssTexts.join("\n\n");

    res.json({
      bodyOnlyHtml,
      structure,
      css: combinedCss, 
    });
  } catch (e) {
    console.error("Scrape failed:", e);
    res.status(500).json({ error: "Scraping failed" });
  }
});

/* ---------------- CLONE STATIC ---------------- */
app.post("/clone-static", async (req, res) => {
  const { websiteUrl } = req.body;
  if (!websiteUrl) return res.status(400).json({ error: "websiteUrl required" });

  try {
    let html = await getRenderedHTML(websiteUrl);
    let $ = cheerio.load(html);

    $("base").remove();

    const zip = new JSZip();
    const assetsMap = new Map();
    const jobs = [];

    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr("href");
      const abs = toAbsoluteUrl(href, websiteUrl);
      if (!abs || abs.startsWith("data:") || abs.startsWith("blob:")) return;

      $(el).attr("href", abs);

      jobs.push(
        (async () => {
          const data = await downloadAsset(abs);
          if (!data) return;

          const rawCss = data.toString("utf8");
          const rewrittenCss = await rewriteCssUrlsAndDownload({
            cssText: rawCss,
            cssFileUrl: abs,
            assetsMap,
            zip,
          });

          const cssName = `css/${hashName(abs)}.css`;
          zip.file(cssName, rewrittenCss);
          assetsMap.set(abs, cssName);
        })()
      );
    });

    $("script[src]").each((_, el) => {
      const src = $(el).attr("src");
      const abs = toAbsoluteUrl(src, websiteUrl);
      if (!abs || abs.startsWith("data:") || abs.startsWith("blob:")) return;

      $(el).attr("src", abs);

      jobs.push(
        ensureAssetDownloaded({
          absUrl: abs,
          folder: "js",
          fallbackExt: pickExtFromUrl(abs, "js"),
          assetsMap,
          zip,
        })
      );
    });

    $("img").each((_, el) => {
      const src =
        $(el).attr("src") ||
        $(el).attr("data-src") ||
        $(el).attr("data-original");

      $(el).removeAttr("srcset");
      $(el).removeAttr("sizes");

      const abs = toAbsoluteUrl(src, websiteUrl);
      if (!abs || abs.startsWith("data:") || abs.startsWith("blob:")) return;

      $(el).attr("src", abs);

      const ext = pickExtFromUrl(abs, "png");
      const folder = ext === "ico" ? "favicon" : "images";
      jobs.push(ensureAssetDownloaded({ absUrl: abs, folder, fallbackExt: ext, assetsMap, zip }));
    });

    $("style").each((_, el) => {
      const cssText = $(el).html() || "";
      if (!cssText.trim()) return;

      jobs.push(
        (async () => {
          const rewritten = await rewriteCssUrlsAndDownload({
            cssText,
            cssFileUrl: websiteUrl,
            assetsMap,
            zip,
          });
          $(el).html(rewritten);
        })()
      );
    });

    await Promise.all(jobs);

    html = $.html();

    assetsMap.forEach((localPath, absUrl) => {
      if (absUrl.startsWith("data:") || absUrl.startsWith("blob:")) return;
      const escaped = absUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp(escaped, "g"), localPath);
    });

    $ = cheerio.load(html);
    $("base").remove();
    html = $.html();

    zip.file("index.html", html);

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="static-clone.zip"');
    res.send(zipBuffer);
  } catch (error) {
    console.error("Clone static failed:", error);
    if (!res.headersSent) res.status(500).json({ error: "Static clone failed" });
  }
});

/* ---------------- EXPORT WITH EDITS ---------------- */
app.post("/export-with-edits", async (req, res) => {
  const { websiteUrl, editedHtml, themeCss } = req.body;
  if (!websiteUrl || !editedHtml) {
    return res.status(400).json({ error: "websiteUrl and editedHtml required" });
  }

  try {
    const zip = new JSZip();
    const assetsMap = new Map();
    const jobs = [];

    const $ = cheerio.load(editedHtml);

    $("img").each((_, el) => {
      const src = $(el).attr("src");
      const abs = toAbsoluteUrl(src, websiteUrl);
      
      if (!abs || abs.startsWith("data:") || abs.startsWith("blob:")) return;

      const ext = pickExtFromUrl(abs, "png");
      const folder = ext === "ico" ? "favicon" : "images";
      
      jobs.push(
        (async () => {
          const localPath = await ensureAssetDownloaded({ 
            absUrl: abs, 
            folder, 
            fallbackExt: ext, 
            assetsMap, 
            zip 
          });
          
          if (localPath) {
            $(el).attr("src", localPath);
          }
        })()
      );
    });

    await Promise.all(jobs);

    const finalHtml = `
    <!doctype html>
    <html>
    <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>${themeCss || ""}</style>
    </head>
    <body>
    ${$.html()}
    </body>
    </html>
    `;

    zip.file("index.html", finalHtml);

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="reforge-export.zip"');
    res.send(zipBuffer);
  } catch (error) {
    console.error("Export with edits failed:", error);
    if (!res.headersSent) res.status(500).json({ error: "Export failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});