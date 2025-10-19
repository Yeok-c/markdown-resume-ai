const apiEndpointInput = document.getElementById('api-endpoint') as HTMLInputElement;
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const saveStatus = document.getElementById('save-status') as HTMLDivElement;

// Load saved settings
chrome.storage.local.get(['apiEndpoint', 'apiKey'], (result) => {
  if (result.apiEndpoint) {
    apiEndpointInput.value = result.apiEndpoint;
  }
  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }
});

// Save settings
saveBtn.addEventListener('click', () => {
  const apiEndpoint = apiEndpointInput.value || 'http://localhost:3001/api/job-description';
  const apiKey = apiKeyInput.value || '';
  
  chrome.storage.local.set({ apiEndpoint, apiKey }, () => {
    saveStatus.textContent = 'Settings saved successfully!';
    saveStatus.className = 'success';
    saveStatus.style.display = 'block';
    
    setTimeout(() => {
      saveStatus.style.display = 'none';
    }, 3000);
  });
});
