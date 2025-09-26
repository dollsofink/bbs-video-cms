
// Generates a minimal XMP sidecar compatible with Adobe workflows;
// includes custom av:* namespace for additional fields.
export function buildXmp(meta) {
  const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const li = (arr) => (arr || []).map(v => `        <rdf:li>${esc(v)}</rdf:li>`).join('\n');
  const now = new Date().toISOString();

  return `<?xpacket begin='﻿' id='W5M0MpCehiHzreSzNTczkc9d'?>
<x:xmpmeta xmlns:x='adobe:ns:meta/' x:xmptk='VideoCMS Explorer'>
  <rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'
           xmlns:dc='http://purl.org/dc/elements/1.1/'
           xmlns:xmp='http://ns.adobe.com/xap/1.0/'
           xmlns:xmpDM='http://ns.adobe.com/xmp/1.0/DynamicMedia/'
           xmlns:av='http://aidenvalentine.com/ns/av/1.0/'>
    <rdf:Description rdf:about=''>
      <dc:title>${esc(meta.title)}</dc:title>
      <dc:description>${esc(meta.description)}</dc:description>

      <dc:subject>
        <rdf:Bag>
${li(meta.tags)}
        </rdf:Bag>
      </dc:subject>

      <xmp:Rating>${Number(meta.rating||0)}</xmp:Rating>
      <xmpDM:shotName>${esc(meta.title)}</xmpDM:shotName>

      <av:Director>${esc(meta.director)}</av:Director>
      <av:SexRating>${esc(meta.sexRating)}</av:SexRating>
      <av:AssetType>${esc(meta.assetType || 'full')}</av:AssetType>
      <av:ReleaseDate>${esc(meta.releaseDate||'')}</av:ReleaseDate>
      <av:RecordingDate>${esc(meta.recordingDate||'')}</av:RecordingDate>

      <av:Pornstars>
        <rdf:Bag>
${li(meta.pornstars)}
        </rdf:Bag>
      </av:Pornstars>

      <av:Categories>
        <rdf:Bag>
${li(meta.categories)}
        </rdf:Bag>
      </av:Categories>

      <xmp:MetadataDate>${now}</xmp:MetadataDate>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end='w'?>`;
}

export function buildTxt(meta) {
  const csv = (arr) => (arr || []).join(', ');
  return `Title: ${meta.title||''}
Description: ${meta.description||''}
Pornstars: ${csv(meta.pornstars)}
Director: ${meta.director||''}
`;
}
