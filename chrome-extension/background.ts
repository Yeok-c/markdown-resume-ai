// Background service worker for the Chrome extension

const BG_LOG_PREFIX = '[Resume AI Background]';

console.log(`${BG_LOG_PREFIX} Service worker starting...`);

chrome.runtime.onInstalled.addListener(() => {
  console.log(`${BG_LOG_PREFIX} Extension installed/updated`);
  
  // Set default API endpoint
  chrome.storage.local.set({
    apiEndpoint: 'http://localhost:3001/api/job-description'
  }, () => {
    console.log(`${BG_LOG_PREFIX} Default API endpoint set`);
  });

  // Create context menu for quick extraction
  chrome.contextMenus.create({
    id: 'extract-jd',
    title: 'Extract Job Description with Resume AI',
    contexts: ['page'],
  }, () => {
    if (chrome.runtime.lastError) {
      console.error(`${BG_LOG_PREFIX} Context menu creation error:`, chrome.runtime.lastError);
    } else {
      console.log(`${BG_LOG_PREFIX} Context menu created successfully`);
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`${BG_LOG_PREFIX} Message received:`, {
    action: request.action,
    sender: sender.tab?.url,
    timestamp: new Date().toISOString()
  });

  if (request.action === 'extractJobDescription') {
    console.log(`${BG_LOG_PREFIX} Job description extraction requested`, request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'openPopup') {
    console.log(`${BG_LOG_PREFIX} Popup open requested`);
    chrome.action.openPopup().catch(error => {
      console.error(`${BG_LOG_PREFIX} Failed to open popup:`, error);
    });
  }
  
  return true; // Keep the message channel open for async response
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log(`${BG_LOG_PREFIX} Context menu clicked:`, {
    menuItemId: info.menuItemId,
    tabId: tab?.id,
    url: tab?.url
  });

  if (info.menuItemId === 'extract-jd' && tab?.id) {
    console.log(`${BG_LOG_PREFIX} Sending extract message to tab ${tab.id}`);
    // Send message to content script to extract job description
    chrome.tabs.sendMessage(tab.id, { action: 'extractFromContextMenu' })
      .then(() => {
        console.log(`${BG_LOG_PREFIX} Extract message sent successfully`);
      })
      .catch(error => {
        console.error(`${BG_LOG_PREFIX} Failed to send extract message:`, error);
      });
  }
});

console.log(`${BG_LOG_PREFIX} Service worker initialization complete`);
