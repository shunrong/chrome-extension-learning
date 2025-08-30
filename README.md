# Chrome 浏览器插件开发指南

> 一份面向前端开发者的 Chrome 扩展开发完整指南，从基础概念到实际应用，助你快速上手开发功能丰富的浏览器扩展。

## 🎯 目录

- [Chrome 扩展 vs 普通 Web 应用](#chrome-扩展-vs-普通-web-应用)
- [开发环境准备](#开发环境准备)
- [项目结构](#项目结构)
- [Manifest 配置详解](#manifest-配置详解)
- [Action Popup 开发](#action-popup-开发)
- [Content Script 开发](#content-script-开发)
- [权限系统详解](#权限系统详解)
- [Chrome APIs 常用指南](#chrome-apis-常用指南)
- [消息传递机制](#消息传递机制)
- [数据存储方案](#数据存储方案)
- [调试与发布](#调试与发布)
- [最佳实践与常见问题](#最佳实践与常见问题)

---

## Chrome 扩展 vs 普通 Web 应用

### 🔄 核心差异对比

| 特性 | 普通 Web 应用 | Chrome 扩展 |
|------|---------------|-------------|
| **运行环境** | 浏览器标签页 | 浏览器进程 + 网页上下文 |
| **权限范围** | 单一域名限制 | 可跨域访问多个网站 |
| **生命周期** | 页面刷新重置 | 持久化运行 |
| **用户界面** | 完整页面 | Popup、侧边栏、注入元素 |
| **API 访问** | Web APIs | Web APIs + Chrome Extension APIs |
| **安全策略** | 标准 CSP | 严格 CSP (禁止内联脚本) |
| **数据存储** | localStorage、sessionStorage | Chrome Storage API |
| **网络请求** | 同源策略限制 | 可配置跨域权限 |

### 🏗️ 架构组成

Chrome 扩展由多个独立组件构成，每个组件运行在不同的执行上下文中：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Background    │    │   Content       │    │   Popup/        │
│   Script        │◄──►│   Script        │    │   Options       │
│   (Service      │    │   (页面注入)     │    │   (用户界面)     │
│    Worker)      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   Chrome APIs   │
                    │   (系统接口)     │
                    └─────────────────┘
```

---

## 开发环境准备

### 📋 前置要求

1. **Chrome 浏览器** (版本 88+)
2. **基础前端技能**：HTML、CSS、JavaScript (ES6+)
3. **开发工具**：任意代码编辑器 (推荐 VS Code)

### 🛠️ 开发工具设置

```bash
# VS Code 推荐插件
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension formulahendry.auto-rename-tag
```

### 🚀 创建第一个扩展

```bash
mkdir my-chrome-extension
cd my-chrome-extension
touch manifest.json popup.html popup.js
```

---

## 项目结构

### 📁 推荐目录结构

```
my-extension/
├── manifest.json          # 扩展配置文件 (必需)
├── background.js          # 后台脚本 (可选)
├── popup/                 # Popup 界面
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/               # 内容脚本
│   ├── content.js
│   └── content.css
├── options/               # 选项页面 (可选)
│   ├── options.html
│   ├── options.js
│   └── options.css
├── icons/                 # 图标资源
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── utils/                 # 共享工具
    ├── storage.js
    └── api.js
```

---

## Manifest 配置详解

### 📜 基础配置

`manifest.json` 是扩展的核心配置文件，定义了扩展的基本信息、权限和组件。

```json
{
  "manifest_version": 3,           // 必需：使用 Manifest V3
  "name": "我的扩展",               // 必需：扩展名称
  "version": "1.0.0",              // 必需：版本号
  "description": "扩展描述",        // 推荐：简短描述
  
  // 图标配置
  "icons": {
    "16": "icons/icon16.png",      // 扩展管理页面
    "48": "icons/icon48.png",      // 扩展管理页面
    "128": "icons/icon128.png"     // Chrome 网上应用店
  },
  
  // Action 配置 (工具栏按钮)
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "点击打开",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png"
    }
  }
}
```

### 🔧 高级配置选项

```json
{
  // 后台脚本 (Service Worker)
  "background": {
    "service_worker": "background.js"
  },
  
  // 内容脚本
  "content_scripts": [
    {
      "matches": ["https://*.example.com/*"],
      "js": ["content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_end"
    }
  ],
  
  // 权限声明
  "permissions": [
    "storage",           // 数据存储
    "activeTab",         // 当前标签页访问
    "scripting"          // 脚本注入
  ],
  
  // 主机权限 (Manifest V3)
  "host_permissions": [
    "https://*.google.com/*",
    "https://api.example.com/*"
  ],
  
  // 选项页面
  "options_page": "options/options.html",
  // 或者使用嵌入式选项
  "options_ui": {
    "page": "options/options.html",
    "open_in_tab": false
  },
  
  // Web 可访问资源
  "web_accessible_resources": [
    {
      "resources": ["images/*", "styles/*"],
      "matches": ["https://*.example.com/*"]
    }
  ],
  
  // 内容安全策略
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### ⚠️ Manifest V2 vs V3 主要变化

| 特性 | Manifest V2 | Manifest V3 |
|------|-------------|-------------|
| 后台脚本 | Background Pages | Service Workers |
| 主机权限 | permissions 中声明 | host_permissions 单独声明 |
| 内容安全策略 | 允许 unsafe-eval | 完全禁止 unsafe-eval |
| 网络请求 | XMLHttpRequest | fetch API |
| 远程代码 | 允许远程脚本 | 禁止远程脚本 |

---

## Action Popup 开发

### 🎨 基础 Popup 示例

**popup.html**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>我的扩展</h1>
    <div class="stats">
      <div class="stat-item">
        <span class="label">今日访问：</span>
        <span id="visitCount">0</span>
      </div>
    </div>
    <div class="actions">
      <button id="toggleFeature">切换功能</button>
      <button id="openOptions">设置</button>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

**popup.css**
```css
body {
  width: 350px;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  padding: 20px;
}

h1 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.stats {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #4285f4;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #3367d6;
}

button:active {
  background: #2851a3;
}
```

**popup.js**
```javascript
// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化数据
  await loadData();
  
  // 绑定事件监听器
  setupEventListeners();
});

async function loadData() {
  try {
    // 从 Chrome Storage 获取数据
    const result = await chrome.storage.local.get(['visitCount', 'featureEnabled']);
    
    // 更新 UI
    document.getElementById('visitCount').textContent = result.visitCount || 0;
    
    const toggleBtn = document.getElementById('toggleFeature');
    toggleBtn.textContent = result.featureEnabled ? '关闭功能' : '开启功能';
    toggleBtn.classList.toggle('enabled', result.featureEnabled);
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

function setupEventListeners() {
  // 切换功能按钮
  document.getElementById('toggleFeature').addEventListener('click', async () => {
    try {
      const result = await chrome.storage.local.get(['featureEnabled']);
      const newState = !result.featureEnabled;
      
      await chrome.storage.local.set({ featureEnabled: newState });
      
      // 通知 content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_FEATURE',
          enabled: newState
        });
      }
      
      // 更新 UI
      const toggleBtn = document.getElementById('toggleFeature');
      toggleBtn.textContent = newState ? '关闭功能' : '开启功能';
      
    } catch (error) {
      console.error('切换功能失败:', error);
    }
  });
  
  // 打开选项页面
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// 实时更新数据
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.visitCount) {
      document.getElementById('visitCount').textContent = changes.visitCount.newValue;
    }
  }
});
```

### 🎯 Popup 最佳实践

1. **尺寸控制**：宽度 300-400px，高度不超过 600px
2. **快速加载**：避免复杂计算，使用缓存数据
3. **响应式设计**：适配不同分辨率
4. **无障碍访问**：添加适当的 ARIA 标签

---

## Content Script 开发

### 🌐 Content Script 基础

Content Script 是注入到网页中的脚本，可以访问和修改页面 DOM，但与页面脚本隔离。

**基础配置**
```json
{
  "content_scripts": [
    {
      "matches": ["https://*.example.com/*"],
      "js": ["content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_end",
      "all_frames": false
    }
  ]
}
```

**content.js 示例**
```javascript
// 页面加载完成后执行
(function() {
  'use strict';
  
  console.log('Content Script 已加载');
  
  // 等待 DOM 准备就绪
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    // 创建功能入口
    createFeatureButton();
    
    // 监听来自扩展的消息
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // 页面特性检测
    detectPageFeatures();
  }
  
  function createFeatureButton() {
    const button = document.createElement('button');
    button.id = 'my-extension-btn';
    button.innerHTML = '🚀 扩展功能';
    button.className = 'my-extension-button';
    
    // 添加事件监听
    button.addEventListener('click', () => {
      toggleFeature();
    });
    
    // 插入到页面
    document.body.appendChild(button);
  }
  
  function toggleFeature() {
    const isActive = document.body.classList.contains('my-extension-active');
    
    if (isActive) {
      disableFeature();
    } else {
      enableFeature();
    }
  }
  
  function enableFeature() {
    document.body.classList.add('my-extension-active');
    
    // 修改页面样式
    const style = document.createElement('style');
    style.id = 'my-extension-style';
    style.textContent = `
      .my-extension-active {
        filter: sepia(20%);
      }
      .my-extension-button {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 10px 15px;
        background: #4285f4;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(style);
    
    // 通知后台脚本
    chrome.runtime.sendMessage({
      type: 'FEATURE_ENABLED',
      url: window.location.href
    });
  }
  
  function disableFeature() {
    document.body.classList.remove('my-extension-active');
    
    const style = document.getElementById('my-extension-style');
    if (style) {
      style.remove();
    }
    
    chrome.runtime.sendMessage({
      type: 'FEATURE_DISABLED',
      url: window.location.href
    });
  }
  
  function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'TOGGLE_FEATURE':
        if (message.enabled) {
          enableFeature();
        } else {
          disableFeature();
        }
        sendResponse({ success: true });
        break;
        
      case 'GET_PAGE_INFO':
        sendResponse({
          title: document.title,
          url: window.location.href,
          wordCount: document.body.textContent.length
        });
        break;
    }
  }
  
  function detectPageFeatures() {
    // 检测页面特性
    const features = {
      hasVideo: document.querySelectorAll('video').length > 0,
      hasForm: document.querySelectorAll('form').length > 0,
      wordCount: document.body.textContent.trim().split(/\s+/).length
    };
    
    // 发送到后台脚本
    chrome.runtime.sendMessage({
      type: 'PAGE_ANALYZED',
      features: features
    });
  }
  
})();
```

### 🔄 动态注入 Content Script

```javascript
// 在 popup.js 或 background.js 中
async function injectContentScript() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    // 注入脚本
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/dynamic-content.js']
    });
    
    // 注入样式
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content/dynamic-style.css']
    });
    
  } catch (error) {
    console.error('脚本注入失败:', error);
  }
}
```

---

## 权限系统详解

### 🔐 权限类型详解

#### 基础权限 (permissions)

```json
{
  "permissions": [
    "storage",          // 数据存储
    "activeTab",        // 当前激活标签页
    "tabs",             // 标签页信息 (敏感)
    "scripting",        // 脚本注入
    "alarms",           // 定时器
    "notifications",    // 通知
    "contextMenus",     // 右键菜单
    "cookies",          // Cookie 访问
    "history",          // 浏览历史
    "bookmarks",        // 书签
    "downloads",        // 下载管理
    "management",       // 扩展管理
    "webNavigation",    // 导航事件
    "webRequest",       // 网络请求拦截
    "identity"          // 身份验证
  ]
}
```

#### 主机权限 (host_permissions)

```json
{
  "host_permissions": [
    "https://api.example.com/*",    // 特定 API
    "https://*.google.com/*",       // 通配符域名
    "http://localhost/*",           // 本地开发
    "<all_urls>"                    // 所有网站 (慎用)
  ]
}
```

### 🎯 权限使用最佳实践

1. **最小权限原则**：只申请必需的权限
2. **渐进式权限**：使用 `optional_permissions` 在需要时申请
3. **用户说明**：清楚解释为什么需要某项权限

```json
{
  "permissions": ["storage"],
  "optional_permissions": ["tabs", "history"],
  "host_permissions": ["https://api.example.com/*"]
}
```

**动态权限申请**
```javascript
// 请求可选权限
async function requestPermissions() {
  const granted = await chrome.permissions.request({
    permissions: ['tabs'],
    origins: ['https://*.github.com/*']
  });
  
  if (granted) {
    console.log('权限已授予');
  } else {
    console.log('用户拒绝了权限请求');
  }
}

// 检查权限状态
async function checkPermissions() {
  const hasPermission = await chrome.permissions.contains({
    permissions: ['tabs']
  });
  
  return hasPermission;
}
```

---

## Chrome APIs 常用指南

### 📦 Storage API - 数据存储

```javascript
// 存储数据
await chrome.storage.local.set({
  userPreferences: {
    theme: 'dark',
    language: 'zh-CN'
  },
  statistics: {
    totalClicks: 42,
    lastUsed: Date.now()
  }
});

// 读取数据
const result = await chrome.storage.local.get(['userPreferences', 'statistics']);
console.log(result.userPreferences.theme); // 'dark'

// 监听存储变化
chrome.storage.onChanged.addListener((changes, area) => {
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`${key} 从 ${oldValue} 变为 ${newValue}`);
  }
});

