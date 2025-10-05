
const fs = require("fs");
const path = require("path");
const os = require("os");

function ensureXmpPathForVideo(videoPath) {
  const dir = path.dirname(videoPath);
  const base = path.basename(videoPath, path.extname(videoPath));
  return path.join(dir, `${base}.xmp`);
}

// Very basic XMP document with Dublin Core fields we care about
function createXmp({ title, description, keywords = [] }) {
  const safe = (s) => (s || "").replace(/[&<>]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  const kwXml = keywords.map(k => `<rdf:li>${safe(k)}</rdf:li>`).join("");
  return `<?xpacket begin='\ufeff' id='W5M0MpCehiHzreSzNTczkc9d'?>
<x:xmpmeta xmlns:x='adobe:ns:meta/' x:xmptk='BBs Video CMS'>
<rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'>
<rdf:Description
  xmlns:dc='http://purl.org/dc/elements/1.1/'
  xmlns:xmp='http://ns.adobe.com/xap/1.0/'
  xmlns:xmpRights='http://ns.adobe.com/xap/1.0/rights/'
  xmlns:photoshop='http://ns.adobe.com/photoshop/1.0/'>
  <dc:title><rdf:Alt><rdf:li xml:lang='x-default'>${safe(title || "")}</rdf:li></rdf:Alt></dc:title>
  <dc:description><rdf:Alt><rdf:li xml:lang='x-default'>${safe(description || "")}</rdf:li></rdf:Alt></dc:description>
  <dc:subject><rdf:Bag>${kwXml}</rdf:Bag></dc:subject>
</rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end='w'?>
`;
}

function parseExistingXmp(xmpText) {
  // Minimal parse: pull dc:title, dc:description, dc:subject list
  const pick = (re, s) => (s.match(re) || [,""])[1];
  const title = pick(/<dc:title>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i, xmpText);
  const description = pick(/<dc:description>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i, xmpText);
  const kw = [];
  const re = /<dc:subject>[\s\S]*?<rdf:Bag>([\s\S]*?)<\/rdf:Bag>/i;
  const bag = pick(re, xmpText);
  if (bag) {
    const li = bag.match(/<rdf:li>([\s\S]*?)<\/rdf:li>/gi) || [];
    for (const m of li) kw.push(m.replace(/<\/?rdf:li>/gi, ""));
  }
  return { title, description, keywords: kw };
}

function mergeXmp(base, changes) {
  return {
    title: changes.title || base.title,
    description: changes.description || base.description,
    keywords: Array.from(new Set([...(base.keywords||[]), ...((changes.keywords)||[])]))
  };
}

function writeXmpForVideo(videoPath, fields) {
  const xmpPath = ensureXmpPathForVideo(videoPath);
  let existing = { title: "", description: "", keywords: [] };
  try {
    existing = parseExistingXmp(fs.readFileSync(xmpPath, "utf8"));
  } catch (_) {}
  const merged = mergeXmp(existing, fields);
  const xml = createXmp(merged);
  fs.writeFileSync(xmpPath, xml, "utf8");
  return xmpPath;
}

module.exports = { ensureXmpPathForVideo, writeXmpForVideo };
