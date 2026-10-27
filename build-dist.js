// Bygger en produksjonsmappe (dist/) med minifiserte HTML-filer. Kildefilene endres ikke.
const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

const root = __dirname;
const out = path.join(root, 'dist');
const skip = new Set(['node_modules', '.git', '.wrangler', 'backup', 'dist', 'package.json', 'package-lock.json', 'wrangler.jsonc', '.assetsignore', 'build-dist.js', 'input.css', 'tailwind.config.js']);

async function copy(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (src === root && skip.has(entry.name)) continue;
        const from = path.join(src, entry.name);
        const to = path.join(dest, entry.name);
        if (entry.isDirectory()) await copy(from, to);
        else if (entry.name.endsWith('.html')) {
            const html = fs.readFileSync(from, 'utf8');
            const min = await minify(html, {
                collapseWhitespace: true,
                conservativeCollapse: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: false
            });
            fs.writeFileSync(to, min);
            console.log(`${path.relative(root, from)}: ${html.length} -> ${min.length}`);
        } else fs.copyFileSync(from, to);
    }
}

fs.rmSync(out, { recursive: true, force: true });
copy(root, out).catch(err => { console.error(err); process.exit(1); });
