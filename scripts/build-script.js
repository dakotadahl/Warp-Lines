import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  const srcPath = path.join(__dirname, '../index.html');
  const distPath = path.join(__dirname, '../dist/script.js');

  const distDir = path.dirname(distPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  if (!fs.existsSync(srcPath)) {
    console.error('❌ Source not found:', srcPath);
    process.exit(1);
  }

  const html = fs.readFileSync(srcPath, 'utf8');
  const bodyStart = html.indexOf('<body>');
  const scriptOpen = html.indexOf('<script>', bodyStart);
  const scriptClose = html.indexOf('</script>', scriptOpen);
  if (scriptOpen === -1 || scriptClose === -1 || scriptClose <= scriptOpen) {
    console.error('❌ No inline script found in', srcPath);
    process.exit(1);
  }
  const code = html.slice(scriptOpen + 8, scriptClose).trim();
  const originalSize = code.length;

  console.log('📖 Extracting script from index.html');
  const result = await minify(code, {
    compress: {
      drop_console: true,
      pure_funcs: ['console.log', 'console.debug', 'console.info'],
      passes: 1
    },
    mangle: false,
    format: { comments: false }
  });

  if (result.error) {
    console.error('❌ Minify error:', result.error);
    process.exit(1);
  }

  const minified = result.code;
  const minifiedSize = minified.length;
  const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

  fs.writeFileSync(distPath, minified);

  console.log('✅ Built:', distPath);
  console.log('   Original:', (originalSize / 1024).toFixed(2), 'KB');
  console.log('   Minified:', (minifiedSize / 1024).toFixed(2), 'KB');
  console.log('   Reduction:', reduction + '%');
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
