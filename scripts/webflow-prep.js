import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function webflowPrep() {
    const distPath = path.join(__dirname, '../dist/script.js')

    if (!fs.existsSync(distPath)) {
        console.error('❌ dist/script.js not found. Run "npm run build" first.')
        process.exit(1)
    }

    const content = fs.readFileSync(distPath, 'utf8')
    const size = (content.length / 1024).toFixed(2)

    console.log(`\n✅ Production script ready: dist/script.js (${size} KB)`)

    // Try to copy to clipboard (macOS)
    try {
        execSync(`pbcopy < "${distPath}"`, { stdio: 'ignore' })
        console.log('📋 Copied to clipboard! (macOS)\n')
    } catch (e) {
        // Try xclip for Linux
        try {
            execSync(`xclip -selection clipboard < "${distPath}"`, { stdio: 'ignore' })
            console.log('📋 Copied to clipboard! (Linux)\n')
        } catch (e2) {
            console.log('⚠️  Could not copy to clipboard automatically')
            console.log(`   Copy from: ${path.resolve(distPath)}\n`)
        }
    }
}

webflowPrep()