// 清空存储
await chrome.storage.local.clear();
```

### 🗂️ Tabs API - 标签页管理

```javascript
// 获取当前激活标签页
const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

// 创建新标签页
const newTab = await chrome.tabs.create({
  url: 'https://example.com',
  active: true
});

// 更新标签页
await chrome.tabs.update(tabId, {
  url: 'https://new-url.com'
});

// 关闭标签页
await chrome.tabs.remove(tabId);

// 监听标签页变化
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`标签页加载完成: ${tab.url}`);
  }
});

// 获取所有标签页
const allTabs = await chrome.tabs.query({});
const githubTabs = await chrome.tabs.query({ url: '*://github.com/*' });
```

### 🔔 Notifications API - 系统通知

```javascript
// 创建基础通知
chrome.notifications.create('notification-id', {
  type: 'basic',
  iconUrl: 'icons/icon48.png',
  title: '扩展通知',
  message: '这是一条测试消息'
});

// 创建带按钮的通知
chrome.notifications.create('action-notification', {
  type: 'basic',
  iconUrl: 'icons/icon48.png',
  title: '需要操作',
  message: '发现新内容，是否立即查看？',
  buttons: [
    { title: '查看' },
    { title: '稍后' }
  ]
});

// 监听通知点击
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log(`通知被点击: ${notificationId}`);
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // 用户点击了"查看"
    chrome.tabs.create({ url: 'https://example.com' });
  }
});
```

### ⏰ Alarms API - 定时任务

```javascript
// 创建定时任务
chrome.alarms.create('daily-sync', {
  delayInMinutes: 1,      // 1分钟后开始
  periodInMinutes: 60     // 每小时重复
});

