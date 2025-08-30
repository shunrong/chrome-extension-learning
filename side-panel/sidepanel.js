// 侧边栏主要功能
class SidePanel {
  constructor() {
    this.currentTab = 'dashboard';
    this.init();
  }

  async init() {
    this.setupTabNavigation();
    this.setupEventListeners();
    this.loadSettings();
    await this.updateDashboard();
    this.setupToolActions();
  }

  // 标签导航设置
  setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // 更新按钮状态
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 更新内容显示
        tabContents.forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(targetTab).classList.add('active');
        
        this.currentTab = targetTab;
        
        // 根据标签加载相应内容
        if (targetTab === 'tools') {
          this.updateTabManager();
        }
      });
    });
  }

  // 事件监听器设置
  setupEventListeners() {
    // 固定按钮
    document.getElementById('pinBtn').addEventListener('click', () => {
      this.togglePin();
    });

    // 设置项监听
    document.getElementById('darkMode').addEventListener('change', (e) => {
      this.toggleDarkMode(e.target.checked);
    });

    document.getElementById('autoPin').addEventListener('change', (e) => {
      this.saveSetting('autoPin', e.target.checked);
    });

    // 其他设置
    document.getElementById('shortcuts').addEventListener('change', (e) => {
      this.saveSetting('shortcuts', e.target.checked);
    });

    document.getElementById('notifications').addEventListener('change', (e) => {
      this.saveSetting('notifications', e.target.checked);
    });

    // 数据管理
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearData();
    });

    // 搜索功能
    document.getElementById('goBtn').addEventListener('click', () => {
      this.handleSearch();
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });
  }

  // 更新仪表板数据
  async updateDashboard() {
    try {
      // 获取访问计数
      const storage = await chrome.storage.local.get(['visitCount', 'dailyVisits']);
      const visitCount = storage.visitCount || 0;
      document.getElementById('visitCount').textContent = visitCount;

      // 获取标签页数量
      const tabs = await chrome.tabs.query({});
      document.getElementById('tabCount').textContent = tabs.length;

      // 获取书签数量
      if (chrome.bookmarks) {
        const bookmarks = await chrome.bookmarks.getTree();
        const bookmarkCount = this.countBookmarks(bookmarks);
        document.getElementById('bookmarkCount').textContent = bookmarkCount;
      }

      // 更新活动列表
      this.updateActivityList();

    } catch (error) {
      console.error('更新仪表板失败:', error);
    }
  }

  // 计算书签数量
  countBookmarks(nodes) {
    let count = 0;
    for (const node of nodes) {
      if (node.url) {
        count++;
      }
      if (node.children) {
        count += this.countBookmarks(node.children);
      }
    }
    return count;
  }

  // 更新活动列表
  async updateActivityList() {
    const activityList = document.getElementById('activityList');
    
    try {
      const storage = await chrome.storage.local.get(['recentActivity']);
      const activities = storage.recentActivity || [];
      
      activityList.innerHTML = '';
      
      if (activities.length === 0) {
        activityList.innerHTML = '<li class="activity-item">暂无最近活动</li>';
        return;
      }

      activities.slice(0, 5).forEach(activity => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.innerHTML = `
          ${activity.action}
          <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
        `;
        activityList.appendChild(li);
      });

    } catch (error) {
      console.error('更新活动列表失败:', error);
    }
  }

  // 设置工具操作
  setupToolActions() {
    // 截图功能
    document.getElementById('screenshotBtn').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.captureVisibleTab(tab.windowId);
        this.showNotification('截图已保存到下载文件夹');
      } catch (error) {
        console.error('截图失败:', error);
      }
    });

    // 书签功能
    document.getElementById('bookmarkBtn').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.bookmarks.create({
          title: tab.title,
          url: tab.url
        });
        this.showNotification('页面已添加到书签');
        this.updateDashboard(); // 更新书签计数
      } catch (error) {
        console.error('添加书签失败:', error);
      }
    });

    // 翻译功能
    document.getElementById('translateBtn').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const translateUrl = `https://translate.google.com/translate?sl=auto&tl=zh&u=${encodeURIComponent(tab.url)}`;
        await chrome.tabs.create({ url: translateUrl });
      } catch (error) {
        console.error('翻译失败:', error);
      }
    });

    // 阅读模式
    document.getElementById('readModeBtn').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: this.toggleReadMode
        });
      } catch (error) {
        console.error('切换阅读模式失败:', error);
      }
    });
  }

  // 阅读模式切换函数
  toggleReadMode() {
    const body = document.body;
    if (body.classList.contains('reading-mode')) {
      body.classList.remove('reading-mode');
      // 移除阅读模式样式
      const readingStyle = document.getElementById('reading-mode-style');
      if (readingStyle) {
        readingStyle.remove();
      }
    } else {
      body.classList.add('reading-mode');
      // 添加阅读模式样式
      const style = document.createElement('style');
      style.id = 'reading-mode-style';
      style.textContent = `
        .reading-mode * {
          max-width: 800px !important;
          margin: 0 auto !important;
          font-family: serif !important;
          line-height: 1.6 !important;
        }
        .reading-mode {
          background: #f9f9f9 !important;
          padding: 40px 20px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 更新标签管理器
  async updateTabManager() {
    const tabManager = document.getElementById('tabManager');
    
    try {
      const tabs = await chrome.tabs.query({});
      tabManager.innerHTML = '';
      
      tabs.forEach(tab => {
        const tabItem = document.createElement('div');
        tabItem.className = 'tab-item';
        tabItem.innerHTML = `
          <img src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%23666" d="M8 1L4 5h8L8 1z"/></svg>'}" 
               class="tab-favicon" alt="">
          <span class="tab-title" title="${tab.title}">${tab.title}</span>
          <button class="close-tab" data-tab-id="${tab.id}">×</button>
        `;
        
        // 点击切换到标签页
        tabItem.addEventListener('click', (e) => {
          if (!e.target.classList.contains('close-tab')) {
            chrome.tabs.update(tab.id, { active: true });
            chrome.windows.update(tab.windowId, { focused: true });
          }
        });
        
        // 关闭标签页
        const closeBtn = tabItem.querySelector('.close-tab');
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.tabs.remove(tab.id);
          tabItem.remove();
        });
        
        tabManager.appendChild(tabItem);
      });

    } catch (error) {
      console.error('更新标签管理器失败:', error);
    }
  }

  // 搜索处理
  async handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    try {
      // 判断是否为 URL
      const isUrl = /^https?:\/\/|^www\.|\./.test(query);
      const url = isUrl 
        ? (query.startsWith('http') ? query : `https://${query}`)
        : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      
      await chrome.tabs.create({ url });
      document.getElementById('searchInput').value = '';
      
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }

  // 固定侧边栏
  async togglePin() {
    try {
      const isPinned = await chrome.sidePanel.getOptions({});
      await chrome.sidePanel.setOptions({
        enabled: !isPinned.enabled
      });
      
      const pinBtn = document.getElementById('pinBtn');
      pinBtn.textContent = isPinned.enabled ? '📌' : '📍';
      pinBtn.title = isPinned.enabled ? '取消固定' : '固定侧边栏';
      
    } catch (error) {
      console.error('切换固定状态失败:', error);
    }
  }

  // 深色主题切换
  toggleDarkMode(enabled) {
    document.body.classList.toggle('dark-theme', enabled);
    this.saveSetting('darkMode', enabled);
  }

  // 保存设置
  async saveSetting(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  // 加载设置
  async loadSettings() {
    try {
      const settings = await chrome.storage.local.get([
        'darkMode', 'autoPin', 'shortcuts', 'notifications'
      ]);
      
      // 应用设置
      if (settings.darkMode) {
        document.getElementById('darkMode').checked = true;
        this.toggleDarkMode(true);
      }
      
      if (settings.autoPin) {
        document.getElementById('autoPin').checked = true;
      }
      
      if (settings.shortcuts) {
        document.getElementById('shortcuts').checked = true;
      }
      
      if (settings.notifications) {
        document.getElementById('notifications').checked = true;
      }
      
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  // 导出数据
  async exportData() {
    try {
      const data = await chrome.storage.local.get();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extension-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showNotification('数据导出成功');
      
    } catch (error) {
      console.error('导出数据失败:', error);
    }
  }

  // 清除数据
  async clearData() {
    if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
      try {
        await chrome.storage.local.clear();
        this.showNotification('数据已清除');
        location.reload(); // 重新加载侧边栏
      } catch (error) {
        console.error('清除数据失败:', error);
      }
    }
  }

  // 显示通知
  showNotification(message) {
    // 创建简单的通知
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 格式化时间
  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  }
}

// 初始化侧边栏
document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});

// 监听标签页变化
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // 可以在这里更新标签管理器
    const sidePanel = window.sidePanel;
    if (sidePanel && sidePanel.currentTab === 'tools') {
      sidePanel.updateTabManager();
    }
  }
});