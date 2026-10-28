// Builds the production assets and updates app/index.html in place.
//   usage (from the repository root):  node tools/build.js
//
// - JS: vendor/typed.min.js + menu.js + custom.js + parallax.js + mobile.js + contact.js -> js/site.js (one deferred request).
// - CSS: the source stylesheets are merged, the rules matching nothing in index.html or the scripts are dropped,
//   the result is minified to css/site.min.css and inlined in index.html (no render-blocking request).
// - Every asset URL gets ?v=<content hash>, so the server can cache them for a year.
// Sources stay untouched: edit app/css/*.css and app/js/*.js, then run this script again.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const app = path.join(__dirname, '..', 'app');
const read = (p) => fs.readFileSync(path.join(app, p), 'utf8');
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + ' KB';

const CSS_START = '<!-- build:css -->';
const CSS_END = '<!-- /build:css -->';

// ---------------------------------------------------------------- JS
const jsSources = ['vendor/typed.min.js', 'menu.js', 'custom.js', 'parallax.js', 'mobile.js', 'contact.js'];
const js = jsSources.map((f) => `/* ${f} */\n` + read('js/' + f).trim() + '\n').join(';\n');
new vm.Script(js); // syntax check
fs.writeFileSync(path.join(app, 'js', 'site.js'), js);
const particles = read('js/vendor/particles.min.js');
console.log(`js/site.js: ${kb(js)} (particles.min.js ${kb(particles)}, desktop only, after load)`);

// ---------------------------------------------------------------- CSS
const cssSources = [
  { file: 'plugins.css' },
  { file: 'main.css' },
  { file: 'colors/color-1.css', fix: (s) => s.replace(/\.\.\/\.\.\/(img|fonts)\//g, '../$1/') },
  { file: 'project-styles.css' },
];

function skipString(s, i) {
  const q = s[i];
  let j = i + 1;
  while (j < s.length && s[j] !== q) j += s[j] === '\\' ? 2 : 1;
  return j;
}

function stripComments(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") {
      const j = skipString(s, i);
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
    if (c === '"' || c === "'") { i = skipString(s, i) + 1; continue; }
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

// split a selector list on top-level commas (not inside :not(...) etc.)
function splitSelectors(head) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < head.length; i++) {
    const c = head[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) { out.push(head.slice(start, i)); start = i + 1; }
  }
  out.push(head.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}

// Every word that appears in the page or the scripts: a class or id missing from this set is never used.
function usedTokens() {
  let html = read('index.html');
  const a = html.indexOf(CSS_START), b = html.indexOf(CSS_END);
  if (a !== -1 && b !== -1) html = html.slice(0, a) + html.slice(b);
  return new Set((html + js + particles).match(/[\w-]+/g));
}

function selectorIsUsed(sel, used) {
  const bare = sel
    .replace(/\[[^\]]*\]/g, '')                       // attribute selectors
    .replace(/:(not|is|where|has)\([^)]*\)/g, '');    // functional pseudo-classes
  const names = bare.match(/[.#]-?[_a-zA-Z][\w-]*/g) || [];
  return names.every((n) => used.has(n.slice(1)));
}

function purge(list, used) {
  const kept = [];
  for (const unit of list) {
    const brace = unit.indexOf('{');
    if (brace === -1) { kept.push(unit); continue; }
    const head = unit.slice(0, brace).trim();
    const body = unit.slice(brace + 1, unit.lastIndexOf('}'));
    if (/^@(media|supports)/.test(head)) {
      const inner = purge(units(body), used);
      if (inner.length) kept.push(head + '{' + inner.join('') + '}');
    } else if (head.startsWith('@')) {
      kept.push(unit); // @font-face, @keyframes (filtered below), @page...
    } else {
      const sels = splitSelectors(head).filter((s) => selectorIsUsed(s, used));
      if (sels.length) kept.push(sels.join(',') + '{' + body + '}');
    }
  }
  return kept;
}

// drop @keyframes that no kept rule refers to
function dropUnusedKeyframes(list) {
  const isKf = (u) => /^@(-\w+-)?keyframes\s/.test(u);
  const rest = list.filter((u) => !isKf(u)).join('\n');
  const deep = (arr) => arr.filter((u) => {
    if (isKf(u)) {
      const name = u.match(/keyframes\s+([\w-]+)/)[1];
      return new RegExp('[\\s:,]' + name + '\\b').test(rest);
    }
    return true;
  });
  return deep(list);
}

// drop @font-face whose family no kept rule asks for (e.g. Font Awesome: icons are inline SVG now)
function dropUnusedFonts(list) {
  const isFont = (u) => u.startsWith('@font-face');
  const rest = list.filter((u) => !isFont(u)).join('\n');
  const declared = (rest.match(/(?<![\w-])font(-family)?\s*:[^;}]*/g) || []).join('\n');
  return list.filter((u) => {
    if (!isFont(u)) return true;
    const family = u.match(/font-family\s*:\s*["']?([^"';}]+)/)[1].trim();
    return declared.includes(family);
  });
}

function minify(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'") {
      const j = skipString(s, i);
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

const used = usedTokens();
let source = '';
let rules = [];
for (const src of cssSources) {
  let text = read('css/' + src.file);
  source += text;
  text = stripComments(text);
  if (src.fix) text = src.fix(text);
  rules = rules.concat(units(text));
}
const before = rules.length;
rules = dropUnusedFonts(dropUnusedKeyframes(purge(rules, used)));
// inline CSS lives in the page: url()s must be relative to index.html, not to css/
const css = minify(rules.join('\n')).replace(/url\((["']?)\.\.\//g, 'url($1');
fs.writeFileSync(path.join(app, 'css', 'site.min.css'), css);
console.log(`css: ${kb(source)} sources, ${before} rules -> ${rules.length} used rules, ${kb(css)} inlined`);

// ---------------------------------------------------------------- index.html
let html = read('index.html');
const a = html.indexOf(CSS_START), b = html.indexOf(CSS_END);
if (a === -1 || b === -1) throw new Error('build:css markers not found in index.html');
html = html.slice(0, a + CSS_START.length) + '\n  <style>' + css + '</style>\n  ' + html.slice(b);
html = html
  .replace(/js\/site\.js(\?v=\w+)?/, 'js/site.js?v=' + hash(js))
  .replace(/js\/vendor\/particles\.min\.js(\?v=\w+)?/, 'js/vendor/particles.min.js?v=' + hash(particles));
fs.writeFileSync(path.join(app, 'index.html'), html);
console.log(`index.html: ${kb(html)}`);