// 监听定时任务
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'daily-sync') {
    performDailySync();
  }
});

// 获取所有定时任务
const alarms = await chrome.alarms.getAll();

// 清除定时任务
chrome.alarms.clear('daily-sync');
```

### 🖱️ Context Menus API - 右键菜单

```javascript
// 创建右键菜单项
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'search-selection',
    title: '使用我的扩展搜索 "%s"',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'page-action',
    title: '分析此页面',
    contexts: ['page']
  });
});

// 监听菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'search-selection':
      const searchText = info.selectionText;
      chrome.tabs.create({
        url: `https://example.com/search?q=${encodeURIComponent(searchText)}`
      });
      break;
      
    case 'page-action':
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: analyzePage
      });
      break;
  }
});
```

### 🌐 WebRequest API - 网络拦截

```javascript
// 拦截请求 (需要 webRequest 权限)
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log('请求拦截:', details.url);
    
    // 阻止特定请求
    if (details.url.includes('bad-ads.com')) {
      return { cancel: true };
    }
    
    // 重定向请求
    if (details.url.includes('old-api.com')) {
      return {
        redirectUrl: details.url.replace('old-api.com', 'new-api.com')
      };
    }
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

// 修改请求头
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const headers = details.requestHeaders;
    headers.push({
      name: 'X-Custom-Header',
      value: 'MyExtensionValue'
    });
    
    return { requestHeaders: headers };
  },
  { urls: ['https://api.example.com/*'] },
  ['blocking', 'requestHeaders']
);
```

---

## 消息传递机制

### 📨 组件间通信

Chrome 扩展的不同组件运行在不同的上下文中，需要通过消息传递进行通信。

```
Background Script ←→ Content Script ←→ Popup
       ↕                    ↕               ↕
   Web Page           Injected Page      Options
