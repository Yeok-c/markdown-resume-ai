# Resume AI - Debugging Guide

## Quick Diagnostic Checklist

Run through this checklist to identify where issues are occurring:

### ✅ 1. Chrome Extension Status
```
1. Go to chrome://extensions/
2. Find "Resume AI" extension
3. Check for errors (click "Errors" button if available)
4. Verify "Service worker" shows as "active"
```

**Common Issues:**
- ❌ Service worker "inactive" → Reload extension
- ❌ Red errors shown → Check console logs (see below)
- ❌ Extension not listed → Load unpacked from `chrome-extension/dist`

---

### ✅ 2. API Server Running
```bash
cd api-server
pnpm dev
```

**Expected Output:**
```
[API Server] Starting server...
[API Server] Environment: { hasDeepInfraKey: true, ... }
[API Server] ✅ Resume AI initialized successfully with DeepInfra (google/gemini-2.5-flash)
[API Server] Server listening on port 3001
```

**Common Issues:**
- ❌ "No API key found" → Check `.env` file has DEEPINFRA_API_KEY
- ❌ "Port 3001 already in use" → Kill existing process or change PORT in `.env`
- ❌ Module errors → Run `pnpm install` in root and `api-server` directories

**Quick Health Check:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

---

### ✅ 3. Build Status
```bash
# Build AI engine
cd packages/ai-engine
pnpm build

# Build Chrome extension
cd ../../chrome-extension
npm run build
```

**Expected:** No TypeScript errors, files created in `dist/` folders

---

## Detailed Logging

### Chrome Extension Logs

#### Background Service Worker Logs
```
1. Go to chrome://extensions/
2. Find Resume AI extension
3. Click "service worker" link
4. DevTools console opens showing background logs
```

**What to look for:**
```
[Resume AI Background] Service worker starting...
[Resume AI Background] Extension installed/updated
[Resume AI Background] Default API endpoint set
[Resume AI Background] Context menu created successfully
[Resume AI Background] Service worker initialization complete
```

#### Popup Logs
```
1. Click Resume AI extension icon
2. Right-click popup → Inspect
3. Check Console tab
```

**What to look for:**
```
[Resume AI Popup] Popup initialized
[Resume AI Popup] Extract button clicked
[Resume AI Popup] Active tab: {id: 123, url: "..."}
[Resume AI Popup] Extracted data: {...}
[Resume AI Popup] Sending request to: http://localhost:3001/api/job-description
[Resume AI Popup] Response status: 200
```

#### Content Script Logs  
```
1. Navigate to job posting (LinkedIn/Indeed/Glassdoor)
2. Open DevTools (F12) → Console tab
3. Look for Resume AI Content logs
```

**What to look for:**
```
[Resume AI Content] Content script loaded on: https://www.linkedin.com/...
[Resume AI Content] Detecting job board for: www.linkedin.com
[Resume AI Content] Detected job board: LinkedIn
[Resume AI Content] Adding visual indicator
[Resume AI Content] Indicator added and displayed
```

---

### API Server Logs

**Terminal where you ran `pnpm dev`:**

```
[API Server] Starting server...
[API Server] Environment: {
  hasDeepInfraKey: true,
  hasOpenAIKey: false,
  llmModel: 'google/gemini-2.5-flash',
  port: 3001,
  resourcesPath: '../resources'
}
[API Server] ✅ Resume AI initialized successfully with DeepInfra (google/gemini-2.5-flash)
[API Server] Server listening on port 3001

# When extension sends data:
[API Server] POST /api/job-description { timestamp: '...', ip: '::1', ... }
[API Server] Job description received from extension
[API Server] Job data: {
  hasTitle: true,
  hasCompany: true,
  hasDescription: true,
  descriptionLength: 1234
}
[API Server] Job saved with ID: 1729267200000
```

---

## Common Error Scenarios

### Error 1: "Cannot read properties of undefined (reading 'create')"
**Location:** Chrome extension background  
**Cause:** Missing `contextMenus` permission  
**Solution:**
```json
// In manifest.json, verify permissions include:
"permissions": ["activeTab", "storage", "scripting", "contextMenus"]
```
Then rebuild: `npm run build`

