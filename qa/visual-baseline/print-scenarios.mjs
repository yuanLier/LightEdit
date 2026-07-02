import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const baseDir = dirname(fileURLToPath(import.meta.url))
const baseline = JSON.parse(readFileSync(join(baseDir, 'scenarios.json'), 'utf8'))

console.log('LightEdit visual baseline')
console.log(`Viewport: ${baseline.viewport.width}x${baseline.viewport.height}`)
console.log(`Suggested output: ${baseline.recommendedOutputDir}`)
console.log('')

for (const scenario of baseline.scenarios) {
  console.log(`${scenario.file} - ${scenario.title}`)
  console.log(`  id: ${scenario.id}`)
  console.log(`  setup: ${scenario.setup.join(' ')}`)
  console.log(`  checkpoints: ${scenario.checkpoints.join(' ')}`)
  console.log('')
}
