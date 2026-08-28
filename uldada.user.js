// ==UserScript==
// @name         Uldada for Neftipné creatory
// @namespace    https://github.com/hanenashi/uldada
// @version      1.4.0
// @description  A draggable Ultra-dada launcher for Neftipné creatory: generate, preview, then copy into the composer.
// @author       hanenashi
// @match        https://www.okoun.cz/boards/neftipne_creatory*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      yirkha.fud.cz
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";
  const VERSION = "1.4.0";
  const CREATOR_URL = "https://yirkha.fud.cz/creators/ultradada2.php";
  const DEFAULT_LINES = 3;
  const LINES_KEY = "uldada-line-count";
  const POSITION_KEY = "uldada-position";
  const SCALE_KEY = "uldada-ui-scale";
  const PREVIEW_SCALE_KEY = "uldada-preview-text-scale";
  const FORMAT_KEY = "uldada-post-format";
  const SIZE_KEY = "uldada-menu-size";
  const FORMAT_VALUES = new Set(["plain", "html", "radeox", "markdown"]);
  const EDGE = 10;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lineCount = (value) => clamp(Number.parseInt(value, 10) || DEFAULT_LINES, 2, 30);

  const savedLines = async () => {
    try { return lineCount(await GM_getValue(LINES_KEY, DEFAULT_LINES)); } catch { return DEFAULT_LINES; }
  };
  const saveLines = (value) => {
    try { void GM_setValue(LINES_KEY, lineCount(value)); } catch { /* Storage is optional. */ }
  };
  const scalePercent = (value, fallback = matchMedia("(pointer: coarse)").matches ? 135 : 100) => clamp(Number.parseInt(value, 10) || fallback, 100, 300);
  const savedScale = async () => {
    try { return scalePercent(await GM_getValue(SCALE_KEY, matchMedia("(pointer: coarse)").matches ? 135 : 100)); } catch { return scalePercent(0); }
  };
  const saveScale = (value) => { try { void GM_setValue(SCALE_KEY, scalePercent(value)); } catch { /* Storage is optional. */ } };
  const previewScalePercent = (value, fallback = matchMedia("(pointer: coarse)").matches ? 200 : 100) => clamp(Number.parseInt(value, 10) || fallback, 100, 300);
  const savedPreviewScale = async () => {
    try { return previewScalePercent(await GM_getValue(PREVIEW_SCALE_KEY, matchMedia("(pointer: coarse)").matches ? 200 : 100)); } catch { return previewScalePercent(0); }
  };
  const savePreviewScale = (value) => { try { void GM_setValue(PREVIEW_SCALE_KEY, previewScalePercent(value)); } catch { /* Storage is optional. */ } };
  const savedFormat = async () => {
    try {
      const value = await GM_getValue(FORMAT_KEY, "plain");
      return FORMAT_VALUES.has(value) ? value : "plain";
    } catch { return "plain"; }
  };
  const saveFormat = (value) => { try { void GM_setValue(FORMAT_KEY, value); } catch { /* Storage is optional. */ } };
  const savedSize = async () => {
    try {
      const value = await GM_getValue(SIZE_KEY, null);
      return Number.isFinite(value?.width) && Number.isFinite(value?.height) ? value : null;
    } catch { return null; }
  };
  const saveSize = (value) => { try { void GM_setValue(SIZE_KEY, value); } catch { /* Storage is optional. */ } };
  const parseCreator = (html) => {
    const result = new DOMParser().parseFromString(html, "text/html").querySelector("#t");
    if (!result) throw new Error("Ultra-dada returned an unexpected page.");
    const copy = result.cloneNode(true);
    copy.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    return copy.textContent.replace(/\n{3,}/g, "\n\n").trim();
  };
  const generate = (count) => new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET", url: `${CREATOR_URL}?n=${encodeURIComponent(count)}`,
      onload: (response) => {
        if (response.status < 200 || response.status >= 300) return reject(new Error(`Ultra-dada returned HTTP ${response.status}.`));
        try { resolve(parseCreator(response.responseText)); } catch (error) { reject(error); }
      },
      onerror: () => reject(new Error("Could not reach Ultra-dada.")),
      ontimeout: () => reject(new Error("Ultra-dada took too long to respond.")),
    });
  });

  const addStyle = () => {
    if (document.querySelector("#uldada-style")) return;
    const scale = matchMedia("(pointer: coarse)").matches ? 1.35 : 1;
    const style = document.createElement("style");
    style.id = "uldada-style";
    style.textContent = `
      :root{--uldada-scale:${scale};--uldada-chrome:${scale};--uldada-preview-scale:${matchMedia("(pointer: coarse)").matches ? 2 : 1}}
      #uldada-wrap,#uldada-wrap *{box-sizing:border-box}
      #uldada-wrap{position:fixed;right:12px;bottom:max(82px,calc(env(safe-area-inset-bottom) + 62px));z-index:2147483646;max-width:calc(100vw - 20px);color:#fff;font:calc(14px * var(--uldada-scale))/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      #uldada-fab{display:inline-flex;align-items:center;gap:calc(7px * var(--uldada-scale));min-height:calc(44px * var(--uldada-scale));padding:calc(9px * var(--uldada-scale)) calc(14px * var(--uldada-scale));border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(22,23,28,.92);box-shadow:0 6px 18px rgba(0,0,0,.48);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;cursor:pointer;user-select:none;touch-action:none;font-weight:760;letter-spacing:.01em}
      #uldada-fab:focus-visible{outline:3px solid #9dd0ff;outline-offset:3px}.uldada-spark{color:#ffd66b;font-size:1.2em;line-height:1}.uldada-chevron{opacity:.8;transition:transform 160ms ease}#uldada-fab[aria-expanded="true"] .uldada-chevron{transform:rotate(180deg)}
      #uldada-menu{position:fixed;display:none;width:min(calc(340px * var(--uldada-scale)),calc(100vw - 20px));max-height:calc(100dvh - 20px);overflow:auto;padding:calc(13px * var(--uldada-scale));border:1px solid rgba(255,255,255,.16);border-radius:calc(16px * var(--uldada-scale));background:rgba(25,26,32,.97);box-shadow:0 18px 46px rgba(0,0,0,.66);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#f8f9fb}
      #uldada-menu.uldada-open{display:flex;flex-direction:column;gap:calc(11px * var(--uldada-scale))}.uldada-heading{display:flex;align-items:center;gap:calc(8px * var(--uldada-scale))}.uldada-heading h2{margin:0;flex:1;color:#fff;font-size:calc(17px * var(--uldada-scale));line-height:1.15}.uldada-caption,#uldada-status{margin:0;color:#c9ced9;font-size:calc(12px * var(--uldada-scale));line-height:1.45}
      .uldada-controls,.uldada-actions{display:flex;align-items:center;gap:calc(8px * var(--uldada-scale))}.uldada-controls label{color:#f1f3f6;font-weight:650}#uldada-line-count{width:calc(68px * var(--uldada-scale));min-height:calc(42px * var(--uldada-scale));padding:calc(7px * var(--uldada-scale));border:1px solid rgba(255,255,255,.2);border-radius:calc(8px * var(--uldada-scale));background:rgba(0,0,0,.28);color:#fff;font:inherit;text-align:center}
      .uldada-settings{border-top:1px solid rgba(255,255,255,.14);padding-top:calc(9px * var(--uldada-scale))}.uldada-settings summary{display:flex;justify-content:space-between;align-items:center;gap:.5em;cursor:pointer;color:#fff;font-weight:720}.uldada-settings summary span{margin-left:auto;color:#c9ced9;font-size:.82em;font-weight:600;white-space:nowrap}.uldada-settings-grid{display:grid;gap:calc(8px * var(--uldada-scale));margin-top:calc(9px * var(--uldada-scale))}.uldada-setting-label{display:flex;justify-content:space-between;align-items:center;color:#e7eaf0;font-weight:650}.uldada-setting-label output{color:#ffd66b}.uldada-settings input[type="range"]{width:100%;accent-color:#6eaef8}.uldada-settings select{width:100%;min-height:calc(42px * var(--uldada-scale));padding:calc(7px * var(--uldada-scale));border:1px solid rgba(255,255,255,.2);border-radius:calc(8px * var(--uldada-scale));background:rgba(0,0,0,.28);color:#fff;font:inherit}.uldada-settings option{background:#25262d;color:#fff}.uldada-resize{position:absolute;width:calc(30px * var(--uldada-scale));height:calc(30px * var(--uldada-scale));touch-action:none;z-index:2}.uldada-resize::after{content:"";position:absolute;width:calc(9px * var(--uldada-scale));height:calc(9px * var(--uldada-scale));border-color:rgba(255,255,255,.55);border-style:solid}.uldada-resize-nw{top:0;left:0;cursor:nwse-resize}.uldada-resize-nw::after{top:7px;left:7px;border-width:2px 0 0 2px}.uldada-resize-ne{top:0;right:0;cursor:nesw-resize}.uldada-resize-ne::after{top:7px;right:7px;border-width:2px 2px 0 0}.uldada-resize-sw{bottom:0;left:0;cursor:nesw-resize}.uldada-resize-sw::after{bottom:7px;left:7px;border-width:0 0 2px 2px}.uldada-resize-se{right:0;bottom:0;cursor:nwse-resize}.uldada-resize-se::after{right:7px;bottom:7px;border-width:0 2px 2px 0}
      #uldada-preview{width:100%;min-height:clamp(9rem,28dvh,15rem);padding:calc(11px * var(--uldada-scale));border:1px solid rgba(255,255,255,.18);border-radius:calc(10px * var(--uldada-scale));background:rgba(0,0,0,.28);color:#fff;resize:vertical;font:calc(15px * var(--uldada-scale))/1.45 Georgia,"Times New Roman",serif}#uldada-preview::placeholder{color:#aeb5c2}
      #uldada-menu button{min-height:calc(44px * var(--uldada-scale));padding:calc(9px * var(--uldada-scale)) calc(12px * var(--uldada-scale));border:1px solid rgba(255,255,255,.16);border-radius:calc(9px * var(--uldada-scale));background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font:inherit;font-weight:720}.uldada-close{min-width:calc(36px * var(--uldada-scale));min-height:calc(36px * var(--uldada-scale))!important;padding:0!important;border-radius:50%!important;font-size:calc(22px * var(--uldada-scale))!important;line-height:1!important}.uldada-primary{flex:1;background:rgba(80,160,255,.3)!important;border-color:rgba(80,160,255,.55)!important}.uldada-copy{flex:1;background:rgba(105,200,157,.22)!important;border-color:rgba(105,200,157,.45)!important}#uldada-menu button:hover:not(:disabled),#uldada-menu button:focus-visible{filter:brightness(1.18)}#uldada-menu button:focus-visible,#uldada-preview:focus-visible,#uldada-line-count:focus-visible{outline:3px solid #9dd0ff;outline-offset:2px}#uldada-menu button:disabled{cursor:not-allowed;opacity:.48}#uldada-status.uldada-error{color:#ffaaa9;font-weight:700}
      /* The main pane gives the generated text most of the available space. */
      #uldada-wrap{font-size:calc(14px * var(--uldada-chrome));-webkit-tap-highlight-color:transparent}#uldada-fab{gap:calc(7px * var(--uldada-chrome));min-height:calc(44px * var(--uldada-chrome));padding:calc(9px * var(--uldada-chrome)) calc(14px * var(--uldada-chrome));-webkit-tap-highlight-color:transparent}#uldada-menu{width:min(calc(360px * var(--uldada-chrome)),calc(100vw - 20px));padding:calc(12px * var(--uldada-chrome));border-radius:calc(16px * var(--uldada-chrome))}.uldada-heading{gap:calc(8px * var(--uldada-chrome))}.uldada-heading h2{font-size:calc(18px * var(--uldada-chrome))}.uldada-pane{display:flex;flex:1;flex-direction:column;gap:calc(8px * var(--uldada-chrome));min-height:0}.uldada-pane[hidden]{display:none!important}.uldada-subheading{display:flex;align-items:center;gap:8px}.uldada-subheading h3{margin:0;flex:1;font-size:calc(16px * var(--uldada-chrome))}.uldada-icon{min-width:calc(36px * var(--uldada-chrome))!important;min-height:calc(36px * var(--uldada-chrome))!important;padding:0!important;border-radius:50%!important;font-size:calc(18px * var(--uldada-chrome))!important}.uldada-controls,.uldada-actions{gap:calc(7px * var(--uldada-chrome))}.uldada-controls label{font-size:calc(13px * var(--uldada-chrome))}#uldada-line-count{width:calc(56px * var(--uldada-chrome));min-height:calc(38px * var(--uldada-chrome));padding:calc(5px * var(--uldada-chrome));font-size:calc(14px * var(--uldada-chrome))}#uldada-preview{flex:1;min-height:clamp(15rem,48dvh,30rem);padding:calc(10px * var(--uldada-chrome));border-radius:calc(10px * var(--uldada-chrome));font-size:calc(15px * var(--uldada-preview-scale))}#uldada-menu button{min-height:calc(38px * var(--uldada-chrome));padding:calc(6px * var(--uldada-chrome)) calc(9px * var(--uldada-chrome));font-size:calc(13px * var(--uldada-chrome))}.uldada-settings-pane{gap:calc(12px * var(--uldada-chrome))}.uldada-settings-grid{gap:calc(9px * var(--uldada-chrome));margin:0}.uldada-setting-label{font-size:calc(13px * var(--uldada-chrome))}.uldada-settings input[type="range"]{min-height:calc(34px * var(--uldada-chrome))}.uldada-settings select{min-height:calc(38px * var(--uldada-chrome));padding:calc(5px * var(--uldada-chrome));font-size:calc(14px * var(--uldada-chrome))}.uldada-resize{width:calc(26px * var(--uldada-chrome));height:calc(26px * var(--uldada-chrome))}.uldada-resize::after{width:calc(8px * var(--uldada-chrome));height:calc(8px * var(--uldada-chrome))}.uldada-caption,#uldada-status{font-size:calc(12px * var(--uldada-chrome))}
      @media(max-width:420px){.uldada-actions{flex-direction:row;align-items:center}.uldada-controls{align-items:center;flex-wrap:nowrap}.uldada-primary,.uldada-copy{width:auto}}@media(prefers-reduced-motion:reduce){#uldada-fab,.uldada-chevron{transition:none}}
    `;
    document.head.append(style);
  };

  const mount = async () => {
    const form = document.querySelector("#article-form-main");
    const postBody = document.querySelector("#post-body");
    if (!form || !postBody || document.querySelector("#uldada-wrap")) return;
    document.querySelector("#uldada-panel")?.remove(); // Live migration from Uldada 1.0.
    addStyle();
    const wrap = document.createElement("aside");
    wrap.id = "uldada-wrap";
    wrap.innerHTML = `
      <div id="uldada-fab" role="button" tabindex="0" aria-controls="uldada-menu" aria-expanded="false"><span class="uldada-spark" aria-hidden="true">✦</span><span>Uldada</span><span class="uldada-chevron" aria-hidden="true">⌃</span></div>
      <section id="uldada-menu" aria-label="Ultra-dada creator" aria-hidden="true">
        <div id="uldada-main-pane" class="uldada-pane">
          <div class="uldada-controls"><label for="uldada-line-count">Lines</label><input id="uldada-line-count" type="number" min="2" max="30" inputmode="numeric"><button class="uldada-primary" id="uldada-generate" type="button">Generate</button><button class="uldada-icon" id="uldada-open-settings" type="button" aria-label="Open settings">⚙</button><button class="uldada-icon uldada-close" type="button" aria-label="Close Uldada">×</button></div>
          <textarea id="uldada-preview" rows="6" spellcheck="true" placeholder="Your generated lines will appear here."></textarea>
          <div class="uldada-actions"><button class="uldada-copy" id="uldada-copy" type="button" disabled>Put into post field</button></div>
          <p id="uldada-status" role="status" aria-live="polite">Nothing has been posted.</p>
        </div>
        <div id="uldada-settings-pane" class="uldada-pane uldada-settings-pane" hidden>
          <div class="uldada-subheading"><button class="uldada-icon" id="uldada-back-settings" type="button" aria-label="Back to creator">‹</button><h3>Settings</h3><span class="uldada-caption">v${VERSION}</span><button class="uldada-icon uldada-close" type="button" aria-label="Close Uldada">×</button></div>
          <div class="uldada-settings-grid">
            <label class="uldada-setting-label" for="uldada-scale">GUI scale <output id="uldada-scale-value"></output></label><input id="uldada-scale" type="range" min="100" max="300" step="5">
            <label class="uldada-setting-label" for="uldada-preview-scale">Preview text scale <output id="uldada-preview-scale-value"></output></label><input id="uldada-preview-scale" type="range" min="100" max="300" step="5">
            <label class="uldada-setting-label" for="uldada-format">Okoun post format</label><select id="uldada-format"><option value="plain">Text</option><option value="html">HTML</option><option value="radeox">Radeox</option><option value="markdown">Markdown</option></select>
            <p class="uldada-caption">Drag either lower corner to resize the sheet.</p>
          </div>
        </div>
        <span class="uldada-resize uldada-resize-sw" data-corner="sw" aria-hidden="true"></span><span class="uldada-resize uldada-resize-se" data-corner="se" aria-hidden="true"></span>
      </section>`;
    document.body.append(wrap);
    const fab = wrap.querySelector("#uldada-fab");
    const menu = wrap.querySelector("#uldada-menu");
    const countInput = wrap.querySelector("#uldada-line-count");
    const preview = wrap.querySelector("#uldada-preview");
    const generateButton = wrap.querySelector("#uldada-generate");
    const copyButton = wrap.querySelector("#uldada-copy");
    const status = wrap.querySelector("#uldada-status");
    const mainPane = wrap.querySelector("#uldada-main-pane");
    const settingsPane = wrap.querySelector("#uldada-settings-pane");
    const openSettingsButton = wrap.querySelector("#uldada-open-settings");
    const backSettingsButton = wrap.querySelector("#uldada-back-settings");
    const scaleInput = wrap.querySelector("#uldada-scale");
    const scaleOutput = wrap.querySelector("#uldada-scale-value");
    const previewScaleInput = wrap.querySelector("#uldada-preview-scale");
    const previewScaleOutput = wrap.querySelector("#uldada-preview-scale-value");
    const formatInput = wrap.querySelector("#uldada-format");
    const nativeFormat = form.querySelector('select[name="bodyType"]');
    const [lines, initialScale, initialPreviewScale, initialFormat, initialSize] = await Promise.all([savedLines(), savedScale(), savedPreviewScale(), savedFormat(), savedSize()]);
    countInput.value = String(lines);
    scaleInput.value = String(initialScale);
    scaleOutput.textContent = `${initialScale}%`;
    previewScaleInput.value = String(initialPreviewScale);
    previewScaleOutput.textContent = `${initialPreviewScale}%`;
    formatInput.value = initialFormat;
    document.documentElement.style.setProperty("--uldada-scale", String(initialScale / 100));
    document.documentElement.style.setProperty("--uldada-chrome", String(initialScale / 100));
    document.documentElement.style.setProperty("--uldada-preview-scale", String(initialPreviewScale / 100));
    if (initialSize) { menu.style.width = `${initialSize.width}px`; menu.style.height = `${initialSize.height}px`; }
    const applyNativeFormat = () => {
      if (!nativeFormat || !FORMAT_VALUES.has(formatInput.value)) return;
      nativeFormat.value = formatInput.value;
      nativeFormat.dispatchEvent(new Event("input", { bubbles: true }));
      nativeFormat.dispatchEvent(new Event("change", { bubbles: true }));
    };
    applyNativeFormat();
    const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle("uldada-error", error); };
    const close = () => { mainPane.hidden = false; settingsPane.hidden = true; menu.classList.remove("uldada-open"); menu.setAttribute("aria-hidden", "true"); fab.setAttribute("aria-expanded", "false"); };
    const showPane = (pane) => {
      mainPane.hidden = pane !== "main";
      settingsPane.hidden = pane !== "settings";
      if (menu.classList.contains("uldada-open")) place();
    };
    const place = () => {
      const fabRect = fab.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const left = clamp(fabRect.right - menuRect.width, EDGE, window.innerWidth - menuRect.width - EDGE);
      const above = fabRect.top - menuRect.height - EDGE;
      const below = fabRect.bottom + EDGE;
      const top = above >= EDGE ? above : (below + menuRect.height <= window.innerHeight - EDGE ? below : clamp((window.innerHeight - menuRect.height) / 2, EDGE, window.innerHeight - menuRect.height - EDGE));
      menu.style.left = `${left}px`; menu.style.top = `${top}px`;
    };
    const toggle = () => {
      if (menu.classList.contains("uldada-open")) return close();
      menu.classList.add("uldada-open"); menu.setAttribute("aria-hidden", "false"); fab.setAttribute("aria-expanded", "true"); place();
    };
    const applyScale = () => {
      const value = scalePercent(scaleInput.value);
      scaleInput.value = String(value);
      scaleOutput.textContent = `${value}%`;
      document.documentElement.style.setProperty("--uldada-scale", String(value / 100));
      document.documentElement.style.setProperty("--uldada-chrome", String(value / 100));
      saveScale(value);
      if (menu.classList.contains("uldada-open")) place();
    };
    try {
      const position = JSON.parse(localStorage.getItem(POSITION_KEY));
      if (Number.isFinite(position?.x) && Number.isFinite(position?.y)) {
        const rect = wrap.getBoundingClientRect();
        wrap.style.left = `${clamp(position.x, EDGE, window.innerWidth - rect.width - EDGE)}px`;
        wrap.style.top = `${clamp(position.y, EDGE, window.innerHeight - rect.height - EDGE)}px`;
        wrap.style.right = "auto"; wrap.style.bottom = "auto";
      }
    } catch { /* Keep the lower-right default. */ }
    let resizing = null;
    const resizeStart = (event) => {
      event.preventDefault();
      const rect = menu.getBoundingClientRect();
      resizing = { corner: event.currentTarget.dataset.corner, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    };
    const resizeMove = (event) => {
      if (!resizing) return;
      const dx = event.clientX - resizing.x;
      const dy = event.clientY - resizing.y;
      const minimumWidth = Math.min(250, window.innerWidth - EDGE * 2);
      const minimumHeight = Math.min(210, window.innerHeight - EDGE * 2);
      const maximumWidth = window.innerWidth - EDGE * 2;
      const maximumHeight = window.innerHeight - EDGE * 2;
      let width = resizing.width;
      let height = resizing.height;
      let left = resizing.left;
      let top = resizing.top;
      if (resizing.corner.includes("e")) width = clamp(resizing.width + dx, minimumWidth, maximumWidth);
      if (resizing.corner.includes("w")) { width = clamp(resizing.width - dx, minimumWidth, maximumWidth); left = resizing.left + resizing.width - width; }
      if (resizing.corner.includes("s")) height = clamp(resizing.height + dy, minimumHeight, maximumHeight);
      if (resizing.corner.includes("n")) { height = clamp(resizing.height - dy, minimumHeight, maximumHeight); top = resizing.top + resizing.height - height; }
      left = clamp(left, EDGE, window.innerWidth - width - EDGE);
      top = clamp(top, EDGE, window.innerHeight - height - EDGE);
      menu.style.left = `${left}px`; menu.style.top = `${top}px`; menu.style.width = `${width}px`; menu.style.height = `${height}px`;
    };
    const resizeEnd = (event) => {
      if (!resizing) return;
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Nothing to release. */ }
      saveSize({ width: Math.round(menu.getBoundingClientRect().width), height: Math.round(menu.getBoundingClientRect().height) });
      resizing = null;
    };
    wrap.querySelectorAll(".uldada-resize").forEach((handle) => {
      handle.addEventListener("pointerdown", resizeStart);
      handle.addEventListener("pointermove", resizeMove);
      handle.addEventListener("pointerup", resizeEnd);
      handle.addEventListener("pointercancel", resizeEnd);
    });
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    fab.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      try { fab.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
      const rect = wrap.getBoundingClientRect();
      dragging = false; startX = event.clientX; startY = event.clientY; startLeft = rect.left; startTop = rect.top;
    });
    fab.addEventListener("pointermove", (event) => {
      try { if (!fab.hasPointerCapture(event.pointerId)) return; } catch { return; }
      const dx = event.clientX - startX, dy = event.clientY - startY;
      if (!dragging && Math.max(Math.abs(dx), Math.abs(dy)) > 15) { dragging = true; close(); wrap.style.right = "auto"; wrap.style.bottom = "auto"; }
      if (!dragging) return;
      const rect = wrap.getBoundingClientRect();
      wrap.style.left = `${clamp(startLeft + dx, EDGE, window.innerWidth - rect.width - EDGE)}px`;
      wrap.style.top = `${clamp(startTop + dy, EDGE, window.innerHeight - rect.height - EDGE)}px`;
    });
    fab.addEventListener("pointerup", (event) => {
      try { fab.releasePointerCapture(event.pointerId); } catch { /* Nothing to release. */ }
      if (dragging) {
        try { localStorage.setItem(POSITION_KEY, JSON.stringify({ x: Number.parseFloat(wrap.style.left), y: Number.parseFloat(wrap.style.top) })); } catch { /* Position persistence is optional. */ }
      } else toggle();
      dragging = false;
    });
    fab.addEventListener("pointercancel", () => { dragging = false; });
    fab.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } });
    wrap.querySelectorAll(".uldada-close").forEach((button) => button.addEventListener("click", close));
    openSettingsButton.addEventListener("click", () => showPane("settings"));
    backSettingsButton.addEventListener("click", () => showPane("main"));
    window.addEventListener("resize", () => { if (menu.classList.contains("uldada-open")) place(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    countInput.addEventListener("change", () => { countInput.value = String(lineCount(countInput.value)); saveLines(countInput.value); });
    scaleInput.addEventListener("input", applyScale);
    previewScaleInput.addEventListener("input", () => {
      const value = previewScalePercent(previewScaleInput.value);
      previewScaleInput.value = String(value);
      previewScaleOutput.textContent = `${value}%`;
      document.documentElement.style.setProperty("--uldada-preview-scale", String(value / 100));
      savePreviewScale(value);
    });
    formatInput.addEventListener("change", () => { saveFormat(formatInput.value); applyNativeFormat(); });
    preview.addEventListener("input", () => { copyButton.disabled = !preview.value.trim(); });
    generateButton.addEventListener("click", async () => {
      const count = lineCount(countInput.value); countInput.value = String(count); saveLines(count); generateButton.disabled = true; setStatus("Generating…");
      try { preview.value = await generate(count); copyButton.disabled = !preview.value.trim(); setStatus("Preview ready. Edit it, then copy it to the club composer."); place(); }
      catch (error) { setStatus(error instanceof Error ? error.message : "Could not generate a preview.", true); }
      finally { generateButton.disabled = false; }
    });
    copyButton.addEventListener("click", () => {
      const text = preview.value.trim();
      if (!text) return setStatus("Generate or enter text first.", true);
      if (postBody.value.trim() && !window.confirm("Replace the text already in the club post field?")) return setStatus("Kept the existing post text.");
      applyNativeFormat();
      postBody.value = text;
      postBody.dispatchEvent(new Event("input", { bubbles: true })); postBody.dispatchEvent(new Event("change", { bubbles: true })); postBody.focus();
      setStatus("Copied to the club post field. You still need to post it yourself."); close();
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => void mount(), { once: true });
  else void mount();
})();
