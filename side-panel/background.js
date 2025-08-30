// background.js
chrome.runtime.onInstalled.addListener(() => {
  // 默认启用侧边栏
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true
  });
});

// 扩展图标点击时打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 为特定标签页设置不同的侧边栏
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('github.com')) {
      chrome.sidePanel.setOptions({
        tabId,
        path: 'github-sidepanel.html',
        enabled: true
      });
    }
  }
});