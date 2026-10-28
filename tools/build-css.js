// Builds app/css/site.min.css: one minified stylesheet instead of five blocking requests.
//   usage (from the repository root):  node tools/build-css.js
// Sources stay untouched. Font Awesome (unused: icons are inline SVG now) is left out.
const fs = require('fs');
const path = require('path');

const css = path.join(__dirname, '..', 'app', 'css');
const sources = [
  { file: 'loaders/loader-color-1.css', fix: (s) => s.replace(/\.\.\/\.\.\/(img|fonts)\//g, '../$1/') },
  { file: 'plugins.css', stripFontAwesome: true },
  { file: 'main.css' },
  { file: 'colors/color-1.css', fix: (s) => s.replace(/\.\.\/\.\.\/(img|fonts)\//g, '../$1/') },
  { file: 'project-styles.css' },
];

function stripComments(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== c) j += s[j] === '\\' ? 2 : 1;
      out += s.slice(i, j + 1);
      i = j;
    } else if (c === '/' && s[i + 1] === '*') {
      const end = s.indexOf('*/', i + 2);
      i = end === -1 ? s.length : end + 1;
    } else out += c;
  }
  return out;
}

// split into top-level units: "selector{...}" / "@media{...}" / "@charset ...;"
function units(s) {
  const res = [];
  let depth = 0, start = 0, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== c) j += s[j] === '\\' ? 2 : 1;
      i = j + 1;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { res.push(s.slice(start, i + 1)); start = i + 1; }
    } else if (c === ';' && depth === 0) { res.push(s.slice(start, i + 1)); start = i + 1; }
    i++;
  }
  const tail = s.slice(start).trim();
  if (tail) res.push(tail);
  return res.map((u) => u.trim()).filter(Boolean);
}

const FA_TOKEN = /\.(fa|fas|far|fab|fal|fad|fat|fa-[\w-]+|svg-inline--fa)\b/;
function isFontAwesome(unit) {
  const head = unit.slice(0, unit.indexOf('{') === -1 ? unit.length : unit.indexOf('{'));
  const body = unit.slice(unit.indexOf('{') + 1);
  if (/^@(-\w+-)?keyframes\s+fa-/.test(head.trim())) return true;
  if (/^@font-face/.test(head.trim())) return /Font ?Awesome/i.test(body);
  if (/^@media|^@supports/.test(head.trim())) {
    const inner = units(body.slice(0, body.lastIndexOf('}')));
    return inner.length > 0 && inner.every(isFontAwesome);
  }
  if (/^:root|^:host/.test(head.trim())) return /--fa-/.test(body);
  const sels = head.split(',').map((x) => x.trim());
  return sels.length > 0 && sels.every((x) => FA_TOKEN.test(x));
}

function minify(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== c) j += s[j] === '\\' ? 2 : 1;
      out += s.slice(i, j + 1);
      i = j + 1;
    } else if (s.startsWith('url(', i)) {
      const end = s.indexOf(')', i);
      out += s.slice(i, end + 1).replace(/\s+/g, ' ');
      i = end + 1;
    } else if (/\s/.test(c)) {
      while (i < s.length && /\s/.test(s[i])) i++;
      out += ' ';
    } else { out += c; i++; }
  }
  return out
    .replace(/ ?([{};,]) ?/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .trim();
}

let total = 0;
let bundle = '';
for (const src of sources) {
  let text = fs.readFileSync(path.join(css, src.file), 'utf8');
  total += Buffer.byteLength(text);
  text = stripComments(text);
  if (src.fix) text = src.fix(text);
  if (src.stripFontAwesome) {
    const all = units(text);
    const kept = all.filter((u) => !isFontAwesome(u));
    console.log(`${src.file}: ${all.length - kept.length} Font Awesome rules removed, ${kept.length} kept`);
    text = kept.join('\n');
  }
  bundle += minify(text) + '\n';
}
fs.writeFileSync(path.join(css, 'site.min.css'), bundle);
console.log(`sources: ${(total / 1024).toFixed(0)} KB -> site.min.css: ${(Buffer.byteLength(bundle) / 1024).toFixed(0)} KB`);
