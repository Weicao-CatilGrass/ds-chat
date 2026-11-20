import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'

// 本地有 Android SDK 时可用；CI 里直接调用 Gradle，不经过这个脚本。
const run = (command, args, cwd = process.cwd()) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run(process.execPath, ['scripts/build.mjs'])
run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android'])

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
run(gradlew, ['assembleDebug'], path.join(process.cwd(), 'android'))

const apk = path.join(
  process.cwd(),
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'debug',
  'app-debug.apk'
)
if (!existsSync(apk)) {
  // eslint-disable-next-line no-console
  console.error(`APK not found: ${apk}`)
  process.exit(1)
}
copyFileSync(apk, path.join(process.cwd(), 'ds-chat-weicao-android.apk'))
// eslint-disable-next-line no-console
console.log('APK -> ds-chat-weicao-android.apk')
