window.ipc = window.ipc || (window.electron && window.electron.ipc);
// Fix drag issues
// == Anti-lock input guard ==
(function hardenInputFocus() {
  const NO_DRAG_SEL = 'input,textarea,select,button,a,[role="button"],[contenteditable="true"],.no-drag';

  // Make current controls non-draggable
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(NO_DRAG_SEL).forEach(el => {
      el.style.setProperty('-webkit-app-region', 'no-drag');
      el.style.pointerEvents = 'auto';
    });
  });

  // Keep it that way for dynamically-added UI (Webix/React/etc.)
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes?.forEach(n => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches(NO_DRAG_SEL)) {
          n.style.setProperty('-webkit-app-region', 'no-drag');
          n.style.pointerEvents = 'auto';
        }
        n.querySelectorAll?.(NO_DRAG_SEL).forEach(el => {
          el.style.setProperty('-webkit-app-region', 'no-drag');
          el.style.pointerEvents = 'auto';
        });
      });
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Kill any stray context menu/overlay before clicks reach inputs
  window.addEventListener("mousedown", (e) => {
    const m = document.getElementById("ctx");
    if (m && !m.contains(e.target)) m.remove();
  }, true);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.getElementById("ctx")?.remove();
  }, true);
})();

// Minimal demo file list render with multi-select + concat.
const fileList = document.getElementById('fileList');
const pathBar = document.getElementById('pathBar');
const openBtn = document.getElementById('openBtn');
const { ipc } = window.electron;

document.getElementById("settingsLink").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "settings.html";
});

openBtn.addEventListener('click', () => {
  const p = pathBar.value.trim();
  if (p) window.renderTree(p);
});

const selected = new Set();
function toggleSelect(tile, on) {
  if (on) {
    tile.classList.add("selected");
    selected.add(tile.dataset.path);
  } else {
    tile.classList.remove("selected");
    selected.delete(tile.dataset.path);
  }
}
function clearSelection() {
  selected.clear();
  document.querySelectorAll(".file.selected").forEach(el => el.classList.remove("selected"));
}

window.router = {
  openDirectory(p){
    pathBar.value = p;
    fileList.innerHTML = "";
    const demo = ["sample1.mp4","sample2.mp4","sample3.mp4","clip4.mov","clip5.mov"];
    for (const name of demo) {
      const div = document.createElement("div");
      div.className = "file";
      div.dataset.path = p + "/" + name;
      div.innerHTML = `<div class="thumb">[thumbnail]</div><div class="name">${name}</div>`;

      // click to select (supports ctrl/cmd additive)
      div.addEventListener("click", (ev) => {
        const multi = ev.ctrlKey || ev.metaKey || ev.shiftKey;
        if (!multi) clearSelection();
        toggleSelect(div, !div.classList.contains("selected"));
      });

      // Right-click
      div.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        if (!div.classList.contains("selected")) {
          clearSelection();
          toggleSelect(div, true);
        }
        showContextMenu(ev.pageX, ev.pageY, div.dataset.path);
      });
      fileList.appendChild(div);
    }
  }
};

function showContextMenu(x, y, videoPath) {
  const existing = document.getElementById("ctx");
  if (existing) existing.remove();
  const m = document.createElement("div");
  m.id = "ctx";
  Object.assign(m.style, {
    position: "absolute", left: x+"px", top: y+"px",
    background: "#fff", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", zIndex: 10000, minWidth: "240px", boxShadow: "0 6px 24px rgba(0,0,0,0.12)"
  });

  const mkItem = (label, handler) => {
    const el = document.createElement("div");
    el.textContent = label;
    el.style.padding = "8px";
    el.style.cursor = "pointer";
    el.addEventListener("click", async () => {
      m.remove();
      try { await handler(); } catch(e) { alert(String(e?.message||e)); }
    });
    return el;
  };

  // AI description
  m.appendChild(mkItem("A.i. powered description", async () => {
    const seconds = window.currentScrubSeconds || 0;
    const res = await ipc.invoke("ai:describeVideo", { videoPath, seconds });
    if (res?.ok) alert("XMP updated: " + res.xmpPath);
  }));

  // Concat appears only when multiple items are selected
  if (selected.size >= 2) {
    m.appendChild(document.createElement("hr"));
    m.appendChild(mkItem(`Concatenate ${selected.size} videos (copy codecs)`, async () => {
      const inputs = Array.from(selected);
      const res = await ipc.invoke("ffmpeg:concat", { inputs });
      if (res?.ok) alert("Saved: " + res.output);
    }));
  }

  document.body.appendChild(m);
  setTimeout(() => document.addEventListener("click", () => m.remove(), { once: true }), 0);
}


