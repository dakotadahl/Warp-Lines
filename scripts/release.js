#!/usr/bin/env node
/**
 * Production release helper: build + webflow prep + tag instructions.
 * Run from a clean main branch before pasting into Webflow, then run the printed git commands.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const version = pkg.version || '1.0.0';
const tag = `v${version}`;

console.log('\n📦 Release helper\n');
console.log('1. Building and copying to clipboard...\n');
execSync('npm run build:webflow', { stdio: 'inherit', cwd: join(__dirname, '..') });
console.log('\n2. After you paste the script into Webflow and publish, tag and update prod:\n');
console.log(`   git tag -a ${tag} -m "Release ${tag} – warp lines for Webflow"`);
console.log('   git push origin ' + tag);
console.log('   git checkout prod && git merge main --ff-only && git push origin prod && git checkout main');
console.log('');
