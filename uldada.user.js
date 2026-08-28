// ==UserScript==
// @name         Uldada for Neftipné creatory
// @namespace    https://github.com/hanenashi/uldada
// @version      1.0.0
// @description  Generate Ultra-dada lines, preview them, then copy them into the Neftipné creatory composer.
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
  const DEFAULT_LINE_COUNT = 3;
  const STORAGE_KEY = "uldada-line-count";
  const POST_BODY_SELECTOR = "#post-body";
  const ARTICLE_FORM_SELECTOR = "#article-form-main";

  const clampLineCount = (value) => Math.min(30, Math.max(2, Number.parseInt(value, 10) || DEFAULT_LINE_COUNT));

  const readLineCount = async () => {
    try {
      return clampLineCount(await GM_getValue(STORAGE_KEY, DEFAULT_LINE_COUNT));
    } catch {
      return DEFAULT_LINE_COUNT;
    }
  };

  const saveLineCount = (value) => {
    try {
      void GM_setValue(STORAGE_KEY, clampLineCount(value));
    } catch {
      // The picker still works if the userscript manager does not expose storage.
    }
  };

  const getGeneratedText = (responseText) => {
    const documentFromCreator = new DOMParser().parseFromString(responseText, "text/html");
    const generated = documentFromCreator.querySelector("#t");
    if (!generated) {
      throw new Error("Ultra-dada returned an unexpected page.");
    }

    const copy = generated.cloneNode(true);
    copy.querySelectorAll("br").forEach((lineBreak) => lineBreak.replaceWith("\n"));
    return copy.textContent.replace(/\n{3,}/g, "\n\n").trim();
  };

  const requestCreator = (lineCount) => new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url: `${CREATOR_URL}?n=${encodeURIComponent(lineCount)}`,
      onload: (response) => {
        if (response.status < 200 || response.status >= 300) {
          reject(new Error(`Ultra-dada returned HTTP ${response.status}.`));
          return;
        }

        try {
          resolve(getGeneratedText(response.responseText));
        } catch (error) {
          reject(error);
        }
      },
      onerror: () => reject(new Error("Could not reach Ultra-dada.")),
      ontimeout: () => reject(new Error("Ultra-dada took too long to respond.")),
    });
  });

  const setStatus = (status, message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("uldada-error", isError);
  };

  const mount = async () => {
    const form = document.querySelector(ARTICLE_FORM_SELECTOR);
    const postBody = document.querySelector(POST_BODY_SELECTOR);
    if (!form || !postBody || document.querySelector("#uldada-panel")) {
      return;
    }

    const panel = document.createElement("section");
    panel.id = "uldada-panel";
    panel.innerHTML = `
      <div class="uldada-heading">
        <h2>Ultra-dada creator²</h2>
        <span>Generate first, post manually.</span>
      </div>
      <div class="uldada-controls">
        <label>Lines <input id="uldada-line-count" type="number" min="2" max="30" inputmode="numeric"></label>
        <button id="uldada-generate" type="button">Generate preview</button>
      </div>
      <label class="uldada-preview-label" for="uldada-preview">Preview — edit freely before copying</label>
      <textarea id="uldada-preview" rows="5" spellcheck="true" placeholder="Your generated lines will appear here."></textarea>
      <div class="uldada-actions">
        <button id="uldada-copy" type="button" disabled>Put into post field</button>
        <span id="uldada-status" role="status" aria-live="polite">Nothing has been posted.</span>
      </div>
    `;

    form.before(panel);

    const lineCountInput = panel.querySelector("#uldada-line-count");
    const preview = panel.querySelector("#uldada-preview");
    const generateButton = panel.querySelector("#uldada-generate");
    const copyButton = panel.querySelector("#uldada-copy");
    const status = panel.querySelector("#uldada-status");
    lineCountInput.value = String(await readLineCount());

    lineCountInput.addEventListener("change", () => {
      lineCountInput.value = String(clampLineCount(lineCountInput.value));
      saveLineCount(lineCountInput.value);
    });

    generateButton.addEventListener("click", async () => {
      const lineCount = clampLineCount(lineCountInput.value);
      lineCountInput.value = String(lineCount);
      saveLineCount(lineCount);
      generateButton.disabled = true;
      setStatus(status, "Generating…");

      try {
        preview.value = await requestCreator(lineCount);
        copyButton.disabled = !preview.value.trim();
        setStatus(status, "Preview ready. Review it, then copy it to the club composer.");
      } catch (error) {
        setStatus(status, error instanceof Error ? error.message : "Could not generate a preview.", true);
      } finally {
        generateButton.disabled = false;
      }
    });

    preview.addEventListener("input", () => {
      copyButton.disabled = !preview.value.trim();
    });

    copyButton.addEventListener("click", () => {
      const text = preview.value.trim();
      if (!text) {
        setStatus(status, "Generate or enter text first.", true);
        return;
      }

      if (postBody.value.trim() && !window.confirm("Replace the text already in the club post field?")) {
        setStatus(status, "Kept the existing post text.");
        return;
      }

      postBody.value = text;
      postBody.dispatchEvent(new Event("input", { bubbles: true }));
      postBody.dispatchEvent(new Event("change", { bubbles: true }));
      postBody.focus();
      setStatus(status, "Copied to the club post field. You still need to post it yourself.");
    });
  };

  const style = document.createElement("style");
  style.textContent = `
    #uldada-panel { box-sizing: border-box; margin: 1rem 0; padding: 1rem; border: 2px solid #4c6997; border-radius: 0.5rem; background: #e7eef9; color: #17263c; }
    #uldada-panel * { box-sizing: border-box; }
    .uldada-heading { display: flex; gap: 0.75rem; align-items: baseline; justify-content: space-between; flex-wrap: wrap; }
    .uldada-heading h2 { margin: 0; font-size: 1.15rem; }
    .uldada-heading span, #uldada-status { font-size: 0.9rem; color: #40536c; }
    .uldada-controls, .uldada-actions { display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap; margin-top: 0.8rem; }
    .uldada-controls input { width: 4.5rem; margin-left: 0.35rem; }
    .uldada-preview-label { display: block; margin-top: 0.85rem; font-weight: 700; }
    #uldada-preview { display: block; width: 100%; margin-top: 0.35rem; padding: 0.6rem; border: 1px solid #748fba; border-radius: 0.25rem; resize: vertical; font: 1rem/1.4 Georgia, "Times New Roman", serif; }
    #uldada-panel button { cursor: pointer; padding: 0.45rem 0.75rem; border: 1px solid #4c6997; border-radius: 0.25rem; background: #fff; color: #17263c; font-weight: 700; }
    #uldada-panel button:hover:not(:disabled), #uldada-panel button:focus-visible { background: #d5e3f5; }
    #uldada-panel button:disabled { cursor: wait; opacity: 0.65; }
    #uldada-status.uldada-error { color: #9b1c1c; font-weight: 700; }
    @media (max-width: 480px) { #uldada-panel { padding: 0.75rem; } .uldada-actions > * { width: 100%; } }
  `;
  document.head.append(style);

  void mount();
})();