---

### Error 2: "Failed to fetch" or "ERR_CONNECTION_REFUSED"
**Location:** Chrome extension popup  
**Cause:** API server not running or wrong endpoint  
**Debug Steps:**
1. Check API server is running: `curl http://localhost:3001/health`
2. Check extension's API endpoint:
   ```javascript
   // In extension popup console:
   chrome.storage.local.get('apiEndpoint', console.log)
   ```
3. Verify it shows: `{apiEndpoint: "http://localhost:3001/api/job-description"}`

**Solution:**
- Start API server: `cd api-server && pnpm dev`
- Or update endpoint in extension options page

---

### Error 3: "No API key found"
**Location:** API server  
**Cause:** Missing environment variables  
**Solution:**
```bash
# Check .env file exists in api-server/
cat api-server/.env

# Should contain:
DEEPINFRA_API_KEY=your-key-here
LLM_MODEL=google/gemini-2.5-flash
PORT=3001
```

If missing, create the file or add the keys.

---

### Error 4: Content script not extracting data
**Location:** Job board page  
**Symptoms:** Blank title/company or "undefined"  
**Debug Steps:**

1. **Check if content script loaded:**
   ```javascript
   // In job board page console (F12):
   chrome.runtime.id
   // Should return extension ID, not undefined
   ```

2. **Check job board detection:**
   ```javascript
   // Look for this in console:
   [Resume AI Content] Detected job board: LinkedIn
   ```

3. **Inspect page structure:**
   ```javascript
   // Check if selectors exist:
   document.querySelector('.job-details-jobs-unified-top-card__job-title')
   // Should return element, not null
   ```

**Solution:**
- If job board not detected: Site might have changed structure
- Update selectors in `content.ts` → `jobBoardPatterns`
- Rebuild extension

---

### Error 5: LLM API errors
**Location:** API server  
**Symptoms:** "API error 401" or "Rate limit exceeded"  
**Debug Steps:**

1. **Test API key directly:**
   ```bash
   curl https://api.deepinfra.com/v1/openai/models \
     -H "Authorization: Bearer $DEEPINFRA_API_KEY"
   ```

2. **Check rate limits:**
   - DeepInfra: Check dashboard at https://deepinfra.com/dash
   - OpenAI: Check usage at https://platform.openai.com/usage

3. **Verify model availability:**
   ```bash
   # List available models:
   curl https://api.deepinfra.com/v1/openai/models \
     -H "Authorization: Bearer $DEEPINFRA_API_KEY" | jq '.data[].id'
   ```

**Solution:**
- Invalid key: Update `DEEPINFRA_API_KEY` in `.env`
- Rate limit: Wait or upgrade plan
- Model unavailable: Change `LLM_MODEL` in `.env` to supported model

---

## Step-by-Step Debugging Workflow

### Issue: Extension not working at all

1. **Verify installation:**
   ```
   chrome://extensions/ → Developer mode ON → Resume AI visible
   ```

2. **Check for build errors:**
   ```bash
   cd chrome-extension
   npm run build
   # Look for TypeScript errors
   ```

3. **Check service worker:**
   ```
   chrome://extensions/ → Resume AI → "service worker" link
   Console should show: [Resume AI Background] Service worker initialization complete
   ```

4. **Check manifest:**
   ```bash
   cat chrome-extension/dist/manifest.json
   # Verify "permissions" includes: "contextMenus", "scripting", "activeTab", "storage"
   ```

---

### Issue: Extraction works but API fails

1. **Check popup logs:**
   ```
   Click extension icon → Right-click popup → Inspect
   Look for: [Resume AI Popup] Sending request to: ...
   ```

2. **Check API endpoint:**
   ```javascript
   // In popup console:
   chrome.storage.local.get('apiEndpoint', console.log)
   ```

3. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3001/api/job-description \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","company":"Test Co","description":"Test job"}'
   ```

4. **Check API server logs:**
   ```
   Terminal where you ran pnpm dev
   Look for: [API Server] POST /api/job-description
   ```

---

### Issue: API receives data but doesn't generate resume

1. **Check AI engine initialization:**
   ```
   API server logs should show:
   [API Server] ✅ Resume AI initialized successfully with DeepInfra (...)
   ```

2. **Test LLM connection:**
   ```bash
   curl -X POST http://localhost:3001/api/generate \
     -H "Content-Type: application/json" \
     -d '{
       "jobDescription": {"title":"Engineer","company":"Test","description":"Build things","requirements":"5 years"},
       "userProfile": {"name":"Test","experience":[]},
       "options": {}
     }'
   ```

3. **Check DeepInfra/OpenAI logs:**
   - Look for API errors in terminal
   - Check for 401 (auth), 429 (rate limit), 500 (server error)

---

## Testing Components Individually

### Test 1: Chrome Extension Extraction Only

**Goal:** Verify extension can extract data from job pages

1. Navigate to LinkedIn job posting
2. Open DevTools console (F12)
3. Click extension icon
4. Click "Extract Job Description"
5. **Expected logs:**
   ```
   [Resume AI Popup] Extract button clicked
   [Resume AI Popup] Executing content script...
   [Resume AI Popup] Extracted data: {title: "...", company: "..."}
   [Resume AI Popup] Data saved to storage
   ```

6. Verify data in storage:
   ```javascript
   chrome.storage.local.get('extractedJD', console.log)
   ```

**Pass criteria:** extractedJD object has title, company, and description fields filled

---

### Test 2: API Server Health Only

**Goal:** Verify API server starts and responds

1. Start server: `cd api-server && pnpm dev`
2. **Expected output:**
   ```
   [API Server] ✅ Resume AI initialized successfully
   [API Server] Server listening on port 3001
   ```

3. Test health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```
   **Expected:** `{"status":"ok",...}`

4. Test job-description endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/job-description \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","description":"Test description"}'
   ```
   **Expected:** `{"success":true,"jobId":"..."}`

**Pass criteria:** Both endpoints return 200 status and valid JSON

---

### Test 3: End-to-End Flow

**Goal:** Full workflow from extraction to API

1. Start API server: `cd api-server && pnpm dev`
2. Load extension in Chrome
3. Navigate to job posting (e.g., https://www.linkedin.com/jobs/...)
4. Open extension popup
5. Click "Extract Job Description"
6. Click "Send to AI"
7. **Check popup logs:** Should show API request and 200 response
8. **Check API logs:** Should show POST request received

**Pass criteria:** 
- Popup shows "Successfully sent to Resume AI!"
- API logs show job data received
- No errors in any console

---

## Log Interpretation Guide

### Good Logs (Everything Working)

```
# Extension Background
[Resume AI Background] Service worker starting...
[Resume AI Background] Extension installed/updated
[Resume AI Background] Context menu created successfully
[Resume AI Background] Service worker initialization complete

# Extension Content Script (on job page)
[Resume AI Content] Content script loaded on: https://www.linkedin.com/jobs/view/123
[Resume AI Content] Detected job board: LinkedIn
[Resume AI Content] Indicator added and displayed

# Extension Popup (when extracting)
[Resume AI Popup] Extract button clicked
[Resume AI Popup] Active tab: {id: 456, url: "https://www.linkedin.com/jobs/view/123"}
[Resume AI Popup] Executing content script...
[Resume AI Popup] Extracted data: {title: "Senior Engineer", company: "Google", ...}
[Resume AI Popup] Data saved to storage

# Extension Popup (when sending to API)
[Resume AI Popup] Send to AI button clicked
[Resume AI Popup] API endpoint: http://localhost:3001/api/job-description
[Resume AI Popup] URL validation passed
[Resume AI Popup] Response status: 200
[Resume AI Popup] API response: {success: true, jobId: "..."}

