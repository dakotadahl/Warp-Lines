import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function webflowPrep() {
  const distPath = path.join(__dirname, '../dist/webflow/index.html');
  
  // Check if minified file exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Minified file not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const content = fs.readFileSync(distPath, 'utf8');
  
  // Write to a temp file for easy access
  const tempPath = path.join(__dirname, '../webflow-ready.html');
  fs.writeFileSync(tempPath, content);
  
  console.log('\n✅ Webflow-ready file created: webflow-ready.html');
  console.log('📋 Copy this file content to Webflow custom code section\n');
  
  // Try to copy to clipboard (macOS)
  try {
    execSync(`pbcopy < "${distPath}"`, { stdio: 'ignore' });
    console.log('✅ Copied to clipboard! (macOS)');
  } catch (e) {
    // Try xclip for Linux
    try {
      execSync(`xclip -selection clipboard < "${distPath}"`, { stdio: 'ignore' });
      console.log('✅ Copied to clipboard! (Linux)');
    } catch (e2) {
      console.log('⚠️  Could not copy to clipboard automatically');
      console.log('   Open webflow-ready.html and copy manually');
    }
  }
  
  console.log(`\n📁 File location: ${path.resolve(tempPath)}\n`);
}

webflowPrep();