```

### 🔄 基础消息传递

**从 Popup 发送到 Content Script**
```javascript
// popup.js
async function sendMessageToContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const response = await chrome.tabs.sendMessage(tab.id, {
    type: 'GET_PAGE_INFO',
    timestamp: Date.now()
  });
  
  console.log('收到响应:', response);
}

// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_INFO') {
    const pageInfo = {
      title: document.title,
      url: location.href,
      wordCount: document.body.textContent.length
    };
    
    sendResponse(pageInfo);
  }
  
  // 异步响应
  if (message.type === 'ASYNC_TASK') {
    performAsyncTask().then(result => {
      sendResponse(result);
    });
    
    return true; // 保持消息通道开放
  }
});
```

**从 Content Script 发送到 Background**
```javascript
// content.js
chrome.runtime.sendMessage({
  type: 'PAGE_VISITED',
  url: location.href,
  title: document.title
});

// background.js (Service Worker)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_VISITED') {
    // 更新访问统计
    updateVisitStats(message.url, sender.tab.id);
  }
});
```

### 🔀 高级消息模式

**消息中继模式**
```javascript
// background.js - 作为消息中继
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 转发消息到所有内容脚本
  if (message.type === 'BROADCAST') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // 忽略无法发送的标签页
        });
      });
    });
  }
});
```

**事件总线模式**
```javascript
// utils/eventBus.js
class ExtensionEventBus {
  constructor() {
    this.listeners = new Map();
    this.setupMessageListener();
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EVENT_BUS') {
        this.emit(message.event, message.data);
      }
    });
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
  
  send(event, data) {
    chrome.runtime.sendMessage({
      type: 'EVENT_BUS',
      event,
      data
    });
  }
}

