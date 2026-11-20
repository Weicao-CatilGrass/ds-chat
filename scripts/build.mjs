import { rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// 用 Node 统一 Windows/Linux 的构建入口，避免 `rm -rf`、`NODE_ENV=...` 这类只能跑在 Unix shell 的写法。
const rspack = fileURLToPath(new URL('../node_modules/@rspack/cli/bin/rspack.js', import.meta.url))

rmSync('dist', { recursive: true, force: true })
const result = spawnSync(process.execPath, [rspack, 'build', '-c', 'rspack.config.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
})
process.exit(result.status ?? 1)