# API Server
[API Server] Starting server...
[API Server] ✅ Resume AI initialized successfully with DeepInfra (google/gemini-2.5-flash)
[API Server] Server listening on port 3001
[API Server] POST /api/job-description {timestamp: "...", ip: "::1"}
[API Server] Job description received from extension
[API Server] Job data: {hasTitle: true, hasCompany: true, hasDescription: true, descriptionLength: 1234}
[API Server] Job saved with ID: 1729267200000
```

---

### Bad Logs (Errors)

```
# Missing permission error
[Resume AI Background] Context menu creation error: {message: "Cannot create item with duplicate id extract-jd"}
❌ Fix: Remove duplicate context menu creation or change ID

# Content script not detecting job board
[Resume AI Content] Content script loaded on: https://example.com
[Resume AI Content] Detecting job board for: example.com
[Resume AI Content] No matching job board pattern found
❌ Fix: Not on supported job board (LinkedIn/Indeed/Glassdoor)

# API connection failed
[Resume AI Popup] Send to AI button clicked
[Resume AI Popup] Error: Failed to fetch
❌ Fix: API server not running or wrong endpoint

# API key missing
[API Server] Starting server...
[API Server] No API key found!
Error: DEEPINFRA_API_KEY or OPENAI_API_KEY must be set
❌ Fix: Add API key to api-server/.env file

# Invalid API response
[Resume AI Popup] Response status: 500
[Resume AI Popup] API error response: Internal Server Error
❌ Fix: Check API server logs for detailed error
```

---

## Environment Validation

### Checklist Before Starting

**1. Node.js & pnpm:**
```bash
node --version  # Should be >= 18
pnpm --version  # Should be >= 8
```

**2. Dependencies installed:**
```bash
# Root
pnpm install

# AI Engine
cd packages/ai-engine && pnpm install && pnpm build

# API Server
cd ../../api-server && pnpm install

# Chrome Extension
cd ../chrome-extension && npm install && npm run build
```

**3. Environment variables:**
```bash
# Check api-server/.env exists and has:
cat api-server/.env

# Required:
DEEPINFRA_API_KEY=xxx  # or OPENAI_API_KEY=xxx
LLM_MODEL=google/gemini-2.5-flash
PORT=3001
RESOURCES_PATH=../resources
```

**4. Resources exist:**
```bash
ls resources/templates/  # Should show *.json files
ls resources/prompts/    # Should show *.txt files
ls resources/requirements/  # Should show *.json files
```

**5. Chrome extension built:**
```bash
ls chrome-extension/dist/  # Should show manifest.json, *.js files, *.html files
```

---

## Getting More Help

### When reporting issues, include:

1. **Component:** Which part is failing? (Extension, API, AI Engine)

2. **Error message:** Full error text from console

3. **Logs:** Relevant log output (see sections above)

4. **Steps to reproduce:**
   ```
   1. Started API server
   2. Loaded extension
   3. Clicked extract on LinkedIn job
   4. Error appeared: "..."
   ```

5. **Environment:**
   ```
   OS: Windows 11
   Node: v20.10.0
   Chrome: 118.0.5993.117
   ```

6. **Screenshots:** Extension errors page, console output

### Quick Diagnostic Command

Run this to collect all relevant info:

```bash
# Save to file
{
  echo "=== Node/pnpm versions ==="
  node --version
  pnpm --version
  
  echo -e "\n=== API Server .env ==="
  cat api-server/.env 2>&1 || echo "File not found"
  
  echo -e "\n=== Extension build status ==="
  ls -la chrome-extension/dist/ 2>&1 || echo "Not built"
  
  echo -e "\n=== Resources ==="
  ls resources/*/ 2>&1 || echo "Not found"
  
  echo -e "\n=== API Server health ==="
  curl -s http://localhost:3001/health 2>&1 || echo "Not running"
  
} > diagnostic-report.txt

cat diagnostic-report.txt
```

Share this `diagnostic-report.txt` file when asking for help!

---

## Next Steps

1. ✅ Read **ARCHITECTURE.md** to understand system design
2. ✅ Follow this guide to identify where your issue is
3. ✅ Check logs for each component
4. ✅ Run individual component tests
5. ✅ Report issues with diagnostic info

**Happy debugging!** 🐛🔍