document.getElementById("updateLink").addEventListener("click", async (e) => {
  e.preventDefault();
  const res = await ipc.invoke("updates:checkNow");
  if (res?.ok) alert("Update check complete. If an update is available, it will download and install on quit.");
  else alert("Update check failed: " + (res?.error || "unknown error"));
});


  // Append transcode submenu and upload
  function addMenuExtras(menuEl, videoPath) {
    menuEl.appendChild(document.createElement("hr"));
    // Transcode submenu (simple stacked items)
    const tx1080 = document.createElement("div");
    tx1080.textContent = "Transcode → 1080p (H.264/AAC)";
    tx1080.style.padding = "8px"; tx1080.style.cursor = "pointer";
    tx1080.onclick = async () => {
      const res = await ipc.invoke("ffmpeg:transcode", { input: videoPath, preset: "1080p" });
      if (res?.ok) alert("Saved: " + res.output);
    };
    const tx4k = document.createElement("div");
    tx4k.textContent = "Transcode → 4K (H.264/AAC)";
    tx4k.style.padding = "8px"; tx4k.style.cursor = "pointer";
    tx4k.onclick = async () => {
      const res = await ipc.invoke("ffmpeg:transcode", { input: videoPath, preset: "4k" });
      if (res?.ok) alert("Saved: " + res.output);
    };
    const txsd = document.createElement("div");
    txsd.textContent = "Transcode → SD 480p (H.264/AAC)";
    txsd.style.padding = "8px"; txsd.style.cursor = "pointer";
    txsd.onclick = async () => {
      const res = await ipc.invoke("ffmpeg:transcode", { input: videoPath, preset: "sd" });
      if (res?.ok) alert("Saved: " + res.output);
    };
    const txcopy = document.createElement("div");
    txcopy.textContent = "Transcode → Unwatermarked (Rewrap copy)";
    txcopy.style.padding = "8px"; txcopy.style.cursor = "pointer";
    txcopy.onclick = async () => {
      const res = await ipc.invoke("ffmpeg:transcode", { input: videoPath, preset: "unwatermarked" });
      if (res?.ok) alert("Saved: " + res.output);
    };

    menuEl.appendChild(tx1080);
    menuEl.appendChild(tx4k);
    menuEl.appendChild(txsd);
    menuEl.appendChild(txcopy);

    // Upload To
    menuEl.appendChild(document.createElement("hr"));
    const uploadItem = document.createElement("div");
    uploadItem.textContent = "Upload To (Settings-defined destination)";
    uploadItem.style.padding = "8px";
    uploadItem.style.cursor = "pointer";
    uploadItem.onclick = async () => {
      try {
        const res = await ipc.invoke("upload:file", { filePath: videoPath });
        alert("Upload complete: " + (res?.status || "") );
      } catch(e) {
        alert("Upload failed: " + (e?.message || e));
      }
    };
    menuEl.appendChild(uploadItem);
  }

  // Patch showContextMenu to include extras
  const _origShow = showContextMenu;
  showContextMenu = function(x, y, videoPath) {
    _origShow(x, y, videoPath);
    const m = document.getElementById("ctx");
    if (m) addMenuExtras(m, videoPath);
  };

// This lets you type inspectFocus() in DevTools on a stuck field and it will diagnose and auto-fix.
// Put this anywhere in renderer (loads once)
window.inspectFocus = function(el = $0) {
  if (!el) { console.warn('Select an element in Elements panel or pass el'); return; }
  const cs = getComputedStyle(el).getPropertyValue('-webkit-app-region');
  console.log('drag region =', cs || '(empty)');
  const r = el.getBoundingClientRect();
  const topmost = document.elementFromPoint(r.left + 2, r.top + 2);
  console.log('topmost @ input =', topmost);

  // Auto-fix: ensure no-drag + enable pointer events
  el.style.setProperty('-webkit-app-region', 'no-drag');
  el.style.pointerEvents = 'auto';

  // If something is on top, make it non-blocking (temp)
  if (topmost && topmost !== el && topmost !== el.closest('#ctx')) {
    topmost.style.pointerEvents = 'none';
    console.warn('Temporarily disabled pointer-events on overlay:', topmost);
  }
};