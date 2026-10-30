import { readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from '../src/config/site.mjs';

const output = fileURLToPath(new URL('../dist/', import.meta.url));
const urls = new Set();
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const name = relative(output, path).split(sep).join('/');
      if (/(^|\/)404(?:\/index)?\.html$/.test(name)) continue;
      const pathname = '/' + name.replace(/(^|\/)index\.html$/, '$1');
      urls.add(new URL(pathname, SITE_URL).href);
    }
  }
}
await collect(output);
const escapeXML = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  [...urls].sort().map(url => `  <url><loc>${escapeXML(url)}</loc></url>`).join('\n') + '\n</urlset>\n';
await writeFile(join(output, 'sitemap.xml'), body);
console.log(`Sitemap: ${urls.size} canonical pages`);
