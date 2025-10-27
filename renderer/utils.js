
// Tiny helpers used by the renderer
export function fmtLen(sec) {
  if (!sec || !isFinite(sec)) return '—';
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function parseCsv(str) {
  return (str || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function toCsv(arr) {
  return (arr || []).join(', ');
}

export function deriveAssetClass(meta) {
  const t = (meta.assetType || '').toLowerCase();
  if (t === 'trailer') return 'trailer';
  if (t === 'footage') return 'footage';
  return 'full';
}

export function deriveIsUploadedClass(meta) {
  const t = (meta.isUploaded || false);
  if (t === true) return 'isUploaded';
  return false;
}

export function searchFilter(q, item) {
  if (!q) return true;
  q = q.toLowerCase();
  const hay = [
    item.name || '',
    item.meta?.title || '',
    item.meta?.description || '',
    (item.meta?.pornstars || []).join(' '),
    (item.meta?.director || ''),
    (item.meta?.tags || []).join(' '),
    (item.meta?.categories || []).join(' '),
    (item.meta?.sexRating || ''),
    (item.meta?.assetType || '')
  ].join(' ').toLowerCase();
  return hay.includes(q);
}

export function throttleRAF(fn) {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      fn(...args);
      ticking = false;
    });
  };
}

// naive best-effort XMP parser for our minimal schema
export function parseXmp(xml) {
  if (!xml) return null;
  const out = {};
  const pick = (tag) => {
    const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    return m ? m[1].trim() : '';
  };
  out.title = pick('dc:title') || pick('xmpDM:shotName');
  out.description = pick('dc:description');
  out.director = pick('av:Director');
  out.sexRating = pick('av:SexRating');
  out.assetType = pick('av:AssetType') || 'full';
  const rating = pick('xmp:Rating');
  out.rating = rating ? Number(rating) : 0;
  const releaseDate = pick('av:ReleaseDate');
  const recordingDate = pick('av:RecordingDate');
  out.releaseDate = releaseDate || '';
  out.recordingDate = recordingDate || '';

  const bag = (xml.match(/<dc:subject>[\s\S]*?<\/dc:subject>/i)?.[0]) || '';
  const kw = [...bag.matchAll(/<rdf:li>(.*?)<\/rdf:li>/gi)].map(m => m[1].trim());
  out.tags = kw;

  const stars = (xml.match(/<av:Pornstars>[\s\S]*?<\/av:Pornstars>/i)?.[0]) || '';
  const ps = [...stars.matchAll(/<rdf:li>(.*?)<\/rdf:li>/gi)].map(m => m[1].trim());
  out.pornstars = ps;
  const cats = (xml.match(/<av:Categories>[\s\S]*?<\/av:Categories>/i)?.[0]) || '';
  const cs = [...cats.matchAll(/<rdf:li>(.*?)<\/rdf:li>/gi)].map(m => m[1].trim());
  out.categories = cs;

  return out;
}
