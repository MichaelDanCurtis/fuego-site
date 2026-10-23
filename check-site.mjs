import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.join(import.meta.dirname, 'dist');
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html'));
let links = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate ids`);
  assert.match(html, /<html lang="en">/, `${file}: document language`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${file}: exactly one page heading`);
  assert.match(html, /name="viewport"/, `${file}: responsive viewport`);
  for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^https:\/\//.test(href)) continue;
    assert.ok(!/^(javascript:|http:)/.test(href), `${file}: unsafe URL ${href}`);
    const [pathname, fragment] = href.split('#');
    const target = pathname ? path.join(root, pathname === '/' ? 'index.html' : pathname) : path.join(root, file);
    assert.ok(fs.existsSync(target), `${file}: missing ${href}`);
    if (fragment) assert.match(fs.readFileSync(target, 'utf8'), new RegExp(`id="${fragment}"`), `${file}: missing anchor ${href}`);
    links++;
  }
}
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(home, /In active development/);
assert.match(home, /Interactive product illustration/);
for (const [, id] of home.matchAll(/aria-controls="([^"]+)"/g)) assert.match(home, new RegExp(`id="${id}"`));
for (const filename of ['site.js', 'style.css', 'robots.txt', 'sitemap.xml', 'assets/social.png']) assert.ok(fs.statSync(path.join(root, filename)).size > 0);
assert.ok(!/localStorage|sessionStorage|fetch\(|XMLHttpRequest/.test(fs.readFileSync(path.join(root, 'site.js'), 'utf8')), 'Demo should not persist data or make requests');
console.log(`Site checks passed: ${htmlFiles.length} pages, ${links} local links/assets, demo boundaries, metadata assets.`);
