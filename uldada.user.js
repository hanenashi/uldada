// ==UserScript==
// @name         Uldada for Neftipné creatory
// @namespace    https://github.com/hanenashi/uldada
// @version      1.1.0
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
  const CREATOR_URL = "https://yirkha.fud.cz/creators/ultradada2.php";
  const DEFAULT_LINES = 3;
  const LINES_KEY = "uldada-line-count";
  const POSITION_KEY = "uldada-position";
  const EDGE = 10;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lineCount = (value) => clamp(Number.parseInt(value, 10) || DEFAULT_LINES, 2, 30);

  const savedLines = async () => {
    try { return lineCount(await GM_getValue(LINES_KEY, DEFAULT_LINES)); } catch { return DEFAULT_LINES; }
  };
  const saveLines = (value) => {
    try { void GM_setValue(LINES_KEY, lineCount(value)); } catch { /* Storage is optional. */ }
  };
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
      :root{--uldada-scale:${scale}}
      #uldada-wrap,#uldada-wrap *{box-sizing:border-box}
      #uldada-wrap{position:fixed;right:12px;bottom:max(82px,calc(env(safe-area-inset-bottom) + 62px));z-index:2147483646;max-width:calc(100vw - 20px);color:#fff;font:calc(14px * var(--uldada-scale))/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      #uldada-fab{display:inline-flex;align-items:center;gap:calc(7px * var(--uldada-scale));min-height:calc(44px * var(--uldada-scale));padding:calc(9px * var(--uldada-scale)) calc(14px * var(--uldada-scale));border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(22,23,28,.92);box-shadow:0 6px 18px rgba(0,0,0,.48);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;cursor:pointer;user-select:none;touch-action:none;font-weight:760;letter-spacing:.01em}
      #uldada-fab:focus-visible{outline:3px solid #9dd0ff;outline-offset:3px}.uldada-spark{color:#ffd66b;font-size:1.2em;line-height:1}.uldada-chevron{opacity:.8;transition:transform 160ms ease}#uldada-fab[aria-expanded="true"] .uldada-chevron{transform:rotate(180deg)}
      #uldada-menu{position:fixed;display:none;width:min(calc(340px * var(--uldada-scale)),calc(100vw - 20px));max-height:min(calc(600px * var(--uldada-scale)),calc(100dvh - 20px));overflow:auto;padding:calc(13px * var(--uldada-scale));border:1px solid rgba(255,255,255,.16);border-radius:calc(16px * var(--uldada-scale));background:rgba(25,26,32,.97);box-shadow:0 18px 46px rgba(0,0,0,.66);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#f8f9fb}
      #uldada-menu.uldada-open{display:flex;flex-direction:column;gap:calc(11px * var(--uldada-scale))}.uldada-heading{display:flex;align-items:center;gap:calc(8px * var(--uldada-scale))}.uldada-heading h2{margin:0;flex:1;color:#fff;font-size:calc(17px * var(--uldada-scale));line-height:1.15}.uldada-caption,#uldada-status{margin:0;color:#c9ced9;font-size:calc(12px * var(--uldada-scale));line-height:1.45}
      .uldada-controls,.uldada-actions{display:flex;align-items:center;gap:calc(8px * var(--uldada-scale))}.uldada-controls label{color:#f1f3f6;font-weight:650}#uldada-line-count{width:calc(68px * var(--uldada-scale));min-height:calc(42px * var(--uldada-scale));padding:calc(7px * var(--uldada-scale));border:1px solid rgba(255,255,255,.2);border-radius:calc(8px * var(--uldada-scale));background:rgba(0,0,0,.28);color:#fff;font:inherit;text-align:center}
      #uldada-preview{width:100%;min-height:clamp(9rem,28dvh,15rem);padding:calc(11px * var(--uldada-scale));border:1px solid rgba(255,255,255,.18);border-radius:calc(10px * var(--uldada-scale));background:rgba(0,0,0,.28);color:#fff;resize:vertical;font:calc(15px * var(--uldada-scale))/1.45 Georgia,"Times New Roman",serif}#uldada-preview::placeholder{color:#aeb5c2}
      #uldada-menu button{min-height:calc(44px * var(--uldada-scale));padding:calc(9px * var(--uldada-scale)) calc(12px * var(--uldada-scale));border:1px solid rgba(255,255,255,.16);border-radius:calc(9px * var(--uldada-scale));background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font:inherit;font-weight:720}.uldada-close{min-width:calc(36px * var(--uldada-scale));min-height:calc(36px * var(--uldada-scale))!important;padding:0!important;border-radius:50%!important;font-size:calc(22px * var(--uldada-scale))!important;line-height:1!important}.uldada-primary{flex:1;background:rgba(80,160,255,.3)!important;border-color:rgba(80,160,255,.55)!important}.uldada-copy{flex:1;background:rgba(105,200,157,.22)!important;border-color:rgba(105,200,157,.45)!important}#uldada-menu button:hover:not(:disabled),#uldada-menu button:focus-visible{filter:brightness(1.18)}#uldada-menu button:focus-visible,#uldada-preview:focus-visible,#uldada-line-count:focus-visible{outline:3px solid #9dd0ff;outline-offset:2px}#uldada-menu button:disabled{cursor:not-allowed;opacity:.48}#uldada-status.uldada-error{color:#ffaaa9;font-weight:700}
      @media(max-width:420px){.uldada-actions{flex-direction:column;align-items:stretch}.uldada-controls{align-items:stretch;flex-wrap:wrap}.uldada-primary,.uldada-copy{width:100%}}@media(prefers-reduced-motion:reduce){#uldada-fab,.uldada-chevron{transition:none}}
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
        <div class="uldada-heading"><span class="uldada-spark" aria-hidden="true">✦</span><h2>Ultra-dada creator²</h2><button class="uldada-close" type="button" aria-label="Close Uldada">×</button></div>
        <p class="uldada-caption">Generate a preview, make it yours, then copy it to the club composer. Posting stays manual.</p>
        <div class="uldada-controls"><label for="uldada-line-count">Lines</label><input id="uldada-line-count" type="number" min="2" max="30" inputmode="numeric"><button class="uldada-primary" id="uldada-generate" type="button">Generate preview</button></div>
        <textarea id="uldada-preview" rows="6" spellcheck="true" placeholder="Your generated lines will appear here."></textarea>
        <div class="uldada-actions"><button class="uldada-copy" id="uldada-copy" type="button" disabled>Put into post field</button><button class="uldada-close" type="button">Close</button></div>
        <p id="uldada-status" role="status" aria-live="polite">Nothing has been posted.</p>
      </section>`;
    document.body.append(wrap);
    const fab = wrap.querySelector("#uldada-fab");
    const menu = wrap.querySelector("#uldada-menu");
    const countInput = wrap.querySelector("#uldada-line-count");
    const preview = wrap.querySelector("#uldada-preview");
    const generateButton = wrap.querySelector("#uldada-generate");
    const copyButton = wrap.querySelector("#uldada-copy");
    const status = wrap.querySelector("#uldada-status");
    countInput.value = String(await savedLines());
    const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle("uldada-error", error); };
    const close = () => { menu.classList.remove("uldada-open"); menu.setAttribute("aria-hidden", "true"); fab.setAttribute("aria-expanded", "false"); };
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
    try {
      const position = JSON.parse(localStorage.getItem(POSITION_KEY));
      if (Number.isFinite(position?.x) && Number.isFinite(position?.y)) {
        const rect = wrap.getBoundingClientRect();
        wrap.style.left = `${clamp(position.x, EDGE, window.innerWidth - rect.width - EDGE)}px`;
        wrap.style.top = `${clamp(position.y, EDGE, window.innerHeight - rect.height - EDGE)}px`;
        wrap.style.right = "auto"; wrap.style.bottom = "auto";
      }
    } catch { /* Keep the lower-right default. */ }
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
    window.addEventListener("resize", () => { if (menu.classList.contains("uldada-open")) place(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    countInput.addEventListener("change", () => { countInput.value = String(lineCount(countInput.value)); saveLines(countInput.value); });
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
      postBody.value = text;
      postBody.dispatchEvent(new Event("input", { bubbles: true })); postBody.dispatchEvent(new Event("change", { bubbles: true })); postBody.focus();
      setStatus("Copied to the club post field. You still need to post it yourself."); close();
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => void mount(), { once: true });
  else void mount();
})();
