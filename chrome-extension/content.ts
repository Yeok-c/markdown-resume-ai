// Content script that runs on all pages
// Can be used to enhance extraction based on specific job board patterns

const CONTENT_LOG_PREFIX = '[Resume AI Content]';

console.log(`${CONTENT_LOG_PREFIX} Content script loaded on:`, window.location.href);

interface JobBoardPattern {
  name: string;
  domains: string[];
  selectors: {
    title: string;
    company: string;
    location: string;
    description: string;
    requirements: string;
  };
}

const jobBoardPatterns: JobBoardPattern[] = [
  {
    name: 'LinkedIn',
    domains: ['linkedin.com'],
    selectors: {
      title: '.job-details-jobs-unified-top-card__job-title',
      company: '.job-details-jobs-unified-top-card__company-name',
      location: '.job-details-jobs-unified-top-card__bullet',
      description: '.jobs-description-content__text',
      requirements: '.jobs-description-content__text',
    },
  },
  {
    name: 'Indeed',
    domains: ['indeed.com'],
    selectors: {
      title: '.jobsearch-JobInfoHeader-title',
      company: '[data-company-name]',
      location: '.jobsearch-JobInfoHeader-subtitle div',
      description: '#jobDescriptionText',
      requirements: '#jobDescriptionText',
    },
  },
  {
    name: 'Glassdoor',
    domains: ['glassdoor.com'],
    selectors: {
      title: '[data-test="job-title"]',
      company: '[data-test="employer-name"]',
      location: '[data-test="location"]',
      description: '.desc',
      requirements: '.desc',
    },
  },
];

// Detect which job board we're on
function detectJobBoard(): JobBoardPattern | null {
  const hostname = window.location.hostname;
  console.log(`${CONTENT_LOG_PREFIX} Detecting job board for:`, hostname);
  
  for (const pattern of jobBoardPatterns) {
    if (pattern.domains.some(domain => hostname.includes(domain))) {
      console.log(`${CONTENT_LOG_PREFIX} Detected job board:`, pattern.name);
      return pattern;
    }
  }
  
  console.log(`${CONTENT_LOG_PREFIX} No matching job board pattern found`);
  return null;
}

// Enhanced extraction using job board-specific patterns
function extractWithPattern(pattern: JobBoardPattern) {
  console.log(`${CONTENT_LOG_PREFIX} Extracting with pattern:`, pattern.name);

  const extract = (selector: string): string => {
    const element = document.querySelector(selector);
    const text = element ? element.textContent?.trim() || '' : '';
    if (text) {
      console.log(`${CONTENT_LOG_PREFIX} Extracted from ${selector}:`, text.substring(0, 50) + '...');
    } else {
      console.log(`${CONTENT_LOG_PREFIX} No content found for selector:`, selector);
    }
    return text;
  };

  const data = {
    title: extract(pattern.selectors.title),
    company: extract(pattern.selectors.company),
    location: extract(pattern.selectors.location),
    description: extract(pattern.selectors.description),
    requirements: extract(pattern.selectors.requirements),
    url: window.location.href,
    extractedAt: new Date().toISOString(),
    source: pattern.name,
  };

  console.log(`${CONTENT_LOG_PREFIX} Extraction complete:`, {
    title: data.title,
    company: data.company,
    descriptionLength: data.description.length
  });

  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`${CONTENT_LOG_PREFIX} Message received:`, request.action);
  
  try {
    if (request.action === 'getJobBoard') {
      const pattern = detectJobBoard();
      const response = { pattern: pattern?.name || 'generic' };
      console.log(`${CONTENT_LOG_PREFIX} Responding with job board:`, response);
      sendResponse(response);
      return true;
    }
    
    if (request.action === 'extractEnhanced') {
      const pattern = detectJobBoard();
      if (pattern) {
        const data = extractWithPattern(pattern);
        console.log(`${CONTENT_LOG_PREFIX} Sending extracted data`);
        sendResponse({ success: true, data });
      } else {
        console.log(`${CONTENT_LOG_PREFIX} Unknown job board, extraction failed`);
        sendResponse({ success: false, error: 'Unknown job board' });
      }
      return true;
    }

    if (request.action === 'extractFromContextMenu') {
      console.log(`${CONTENT_LOG_PREFIX} Context menu extraction triggered`);
      const pattern = detectJobBoard();
      if (pattern) {
        const data = extractWithPattern(pattern);
        chrome.storage.local.set({ extractedJD: data });
        console.log(`${CONTENT_LOG_PREFIX} Job description saved to storage`);
      } else {
        console.log(`${CONTENT_LOG_PREFIX} No pattern found for context menu extraction`);
      }
      return true;
    }
  } catch (error) {
    console.error(`${CONTENT_LOG_PREFIX} Message handling error:`, error);
    sendResponse({ success: false, error: (error as Error).message });
  }
  
  return true;
});

// Add visual indicator when extension is active
function addIndicator() {
  console.log(`${CONTENT_LOG_PREFIX} Adding visual indicator`);
  
  // Don't add if already exists
  if (document.getElementById('resume-ai-indicator')) {
    console.log(`${CONTENT_LOG_PREFIX} Indicator already exists`);
    return;
  }

  const indicator = document.createElement('div');
  indicator.id = 'resume-ai-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #0066cc;
    color: white;
    padding: 10px 15px;
    border-radius: 20px;
    font-family: sans-serif;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    cursor: pointer;
    display: none;
  `;
  indicator.textContent = '📄 Resume AI Ready';

  indicator.addEventListener('click', () => {
    console.log(`${CONTENT_LOG_PREFIX} Indicator clicked`);
    try {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    } catch (error) {
      console.error(`${CONTENT_LOG_PREFIX} Failed to open popup:`, error);
    }
  });

  const jobBoard = detectJobBoard();
  if (jobBoard && document.body) {
    document.body.appendChild(indicator);
    indicator.style.display = 'block';
    console.log(`${CONTENT_LOG_PREFIX} Indicator added and displayed`);
    
    setTimeout(() => {
      indicator.style.display = 'none';
      console.log(`${CONTENT_LOG_PREFIX} Indicator hidden after 3 seconds`);
    }, 3000);
  } else {
    console.log(`${CONTENT_LOG_PREFIX} Not on a supported job board or body not ready`);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  console.log(`${CONTENT_LOG_PREFIX} DOM still loading, waiting...`);
  document.addEventListener('DOMContentLoaded', addIndicator);
} else {
  console.log(`${CONTENT_LOG_PREFIX} DOM ready, adding indicator`);
  addIndicator();
}