// 使用示例
const eventBus = new ExtensionEventBus();
eventBus.on('user-action', (data) => {
  console.log('用户操作:', data);
});

eventBus.send('user-action', { action: 'click', element: 'button' });
```

---

## 数据存储方案

### 💾 Storage API 详解

Chrome 扩展提供了三种存储区域：

```javascript
// local - 本地存储 (推荐)
await chrome.storage.local.set({ key: 'value' });

// sync - 同步存储 (跨设备同步)
await chrome.storage.sync.set({ preferences: {...} });

// session - 会话存储 (浏览器会话期间)
await chrome.storage.session.set({ tempData: {...} });
```

### 🗄️ 高级存储模式

**存储管理器**
```javascript
// utils/storage.js
class StorageManager {
  constructor(area = 'local') {
    this.storage = chrome.storage[area];
  }
  
  async get(keys) {
    return await this.storage.get(keys);
  }
  
  async set(data) {
    return await this.storage.set(data);
  }
  
  async remove(keys) {
    return await this.storage.remove(keys);
  }
  
  async clear() {
    return await this.storage.clear();
  }
  
  // 获取存储使用情况
  async getUsage() {
    return await this.storage.getBytesInUse();
  }
  
  // 批量操作
  async batchSet(items) {
    const chunks = this.chunkArray(Object.entries(items), 100);
    for (const chunk of chunks) {
      await this.storage.set(Object.fromEntries(chunk));
    }
  }
  
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// 使用示例
const storage = new StorageManager('local');
await storage.set({ userConfig: { theme: 'dark' } });
```

**数据模型**
```javascript
// models/UserData.js
class UserData {
  constructor() {
    this.storage = new StorageManager('sync');
  }
  
