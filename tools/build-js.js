// Builds app/js/libs.lite.js from app/js/libs.min.js without Modernizr.
// Modernizr's feature tests forced layouts for ~275 ms on phones; the only class the
// stylesheet needs from it (.no-touch) is now set by a one-line inline script in index.html.
//   usage (from the repository root):  node tools/build-js.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..', 'app', 'js');
const lines = fs.readFileSync(path.join(dir, 'libs.min.js'), 'utf8').split('\n');

const i = lines.findIndex((l) => l.startsWith('window.Modernizr='));
if (i === -1) throw new Error('Modernizr block not found');
const end = lines[i].indexOf('(this,this.document)') + '(this,this.document)'.length;
if (lines[i][end] !== ',') throw new Error('unexpected Modernizr boundary');
lines[i] = lines[i].slice(end + 1);

// a later snippet asks Modernizr whether SVG is supported (always true today)
const out = lines.join('\n').replace('Modernizr.svg ||', '!0 ||');
new vm.Script(out); // syntax check
if (/Modernizr/.test(out.replace(/\/\*[\s\S]*?\*\//g, ''))) throw new Error('Modernizr still referenced');
fs.writeFileSync(path.join(dir, 'libs.lite.js'), out);
console.log(`libs.min.js ${(fs.statSync(path.join(dir, 'libs.min.js')).size / 1024).toFixed(0)} KB -> libs.lite.js ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);