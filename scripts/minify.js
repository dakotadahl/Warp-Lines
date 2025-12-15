import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  const srcPath = path.join(__dirname, '../src/Homepage/index.html');
  const distPath = path.join(__dirname, '../dist/webflow/index.html');
  
  // Ensure dist directory exists
  const distDir = path.dirname(distPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Check if source file exists
  if (!fs.existsSync(srcPath)) {
    console.error(`❌ Source file not found: ${srcPath}`);
    process.exit(1);
  }
  
  // Read source
  console.log(`📖 Reading: ${srcPath}`);
  const html = fs.readFileSync(srcPath, 'utf8');
  const originalSize = html.length;
  
  // Minify
  console.log('⚙️  Minifying...');
  const minified = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: {
      compress: {
        drop_console: true,  // Remove console.log statements
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      },
      mangle: false  // Keep variable names readable for debugging
    },
    removeConsole: true
  });
  
  const minifiedSize = minified.length;
  const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
  
  // Write output
  fs.writeFileSync(distPath, minified);
  
  console.log(`✅ Built: ${distPath}`);
  console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
  console.log(`   Reduction: ${reduction}%`);
}

build().catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});

