import type { CapacitorConfig } from '@capacitor/cli'

// Android 壳复用同一份 dist；WebView 的 localStorage / IndexedDB 落在应用私有目录，
// 因此 API Key 和会话默认就只存在目标设备上。
const config: CapacitorConfig = {
  appId: 'app.dschat',
  appName: 'DeepSeek',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
