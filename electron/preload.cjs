const { contextBridge } = require('electron')

// 只暴露只读的运行环境信息；页面本身仍按普通浏览器应用工作。
// 需要给设置页加“打开数据目录”按钮时，再通过 ipcRenderer.invoke 增加白名单方法。
contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  platform: process.platform,
})
