import { buildXmp, buildTxt } from './xmp.js';
import { fmtLen, parseCsv, toCsv, deriveAssetClass, deriveIsUploadedClass, searchFilter, throttleRAF, parseXmp } from './utils.js';

const d = (sel, el=document) => el.querySelector(sel);
const all = (sel, el=document) => [...el.querySelectorAll(sel)];
const api = window.api;

let CFG = null;
let CURRENT_ROOT = null;
let CURRENT_DIR = null;
let ITEMS = []; // { name, path, type, isVideo, meta? }
let SELECTED = null;

const elRootSelect = d('#root-select');
const elFolderList = d('#folder-list');
const elGrid = d('#grid');
const elSearch = d('#search');
const elPlayer = d('#player');
const elContext = d('#context');

const form = {
  title: d('#m-title'),
  desc: d('#m-desc'),
  stars: d('#m-stars'),
  director: d('#m-director'),
  release: d('#m-release'),
  recording: d('#m-recording'),
  tags: d('#m-tags'),
  cats: d('#m-cats'),
  sexrating: d('#m-sexrating'),
  rating: d('#m-rating'),
  assettype: d('#m-assettype')
};

async function init() {
  CFG = await api.readConfig();
  populateRoots();
  if (CFG.roots && CFG.roots.length) {
    await loadRoot(CFG.roots[0]);
  }
  bindUI();
}

function populateRoots() {
  elRootSelect.innerHTML = '';
  for (const r of CFG.roots) {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    elRootSelect.appendChild(opt);
  }
}

async function loadRoot(root) {
  CURRENT_ROOT = root;
  elRootSelect.value = root;
  await loadDir(root);
  renderFolders(root);
}

async function loadDir(dir) {
  CURRENT_DIR = dir;
  const res = await api.listDir(dir);
  if (res.error) {
    alert('Error reading directory: ' + res.error);
    return;
  }
  ITEMS = [];
  for (const e of res.entries) {
    if (e.type === 'file' && e.isVideo) {
      const xml = await api.readXmp(e.path);
      let meta = xml ? parseXmp(xml) : {};
      ITEMS.push({ ...e, meta });
    }
  }
  renderGrid();
}

function renderFolders(root) {
  // Simple one-level list for now
  elFolderList.innerHTML = '';
  const li = document.createElement('li');
  li.textContent = root;
  li.onclick = () => loadDir(root);
  elFolderList.appendChild(li);
}

function renderGrid() {
  elGrid.innerHTML = '';
  const q = elSearch.value.trim();
  for (const item of ITEMS) {
    if (!searchFilter(q, item)) continue;
    const el = buildCard(item);
    elGrid.appendChild(el);
  }
}

function buildCard(item) {
  const tpl = d('#tpl-item');
  const el = tpl.content.firstElementChild.cloneNode(true);
  const name = d('.name', el);
  const tags = d('.tags', el);
  const thumb = d('.thumb', el);
  const poster = d('.poster', el);
  const hovervid = d('.hovervid', el);
  const kind = d('.badge.kind', el);
  const len = d('.badge.len', el);

  // Name + tags
  name.textContent = item.name;
  tags.textContent = (item.meta?.tags || []).slice(0, 5).join(', ');
  const assetClass = deriveAssetClass(item.meta || {});
  const isUploadedClass = deriveIsUploadedClass(item.meta || {});
  el.classList.add(assetClass);
  el.classList.add(isUploadedClass);

  // Kind badge text
  kind.textContent = assetClass;

  // Draw a simple poster (first frame approx) by loading the video metadata and seeking to ~1s
  setupPoster(poster, hovervid, item.path, len);

  // Hover-scrub: map mouse X to currentTime
  const onMove = throttleRAF(async (ev) => {
    if (hovervid.readyState < 1) return;
    const rect = thumb.getBoundingClientRect();
    const x = Math.min(Math.max(ev.clientX - rect.left, 0), rect.width);
    const ratio = rect.width > 0 ? x / rect.width : 0;
    const dur = hovervid.duration || 0;
    const t = dur * ratio;
    if (isFinite(t)) {
      try { hovervid.currentTime = t; } catch {}
    }
  });

  thumb.addEventListener('mouseenter', async () => {
    hovervid.style.display = 'block';
    poster.style.display = 'none';
    if (!hovervid.src) {
      hovervid.src = 'file://' + item.path;
      hovervid.preload = 'metadata';
      hovervid.addEventListener('loadedmetadata', () => {
        len.textContent = fmtLen(hovervid.duration);
      }, { once: true });
    }
    hovervid.playbackRate = 1.0;
    hovervid.pause(); // keep paused; we manually scrub
  });

  thumb.addEventListener('mousemove', onMove);

  thumb.addEventListener('mouseleave', () => {
    hovervid.style.display = 'none';
    poster.style.display = 'block';
  });

  // Left click => Play in player
  el.addEventListener('click', () => {
    selectItem(item, el);
    playInPlayer(item.path);
  });

  // Context menu
  el.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    showContextMenu(ev.clientX, ev.clientY, item);
  });

  return el;
}

