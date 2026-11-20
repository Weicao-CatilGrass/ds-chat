const { app, BrowserWindow, Menu, protocol, session, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const APP_SCHEME = 'dschat'
const APP_HOST = 'ds-chat'
const START_URL = process.env.ELECTRON_START_URL
const isDev = !app.isPackaged
// 某些受限桌面环境会禁用 Chromium 沙箱；启动参数已经关闭沙箱时，渲染进程也保持一致，
// 否则 sandboxed preload 会因为拿不到 startupData 而直接失败。正常启动仍然开启沙箱。
const noSandbox = process.argv.includes('--no-sandbox')

/**
 * 数据目录就是“目标本机”的落点：
 * - 免安装 zip / tar.gz：可执行文件同级的 data/，拷走整个目录即可迁移；
 * - 只读安装目录：系统应用数据目录下的 DeepSeek/；
 * - 开发：项目内 .electron-data/。
 * localStorage（API Key）与 IndexedDB（会话、附件）都由 Electron 持久化在这个目录里。
 */
const resolveDataDir = () => {
  if (process.env.DSCHAT_DATA_DIR) {
    return path.resolve(process.env.DSCHAT_DATA_DIR)
  }
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data')
  }
  if (app.isPackaged) {
    // 免安装 zip / tar.gz：优先把 data/ 放在可执行文件旁边，整个目录拷走即可迁移。
    // 安装到只读目录时退回系统应用数据目录。
    const portableData = path.join(path.dirname(app.getPath('exe')), 'data')
    try {
      fs.mkdirSync(portableData, { recursive: true })
      return portableData
    } catch {
      // 没有写权限，使用 AppData。
    }
  }
  return path.join(app.getPath('appData'), 'DeepSeek')
}

const dataDir = resolveDataDir()
fs.mkdirSync(dataDir, { recursive: true })
app.setName('DeepSeek')
app.setPath('userData', dataDir)

// 自定义 scheme 必须注册为安全来源，IndexedDB / localStorage / 剪贴板 API 才能按正常网页权限工作；
// 固定主机名保证每次启动的 origin 一致，历史会话不会因为端口变化而“消失”。
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
}

const serveStatic = async (request) => {
  const url = new URL(request.url)
  if (url.host !== APP_HOST) {
    return new Response('Not found', { status: 404 })
  }
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html'
  }
  const distDir = path.join(app.getAppPath(), 'dist')
  const filePath = path.normalize(path.join(distDir, pathname))
  if (filePath !== distDir && !filePath.startsWith(distDir + path.sep)) {
    return new Response('Forbidden', { status: 403 })
  }
  try {
    const data = await fs.promises.readFile(filePath)
    const type = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
    return new Response(data, {
      headers: {
        'content-type': type,
        'cache-control':
          pathname === '/index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

const openDataDir = () => {
  void shell.openPath(app.getPath('userData'))
}

const buildMenu = () => {
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    {
      label: '文件',
      submenu: [
        { label: '打开数据目录', click: openDataDir },
        { type: 'separator' },
        { role: 'close', label: '关闭窗口' },
        { role: 'quit', label: '退出' },
      ],
    },
    { role: 'editMenu', label: '编辑' },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        ...(isDev ? [{ role: 'toggleDevTools', label: '开发者工具' }] : []),
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    title: 'DeepSeek',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      partition: 'persist:ds-chat',
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: !noSandbox,
      webviewTag: false,
      spellcheck: false,
    },
  })

  win.once('ready-to-show', () => win.show())
  if (isDev) {
    win.webContents.on('did-fail-load', (_event, code, description, url) => {
      process.stderr.write(`[load-fail] ${code} ${description} ${url}\n`)
    })
    win.webContents.on('render-process-gone', (_event, details) => {
      process.stderr.write(`[render-gone] ${JSON.stringify(details)}\n`)
    })
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = START_URL
      ? url.startsWith(START_URL)
      : url.startsWith(`${APP_SCHEME}://${APP_HOST}/`)
    if (!allowed) {
      event.preventDefault()
      if (/^https?:\/\//i.test(url)) {
        void shell.openExternal(url)
      }
    }
  })

  if (START_URL) {
    void win.loadURL(START_URL)
  } else {
    void win.loadURL(`${APP_SCHEME}://${APP_HOST}/index.html`)
  }
  return win
}

// 第二次启动只把已有窗口叫到前面，避免两个实例抢同一个 IndexedDB。
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) {
        win.restore()
      }
      win.focus()
    }
  })

  app.whenReady().then(() => {
    // 窗口使用独立持久化分区，协议处理器必须注册在同一个 session 上，
    // 否则 dschat:// 请求会落空，页面得到空文档且没有可用的 storage origin。
    const chatSession = session.fromPartition('persist:ds-chat')
    chatSession.protocol.handle(APP_SCHEME, serveStatic)

    // 页面来源是 dschat://ds-chat，服务端 CORS 未必认识这个来源。
    // 只对 API 域补 CORS 头，既不关闭 webSecurity，也不影响其它站点。
    chatSession.webRequest.onHeadersReceived(
      { urls: ['https://api.deepseek.com/*'] },
      (details, callback) => {
        const headers = {}
        for (const [key, value] of Object.entries(details.responseHeaders ?? {})) {
          if (!/^access-control-/i.test(key)) {
            headers[key] = value
          }
        }
        headers['Access-Control-Allow-Origin'] = ['*']
        headers['Access-Control-Allow-Headers'] = ['*']
        headers['Access-Control-Allow-Methods'] = ['GET,POST,PUT,PATCH,DELETE,OPTIONS']
        callback({ responseHeaders: headers })
      }
    )
    buildMenu()

    // 语音输入需要麦克风；剪贴板写入用于复制回答。
    const allowedPermissions = new Set(['media', 'clipboard-sanitized-write', 'clipboard-read'])
    chatSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      callback(allowedPermissions.has(permission))
    })
    chatSession.setPermissionCheckHandler((_webContents, permission) => {
      return allowedPermissions.has(permission)
    })

    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
