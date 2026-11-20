# DeepSeek Chat

[English](README.md) | 简体中文

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

## 许可证

[MIT](LICENSE)。