  async getProfile() {
    const result = await this.storage.get('userProfile');
    return result.userProfile || this.getDefaultProfile();
  }
  
  async updateProfile(updates) {
    const profile = await this.getProfile();
    const newProfile = { ...profile, ...updates };
    await this.storage.set({ userProfile: newProfile });
    return newProfile;
  }
  
  getDefaultProfile() {
    return {
      name: '',
      email: '',
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        notifications: true
      },
      createdAt: Date.now()
    };
  }
}
```

---

## 调试与发布

### 🐛 开发调试技巧

**1. 开发者模式加载**
```bash
1. 打开 Chrome 扩展管理页面 (chrome://extensions/)
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择扩展根目录
```

**2. 调试不同组件**

| 组件 | 调试方法 |
|------|----------|
| **Popup** | 右键 Popup → 检查 |
| **Content Script** | F12 → Sources → Content Scripts |
| **Background** | 扩展管理页面 → 服务工作线程 → 检查 |
| **Options** | 右键选项页面 → 检查 |

**3. 错误监控**
```javascript
// background.js
chrome.runtime.onStartup.addListener(() => {
  console.log('扩展启动');
});

// 全局错误处理
self.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
});

// 未处理的 Promise 错误
self.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 错误:', event.reason);
});
```

### 📊 性能优化

**1. Service Worker 优化**
```javascript
// 懒加载模块
async function loadModule(moduleName) {
  if (!self.modules) {
    self.modules = {};
  }
  
  if (!self.modules[moduleName]) {
    self.modules[moduleName] = await import(`./modules/${moduleName}.js`);
  }
  
  return self.modules[moduleName];
}

// 防抖处理
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

**2. 内存管理**
```javascript
// 清理定时器
const timers = new Set();

function setManagedTimeout(callback, delay) {
  const timerId = setTimeout(() => {
    timers.delete(timerId);
    callback();
  }, delay);
  timers.add(timerId);
  return timerId;
}

// 清理所有定时器
function cleanupTimers() {
  timers.forEach(timerId => clearTimeout(timerId));
  timers.clear();
}
```

### 🚀 发布准备

**1. 打包检查清单**

- [ ] 移除所有 `console.log` 和调试代码
- [ ] 压缩图片资源
- [ ] 检查权限声明是否最小化
- [ ] 测试所有功能
- [ ] 更新版本号
- [ ] 准备截图和描述

**2. 自动化构建**
```json
// package.json
{
  "scripts": {
    "build": "node build.js",
    "zip": "zip -r extension.zip dist/",
    "lint": "eslint src/",
    "test": "jest"
  }
}
```

```javascript
// build.js
const fs = require('fs-extra');
const path = require('path');

async function build() {
  // 清理构建目录
  await fs.emptyDir('dist');
  
  // 复制源文件
  await fs.copy('src', 'dist');
  
  // 处理 manifest.json
  const manifest = await fs.readJson('src/manifest.json');
  manifest.version = process.env.VERSION || manifest.version;
  await fs.writeJson('dist/manifest.json', manifest, { spaces: 2 });
  
  // 压缩 JavaScript
  // ... 压缩逻辑
  
  console.log('构建完成!');
}

build().catch(console.error);
```

---

## 最佳实践与常见问题

### ✅ 开发最佳实践