function setupPoster(canvas, video, filePath, lenEl) {
  const ctx = canvas.getContext('2d');
  const v = document.createElement('video');
  v.muted = true;
  v.preload = 'metadata';
  v.src = 'file://' + filePath;
  v.addEventListener('loadedmetadata', () => {
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 180;
    canvas.width = w;
    canvas.height = h;
    // Seek to 0.5s and draw
    const target = Math.min(0.5, (v.duration || 1) * 0.05);
    v.currentTime = target;
  });
  v.addEventListener('seeked', () => {
    try {
      const w = canvas.width, h = canvas.height;
      ctx.drawImage(v, 0, 0, w, h);
      if (isFinite(v.duration)) lenEl.textContent = fmtLen(v.duration);
    } catch {}
    v.remove(); // cleanup
  }, { once: true });
}

function selectItem(item, card) {
  SELECTED = item;
  all('.item.selected').forEach(el => el.classList.remove('selected'));
  card.classList.add('selected');

  // Fill form
  form.title.value = item.meta?.title || '';
  form.desc.value = item.meta?.description || '';
  form.stars.value = toCsv(item.meta?.pornstars || []);
  form.director.value = item.meta?.director || '';
  form.release.value = item.meta?.releaseDate || '';
  form.recording.value = item.meta?.recordingDate || '';
  form.tags.value = toCsv(item.meta?.tags || []);
  form.cats.value = toCsv(item.meta?.categories || []);
  form.sexrating.value = item.meta?.sexRating || 'non-nude';
  form.rating.value = item.meta?.rating || 0;
  form.assettype.value = item.meta?.assetType || 'full';
}

function playInPlayer(filePath) {
  elPlayer.src = 'file://' + filePath;
  elPlayer.play().catch(()=>{});
}

function showContextMenu(x, y, item) {
  elContext.style.left = x + 'px';
  elContext.style.top = y + 'px';
  elContext.style.display = 'block';

  const onClickAway = (ev) => {
    if (!elContext.contains(ev.target)) {
      elContext.style.display = 'none';
      window.removeEventListener('mousedown', onClickAway, true);
    }
  };
  window.addEventListener('mousedown', onClickAway, true);

  elContext.onclick = async (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    elContext.style.display = 'none';

    if (act === 'play') {
      selectItem(item, elGrid.querySelector('.item.selected') || elGrid.firstElementChild);
      playInPlayer(item.path);
    } else if (act === 'edit') {
      selectItem(item, elGrid.querySelector('.item.selected') || elGrid.firstElementChild);
      d('.inspector').scrollTop = 0;
    } else if (act.startsWith('Transcode') || act.startsWith('Upload')) {
      const res = await api.runAction(act, item.path);
      if (res?.error) alert(res.error);
      else alert(`Action "${act}" finished with code ${res.code}\n\nSTDOUT:\n${res.out}\n\nSTDERR:\n${res.err}`);
    }
  };
}

function bindUI() {
  d('#btn-add-root').addEventListener('click', async () => {
    const p = await api.chooseFolder();
    if (!p) return;
    if (!CFG.roots.includes(p)) {
      CFG.roots.push(p);
      await api.writeConfig(CFG); // persist to config.json
      populateRoots();
      await loadRoot(p);
    }
  });

  elRootSelect.addEventListener('change', async () => {
    await loadRoot(elRootSelect.value);
  });

  d('#open-in-folder').addEventListener('click', async () => {
    if (!SELECTED) return;
    await api.showItemInFolder(SELECTED.path);
  });
  d('#open-externally').addEventListener('click', async () => {
    if (!SELECTED) return;
    await api.openExternal(SELECTED.path);
  });

  d('#btn-save-meta').addEventListener('click', async () => {
    if (!SELECTED) return;
    const meta = {
      title: form.title.value.trim(),
      description: form.desc.value.trim(),
      pornstars: parseCsv(form.stars.value),
      director: form.director.value.trim(),
      releaseDate: form.release.value,
      recordingDate: form.recording.value,
      tags: parseCsv(form.tags.value),
      categories: parseCsv(form.cats.value),
      sexRating: form.sexrating.value,
      rating: Number(form.rating.value || 0),
      assetType: form.assettype.value
    };
    const xmp = buildXmp(meta);
    const txt = buildTxt(meta);
    const res = await api.writeSidecars(SELECTED.path, xmp, txt);
    if (res?.error) alert('Failed to save sidecars: ' + res.error);
    else {
      // Update in-memory meta + re-render card styling
      SELECTED.meta = meta;
      renderGrid();
      alert('Sidecars saved:\n' + res.xmpPath + '\n' + res.txtPath);
    }
  });

  elSearch.addEventListener('input', () => renderGrid());
}

init();
