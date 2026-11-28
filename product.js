// Vercel serverless function: /p/:id  ->  HTML with Open Graph tags (so a shared product link shows its photo, name and price),
// then sends real visitors to the product page inside the store.
const SB = 'https://pkgkyfaeabcaxpoawsso.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZ2t5ZmFlYWJjYXhwb2F3c3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5Nzg1OTgsImV4cCI6MjExMDU1NDU5OH0.rgT2x_dzf6wD4dr89iRYiuV3CY6dPN-L9a4G5JLuy_8'; // public anon key (same one the website already uses)
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
module.exports = async (req, res) => {
  const id = parseInt((req.query && req.query.id) || '', 10);
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').replace(/[^a-zA-Z0-9.:-]/g, '');
  const origin = host ? 'https://' + host : '';
  const home = () => { res.statusCode = 302; res.setHeader('Location', '/'); res.end(); };
  if (!Number.isInteger(id) || id < 1 || id > 1e9) return home();
  try {
    const r = await fetch(SB + '/rest/v1/products?id=eq.' + id + '&active=eq.true&select=name,description,price,old_price,colors', { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (!r.ok) return home();
    const rows = await r.json(); const p = rows && rows[0]; if (!p) return home();
    let img = '';
    for (const c of (p.colors || [])) { const u = (c.images || []).find(x => /^https:\/\//i.test(x)); if (u) { img = u; break; } }
    if (!img) img = origin + '/og.png';
    const title = p.name + ' | سَلِسْ';
    const desc = (p.price + ' ج.م — ' + (p.description || 'ملابس قطنية فاخرة من سَلِسْ. الدفع عند الاستلام.')).slice(0, 200);
    const url = origin + '/p/' + id, target = '/#p=' + id;
    const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description || undefined, image: [img], brand: { '@type': 'Brand', name: 'Salis' }, offers: { '@type': 'Offer', url, priceCurrency: 'EGP', price: Number(p.price), availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition' } }).replace(/</g, '\\u003c');
    const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '">'
      + '<meta property="og:type" content="product"><meta property="og:site_name" content="سَلِسْ | Salis"><meta property="og:locale" content="ar_EG">'
      + '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(img) + '"><meta property="og:url" content="' + esc(url) + '">'
      + '<meta property="product:price:amount" content="' + esc(p.price) + '"><meta property="product:price:currency" content="EGP">'
      + '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '"><meta name="twitter:image" content="' + esc(img) + '">'
      + '<link rel="canonical" href="' + esc(url) + '"><script type="application/ld+json">' + ld + '</script><meta http-equiv="refresh" content="0;url=' + esc(target) + '"></head>'
      + '<body><p><a href="' + esc(target) + '">' + esc(p.name) + '</a></p></body></html>';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.end(html);
  } catch (e) { home(); }
};
