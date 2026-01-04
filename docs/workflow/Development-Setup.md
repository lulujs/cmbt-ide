# 开发环境设置指南

本文档介绍如何设置业务流程建模系统的开发环境。

## 目录

- [系统要求](#系统要求)
- [环境准备](#环境准备)
- [项目设置](#项目设置)
- [开发工作流](#开发工作流)
- [调试指南](#调试指南)
- [常见问题](#常见问题)

## 系统要求

### 操作系统

- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 18.04+, Fedora 30+)

### 软件要求

| 软件    | 版本要求     | 说明              |
| ------- | ------------ | ----------------- |
| Node.js | 18.x 或 20.x | 推荐使用 LTS 版本 |
| Yarn    | 1.22.x       | 包管理器          |
| Git     | 2.x+         | 版本控制          |
| VS Code | 最新版       | 推荐的 IDE        |

### 可选软件

| 软件       | 用途               |
| ---------- | ------------------ |
| Docker     | Dev Container 开发 |
| Python 3.x | 某些构建工具依赖   |

## 环境准备

### Windows 环境

1. 安装 Node.js：
   - 从 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本
   - 或使用 nvm-windows 管理多版本

2. 安装 Yarn：

```powershell
npm install -g yarn
```

3. 安装构建工具：

```powershell
npm install -g windows-build-tools
```

4. 配置 Git：

```powershell
git config --global core.autocrlf input
```

详细的 Windows 设置说明请参考 [Windows 先决条件](../PrerequisitesWindows.md)。

### macOS 环境

1. 安装 Homebrew（如果尚未安装）：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. 安装 Node.js：

```bash
brew install node@20
```

3. 安装 Yarn：

```bash
brew install yarn
```

4. 安装 Xcode 命令行工具：

```bash
xcode-select --install
```

### Linux 环境 (Ubuntu/Debian)

1. 安装 Node.js：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. 安装 Yarn：

```bash
npm install -g yarn
```

3. 安装构建依赖：

```bash
sudo apt-get install -y build-essential libx11-dev libxkbfile-dev libsecret-1-dev
```

### 使用 Dev Container (推荐)

如果您使用 VS Code，可以使用 Dev Container 进行开发，这样可以避免环境配置问题。

1. 安装 Docker Desktop
2. 安装 VS Code 的 "Dev Containers" 扩展
3. 打开命令面板 (Ctrl+Shift+P)
4. 选择 "Dev Containers: Clone Repository in Container Volume..."
5. 输入仓库 URL

## 项目设置

### 克隆仓库

```bash
git clone https://github.com/your-org/crossmodel.git
cd crossmodel
```

### 安装依赖

```bash
yarn install
```

这将安装所有工作区包的依赖。

### 生成语言服务器代码

```bash
yarn langium:generate
```

这将根据 Langium 语法文件生成解析器和类型定义。

### 构建项目

构建所有包：

```bash
yarn build
```

或者只构建特定目标：

```bash
# 构建浏览器版本
yarn build:browser

# 构建 Electron 版本
yarn build:electron
```

### 启动应用

浏览器版本：

```bash
yarn start:browser
```

然后在浏览器中打开 http://localhost:3000

Electron 版本：

```bash
yarn start:electron
```

## 开发工作流

### 监视模式

在开发过程中，使用监视模式可以自动重新编译更改的文件：

```bash
# 监视浏览器版本
yarn watch:browser

# 监视 Electron 版本
yarn watch:electron

# 监视特定包
cd packages/server
yarn watch
```

### 代码更改后的刷新

- **前端更改**：按 F5 刷新应用即可
- **后端更改**：需要重启应用

### 代码检查

```bash
# 运行 ESLint
yarn lint

# 自动修复问题
yarn lint:fix
```

### 代码格式化

```bash
# 格式化所有文件
yarn format

# 检查格式
yarn format:check
```

### 运行测试

```bash
# 运行所有测试
yarn test

# 运行特定包的测试
yarn workspace @crossmodel/server test

# 运行测试并生成覆盖率报告
yarn test:coverage

# 运行端到端测试
yarn ui-test
```

### 提交代码

项目使用 Conventional Commits 规范：

```bash
# 功能
git commit -m "feat: 添加新的节点类型"

# 修复
git commit -m "fix: 修复决策表验证问题"

# 文档
git commit -m "docs: 更新 API 文档"

# 重构
git commit -m "refactor: 重构模型服务"

# 测试
git commit -m "test: 添加节点创建测试"
```

## 调试指南

### VS Code 调试配置

项目包含预配置的调试配置。在 VS Code 中：

1. 打开调试面板 (Ctrl+Shift+D)
2. 选择调试配置
3. 按 F5 启动调试

### 可用的调试配置

| 配置名称              | 说明                           |
| --------------------- | ------------------------------ |
| Launch Browser App    | 启动浏览器版本并附加调试器     |
| Launch Electron App   | 启动 Electron 版本并附加调试器 |
| Debug Language Server | 调试语言服务器                 |
| Debug GLSP Server     | 调试 GLSP 服务器               |
| Debug Tests           | 调试测试                       |

### 调试语言服务器

1. 在 `packages/server/src/language-server/` 中设置断点
2. 选择 "Debug Language Server" 配置
3. 按 F5 启动
4. 在另一个终端启动应用：`yarn start:browser`

### 调试前端

1. 启动应用：`yarn start:browser`
2. 在浏览器中打开开发者工具 (F12)
3. 在 Sources 面板中设置断点

### 日志输出

```typescript
// 在代码中添加日志
import { Logger } from '@crossmodel/core';

const logger = Logger.getLogger('MyComponent');
logger.info('信息日志');
logger.warn('警告日志');
logger.error('错误日志');
```

查看日志：

- 浏览器版本：开发者工具控制台
- Electron 版本：View > Toggle Developer Tools

## 项目结构

```
crossmodel/
├── applications/
│   ├── browser-app/          # 浏览器应用
│   └── electron-app/         # Electron 应用
├── configs/                  # 共享配置
├── docs/                     # 文档
│   └── workflow/             # 工作流程文档
├── examples/                 # 示例项目
│   └── workflow-examples/    # 工作流程示例
├── extensions/               # VS Code 扩展
│   ├── crossmodel-lang/      # 语言支持扩展
│   └── crossmodel-theme/     # 主题扩展
├── packages/                 # Theia 扩展包
│   ├── composite-editor/     # 复合编辑器
│   ├── core/                 # 核心功能
│   ├── form-client/          # 表单客户端
│   ├── glsp-client/          # GLSP 客户端
│   ├── model-service/        # 模型服务
│   ├── product/              # 产品定制
│   ├── property-view/        # 属性视图
│   ├── protocol/             # 通信协议
│   ├── react-model-ui/       # React UI 组件
│   └── server/               # 服务器端
├── package.json              # 根 package.json
├── tsconfig.json             # TypeScript 配置
└── yarn.lock                 # 依赖锁定文件
```

## 常见问题

### 依赖安装失败

**问题**：`yarn install` 失败

**解决方案**：

1. 清除缓存：`yarn cache clean`
2. 删除 node_modules：`rm -rf node_modules`
3. 重新安装：`yarn install`

### 构建失败

**问题**：TypeScript 编译错误

**解决方案**：

1. 确保运行了 `yarn langium:generate`
2. 检查 TypeScript 版本
3. 清理构建：`yarn clean && yarn build`

### 端口被占用

**问题**：启动时提示端口被占用

**解决方案**：

```bash
# 查找占用端口的进程
lsof -i :3000

# 终止进程
kill -9 <PID>
```

### Electron 启动失败

**问题**：Electron 应用无法启动

**解决方案**：

1. 确保已构建：`yarn build:electron`
2. 检查 Electron 依赖：`yarn workspace electron-app install`
3. 重新构建原生模块：`yarn electron-rebuild`

### 热重载不工作

**问题**：代码更改后应用没有更新

**解决方案**：

1. 确保监视模式正在运行
2. 检查是否有编译错误
3. 对于后端更改，需要重启应用

## 相关文档

- [架构设计和扩展指南](./Architecture-Guide.md)
- [API 参考文档](./API-Reference.md)
- [贡献指南](../../CONTRIBUTING.md)
- [Windows 先决条件](../PrerequisitesWindows.md)
