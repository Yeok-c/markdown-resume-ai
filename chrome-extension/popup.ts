interface JobDescription {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  url: string;
  extractedAt: string;
}

interface StorageData {
  apiEndpoint: string;
  extractedJD: JobDescription | null;
}

const POPUP_LOG_PREFIX = '[Resume AI Popup]';

console.log(`${POPUP_LOG_PREFIX} Popup initialized`);

const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement;
const sendToAIBtn = document.getElementById('send-to-ai-btn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const contentDiv = document.getElementById('extracted-content') as HTMLDivElement;

let extractedData: JobDescription | null = null;

// Show status message
function showStatus(message: string, type: 'success' | 'error' | 'info') {
  console.log(`${POPUP_LOG_PREFIX} Status:`, { message, type });
  statusDiv.textContent = message;
  statusDiv.className = type;
  statusDiv.style.display = 'block';
}

// Extract job description from current page
extractBtn.addEventListener('click', async () => {
  console.log(`${POPUP_LOG_PREFIX} Extract button clicked`);
  try {
    extractBtn.disabled = true;
    showStatus('Extracting job description...', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log(`${POPUP_LOG_PREFIX} Active tab:`, { id: tab.id, url: tab.url });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    console.log(`${POPUP_LOG_PREFIX} Executing content script...`);
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobDescription,
    });

    console.log(`${POPUP_LOG_PREFIX} Script execution results:`, results);

    if (results && results[0] && results[0].result) {
      extractedData = results[0].result as JobDescription;
      console.log(`${POPUP_LOG_PREFIX} Extracted data:`, extractedData);
      
      // Save to storage
      await chrome.storage.local.set({ extractedJD: extractedData });
      console.log(`${POPUP_LOG_PREFIX} Data saved to storage`);
      
      showStatus('Job description extracted successfully!', 'success');
      contentDiv.textContent = `Title: ${extractedData.title}\nCompany: ${extractedData.company}\n\n${extractedData.description.substring(0, 300)}...`;
      contentDiv.style.display = 'block';
      sendToAIBtn.disabled = false;
    } else {
      throw new Error('Failed to extract job description');
    }
  } catch (error) {
    console.error(`${POPUP_LOG_PREFIX} Extraction error:`, error);
    showStatus(`Error: ${(error as Error).message}`, 'error');
  } finally {
    extractBtn.disabled = false;
  }
});

// Send to Resume AI backend
sendToAIBtn.addEventListener('click', async () => {
  console.log(`${POPUP_LOG_PREFIX} Send to AI button clicked`);
  try {
    sendToAIBtn.disabled = true;
    showStatus('Sending to Resume AI...', 'info');

    if (!extractedData) {
      throw new Error('No job description data to send');
    }

    const storage = await chrome.storage.local.get('apiEndpoint');
    const endpoint = storage.apiEndpoint || 'http://localhost:3001/api/job-description';
    console.log(`${POPUP_LOG_PREFIX} API endpoint:`, endpoint);

    // Validate URL
    try {
      new URL(endpoint);
      console.log(`${POPUP_LOG_PREFIX} URL validation passed`);
    } catch {
      throw new Error('Invalid API endpoint URL. Please check settings.');
    }

    console.log(`${POPUP_LOG_PREFIX} Sending request to:`, endpoint);
    console.log(`${POPUP_LOG_PREFIX} Payload:`, extractedData);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extractedData),
    });

    console.log(`${POPUP_LOG_PREFIX} Response status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${POPUP_LOG_PREFIX} API error response:`, errorText);
      throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
    }

    const result = await response.json();
    console.log(`${POPUP_LOG_PREFIX} API response:`, result);
    showStatus('Successfully sent to Resume AI!', 'success');
    
    // Open the resume editor
    if (result.resumeUrl) {
      console.log(`${POPUP_LOG_PREFIX} Opening resume URL:`, result.resumeUrl);
      chrome.tabs.create({ url: result.resumeUrl });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${POPUP_LOG_PREFIX} Send to AI error:`, error);
    showStatus(`Error: ${errorMessage}`, 'error');
  } finally {
    sendToAIBtn.disabled = false;
  }
});

// Function that runs in the context of the page
function extractJobDescription(): JobDescription {
  const extractText = (selector: string): string => {
    const element = document.querySelector(selector);
    return element ? element.textContent?.trim() || '' : '';
  };

  const extractMultiple = (selectors: string[]): string => {
    for (const selector of selectors) {
      const text = extractText(selector);
      if (text) return text;
    }
    return '';
  };

  // Common selectors for job boards
  const titleSelectors = [
    'h1.job-title',
    'h1[class*="title"]',
    'h1[data-test*="title"]',
    '.job-title',
    'h1',
  ];

  const companySelectors = [
    '.company-name',
    '[class*="company"]',
    '[data-test*="company"]',
    'a[class*="employer"]',
  ];

  const locationSelectors = [
    '.job-location',
    '[class*="location"]',
    '[data-test*="location"]',
  ];

  const descriptionSelectors = [
    '.job-description',
    '#job-description',
    '[class*="description"]',
    '[class*="job-detail"]',
    'main',
  ];

  return {
    title: extractMultiple(titleSelectors),
    company: extractMultiple(companySelectors),
    location: extractMultiple(locationSelectors),
    description: extractMultiple(descriptionSelectors),
    requirements: extractMultiple(descriptionSelectors), // Can be refined
    url: window.location.href,
    extractedAt: new Date().toISOString(),
  };
}

// Load any previously extracted data
chrome.storage.local.get('extractedJD').then((data: { extractedJD?: JobDescription }) => {
  console.log(`${POPUP_LOG_PREFIX} Loading stored data:`, data);
  if (data.extractedJD) {
    extractedData = data.extractedJD;
    sendToAIBtn.disabled = false;
    contentDiv.textContent = `Previously extracted: ${extractedData.title}`;
    contentDiv.style.display = 'block';
    console.log(`${POPUP_LOG_PREFIX} Restored previous extraction`);
  } else {
    console.log(`${POPUP_LOG_PREFIX} No previous extraction found`);
  }
}).catch(error => {
  console.error(`${POPUP_LOG_PREFIX} Error loading stored data:`, error);
});