**1. 代码组织**
```
src/
├── manifest.json
├── background/
│   ├── background.js
│   └── modules/
├── content/
│   ├── content.js
│   └── styles/
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── shared/
│   ├── utils.js
│   ├── constants.js
│   └── storage.js
└── assets/
    └── icons/
```

**2. 错误处理**
```javascript
// 统一错误处理
class ExtensionError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ExtensionError';
    this.code = code;
    this.details = details;
  }
}

async function safeExecute(operation, fallback = null) {
  try {
    return await operation();
  } catch (error) {
    console.error('操作失败:', error);
    
    // 记录错误
    chrome.storage.local.get('errorLog').then(result => {
      const errors = result.errorLog || [];
      errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
      chrome.storage.local.set({ errorLog: errors.slice(-100) }); // 保持最近100个错误
    });
    
    return fallback;
  }
}
```

**3. 性能监控**
```javascript
// 性能监控
class PerformanceMonitor {
  static measure(name, fn) {
    return async function(...args) {
      const start = performance.now();
      const result = await fn.apply(this, args);
      const end = performance.now();
      
      console.log(`${name} 执行时间: ${end - start} 毫秒`);
      return result;
    };
  }
  
  static async recordMetric(name, value) {
    const metrics = await chrome.storage.local.get('performanceMetrics');
    const current = metrics.performanceMetrics || {};
    
    if (!current[name]) {
      current[name] = [];
    }
    
    current[name].push({
      value,
      timestamp: Date.now()
    });
    
    // 保持最近50条记录
    current[name] = current[name].slice(-50);
    
    await chrome.storage.local.set({ performanceMetrics: current });
  }
}

// 使用示例
const optimizedFunction = PerformanceMonitor.measure('dataProcessing', processData);
```

### ❌ 常见问题解决

**1. 内联脚本 CSP 错误**
```
❌ 错误：Content Security Policy directive
✅ 解决：将内联脚本移动到外部文件
```

**2. 权限不足错误**
```javascript
// ❌ 错误写法
chrome.tabs.query({}, (tabs) => {
  // 没有声明 tabs 权限
});

// ✅ 正确写法
// manifest.json 中声明权限
{
  "permissions": ["activeTab"] // 或 "tabs"
}
```

**3. 消息传递失败**
```javascript
// ❌ 常见错误
chrome.tabs.sendMessage(tabId, message); // 可能失败

// ✅ 推荐写法
try {
  await chrome.tabs.sendMessage(tabId, message);
} catch (error) {
  if (error.message.includes('Receiving end does not exist')) {
    console.log('目标页面没有 content script');
  }
}
```

**4. Service Worker 超时**
```javascript
// ❌ 长时间运行的任务
setInterval(() => {
  // Service Worker 可能被终止
}, 1000);

// ✅ 使用 Alarms API
chrome.alarms.create('periodic-task', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodic-task') {
    // 执行任务
  }
});
```

### 🔍 调试技巧总结

1. **使用 Chrome DevTools**：每个组件都有对应的调试方式
2. **错误日志记录**：建立完善的错误记录机制
3. **性能监控**：监控关键操作的执行时间
4. **单元测试**：为核心功能编写测试用例
5. **渐进式开发**：从简单功能开始，逐步增加复杂度

---

## 🎉 总结

Chrome 扩展开发虽然有其特殊性，但掌握了核心概念和 API 使用后，就能快速开发出功能丰富的扩展。

**学习路径建议：**
1. 从简单的 Popup 扩展开始
2. 学习 Content Script 操作页面
3. 掌握消息传递和数据存储
4. 深入学习各种 Chrome APIs
5. 优化性能和用户体验

**开发资源：**
- [Chrome 扩展官方文档](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/migrating/)
- [Chrome 扩展示例](https://github.com/GoogleChrome/chrome-extensions-samples)

希望这份指南能帮助你快速上手 Chrome 扩展开发！如果你有任何问题，欢迎在项目中提交 Issue。

---

**本项目示例：**
- `pop-action/` - Action Popup 示例
- `content-script/` - Content Script 示例

祝你开发愉快！ 🚀