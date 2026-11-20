# DeepSeek Chat

浏览器直连 DeepSeek API 的静态聊天界面，无应用后端。

## 运行

需要 Node.js 22.12+ 与 pnpm：

```sh
pnpm install
pnpm dev
```

打开 http://localhost:8090 。构建静态产物：

```sh
pnpm build
```

产物位于 `dist/`，可部署到静态服务器，也可直接打开 `dist/index.html`。

## 说明

API Key 与设置保存在 localStorage，会话与附件保存在 IndexedDB。首次使用需在设置中填写 API Key。

聊天默认使用 `deepseek-flash`，通过 Anthropic 兼容的 Messages / Files API 通信；搜索、链接阅读、语音等能力由所配置的服务提供。

开发命令：`pnpm dev`、`pnpm build`、`pnpm type`、`pnpm lint`、`pnpm format`。

## 客户端与发布

同一个 `dist/` 可分别装进 Electron 与 Android WebView：

- `pnpm electron:dev`：Electron 开发模式
- `pnpm electron:build`：生成 Windows 便携版 exe（需要图标与 `electron-builder`）
- `pnpm android:sync`：把 web 产物同步到 `android/`
- `pnpm android:build`：本机有 Android SDK 时生成 APK

桌面端数据保存在本机：

- Windows 便携版：exe 同级的 `data/`
- 安装版 / Linux：系统应用数据目录下的 `DeepSeek/`
- API Key 存在该目录的 localStorage，会话与附件存在 IndexedDB

推送 `main` 会触发 [Build and Release](.github/workflows/release.yml)：先预热并上传 `dist`，再并行构建 Windows、Linux、Android，最后发布 Release。产物名为 `ds-chat-weicao-windows.zip`、`ds-chat-weicao-linux.tar.gz`、`ds-chat-weicao-android.apk`。

## 许可证

[MIT](LICENSE)。
