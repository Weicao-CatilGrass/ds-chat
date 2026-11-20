import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// 开发模式：先起 rspack dev server，再让 Electron 指向它；退出 Electron 时一并关掉 dev server。
const require = createRequire(import.meta.url)
const rspack = fileURLToPath(new URL('../node_modules/@rspack/cli/bin/rspack.js', import.meta.url))
const electron = require('electron')

const server = spawn(process.execPath, [rspack, 'serve', '-c', 'rspack.config.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' },
})

const waitForServer = async () => {
  for (let i = 0; i < 120; i += 1) {
    try {
      const response = await fetch('http://127.0.0.1:8090/')
      if (response.ok) {
        return
      }
    } catch {
      // 还没监听端口，继续等。
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('rspack dev server did not start in 60s')
}

await waitForServer()
const app = spawn(electron, ['.'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_START_URL: 'http://127.0.0.1:8090/',
    DSCHAT_DATA_DIR: '.electron-data',
  },
})

const code = await new Promise((resolve) => {
  app.on('exit', (exitCode) => resolve(exitCode ?? 0))
  process.on('SIGINT', () => app.kill())
})

server.kill()
process.exit(code)
