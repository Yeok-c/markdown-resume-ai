# Resume AI - System Architecture

## Overview
This is an AI-powered resume generation system that extracts job descriptions from job boards and generates optimized resumes using LLMs (via DeepInfra/OpenAI).

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User browses job posting (LinkedIn/Indeed/Glassdoor)         │
│  2. Clicks Chrome Extension icon or right-click context menu     │
│  3. Extension extracts job description from page                 │
│  4. User clicks "Send to AI" button                              │
│  5. Extension sends data to API Server (localhost:3001)          │
│  6. API Server processes with AI Engine                          │
│  7. Returns generated resume                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Chrome Extension (`/chrome-extension`)

**Purpose:** Extract job descriptions from job board websites

**Files:**
- `manifest.json` - Extension configuration (permissions, scripts)
- `background.ts` - Service worker (lifecycle, context menus)
- `content.ts` - Runs on job sites (DOM extraction)
- `popup.ts` - UI for extraction and API communication
- `popup.html` - Extension popup interface
- `options.ts` / `options.html` - Settings page

**Data Flow:**
```
Job Site DOM → content.ts → popup.ts → chrome.storage → API Server
```

**Key Features:**
- Detects job board (LinkedIn, Indeed, Glassdoor)
- Board-specific CSS selectors for accurate extraction
- Visual indicator when on supported job board
- Context menu integration (right-click)
- Local storage for extracted data

**Error Points:**
- ❌ Missing permissions in manifest.json
- ❌ Content script not injected on page
- ❌ Invalid API endpoint URL
- ❌ Network errors when sending to API
- ❌ Service worker registration failure

---

### 2. API Server (`/api-server`)

**Purpose:** REST API that orchestrates AI resume generation

**Files:**
- `src/index.ts` - Express server with 9 endpoints
- `.env` - Configuration (API keys, model, port)

**Endpoints:**
```
POST /api/generate              - Full resume generation
POST /api/optimize              - Optimize existing resume
POST /api/validate              - Validate resume against JD
POST /api/extract-job-info      - Extract structured job info
POST /api/format-check          - Check formatting
GET  /api/templates             - List available templates
GET  /api/requirements          - List requirement sets
POST /api/job-description       - Save job description
GET  /health                    - Health check
```

**Configuration:**
```env
DEEPINFRA_API_KEY=<your-key>    # DeepInfra API key
LLM_MODEL=google/gemini-2.5-flash
PORT=3001
RESOURCES_PATH=../resources
```

**Data Flow:**
```
HTTP Request → Express Middleware → ResumeAI Pipeline → LLM → Response
```

**Error Points:**
- ❌ Missing API key (DEEPINFRA_API_KEY or OPENAI_API_KEY)
- ❌ Invalid model name
- ❌ Resources path not found
- ❌ LLM API errors (rate limits, invalid responses)
- ❌ Port already in use

---

### 3. AI Engine (`/packages/ai-engine`)

**Purpose:** Core AI logic for resume generation

**Files:**
- `src/index.ts` - Main exports and factory function
- `src/llm-service.ts` - LLM API wrapper (OpenAI-compatible)
- `src/resource-loader.ts` - Load templates/prompts/requirements
- `src/pipeline.ts` - Resume generation pipeline
- `src/formatting-verifier.ts` - Validate resume formatting

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                      ResumeAI Pipeline                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Input: Job Description + Base Resume                        │
│    ↓                                                          │
│  1. Load Resources (templates, requirements, prompts)        │
│    ↓                                                          │
│  2. Extract Job Info (LLM: parse JD structure)               │
│    ↓                                                          │
│  3. Generate Initial Resume (LLM: apply template)            │
│    ↓                                                          │
│  4. Optimize Loop (max 3 iterations):                        │
│     - Format Check (12+ rules)                               │
│     - Content Validation                                     │
│     - LLM Optimization                                       │
│    ↓                                                          │
│  5. Final Verification                                       │
│    ↓                                                          │
│  Output: Optimized Resume (markdown)                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**LLM Service:**
```typescript
// OpenAI-compatible API client
new OpenAI({
  apiKey: "your-key",
  baseURL: "https://api.deepinfra.com/v1/openai" // or OpenAI default
})
```

**Error Points:**
- ❌ LLM API timeout or failure
- ❌ Invalid prompt format
- ❌ Missing resources (templates/prompts)
- ❌ JSON parsing errors from LLM response
- ❌ Max iterations exceeded without valid resume

---

### 4. Resources (`/resources`)

**Purpose:** Templates, prompts, and validation rules

**Structure:**
```
resources/
├── templates/          # Resume templates (JSON)
│   ├── default.json
│   └── tech-focused.json
├── requirements/       # Validation rules (JSON)
│   ├── standard.json
│   └── ats-optimized.json
└── prompts/           # LLM prompts (TXT)
    ├── generate-resume.txt
    ├── optimize-resume.txt
    ├── validate-against-jd.txt
    └── extract-job-info.txt
```

**Template Format:**
```json
{
  "name": "default",
  "sections": ["summary", "experience", "skills", "education"],
  "formatting": {
    "maxLength": 2,
    "bulletStyle": "action-verb"
  }
}
```

---

## Data Structures

### Job Description
```typescript
interface JobDescription {
  title: string;           // "Senior Software Engineer"
  company: string;         // "Google"
  location: string;        // "Mountain View, CA"
  description: string;     // Full job description text
  requirements: string;    // Required skills/experience
  url: string;            // Job posting URL
  extractedAt: string;    // ISO timestamp
  source?: string;        // "LinkedIn", "Indeed", etc.
}
```

### Resume Output
```typescript
interface Resume {
  content: string;        // Markdown formatted resume
  metadata: {
    generatedAt: string;
    template: string;
    optimizationIterations: number;
    formatScore: number;
  };
}
```

---

## Error Handling Strategy

### Chrome Extension Errors
```typescript
try {
  // Operation
} catch (error) {
  console.error('[Resume AI Extension]', error);
  showStatus(`Error: ${error.message}`, 'error');
}
```

### API Server Errors
```typescript
app.post('/api/endpoint', async (req, res) => {
  try {
    // Operation
  } catch (error) {
    console.error('[API] Endpoint error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### AI Engine Errors
```typescript
async generate(input) {
  try {
    // LLM call
  } catch (error) {
    console.error('[AI Engine] Generation failed:', {
      error: error.message,
      input: input.title,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Resume generation failed: ${error.message}`);
  }
}
```

---

## Common Issues & Solutions

### Issue: Extension not loading
**Symptoms:** "Service worker registration failed"
**Causes:**
- Missing permissions in manifest.json
- Syntax errors in background.ts
- Invalid manifest.json format

**Debug:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Errors" button on extension
4. Check console for specific error

### Issue: API connection failed
**Symptoms:** "Failed to fetch" or "ERR_CONNECTION_REFUSED"
**Causes:**
- API server not running
- Wrong port (should be 3001)
- CORS issues

**Debug:**
1. Check API server is running: `curl http://localhost:3001/health`
2. Check console logs in terminal
3. Verify PORT in .env file

### Issue: LLM API errors
**Symptoms:** "API error 401" or "Rate limit exceeded"
**Causes:**
- Invalid API key
- Rate limiting
- Model not available

**Debug:**
1. Verify API key in .env
2. Test API key: `curl https://api.deepinfra.com/v1/openai/models -H "Authorization: Bearer $DEEPINFRA_API_KEY"`
3. Check model availability
4. Monitor API logs in server console

### Issue: Content script not extracting
**Symptoms:** Blank or incorrect data extracted
**Causes:**
- Job board changed their HTML structure
- Content script not injected
- Wrong CSS selectors

**Debug:**
1. Open job site
2. Open DevTools → Console
3. Type: `chrome.runtime.sendMessage({action: 'getJobBoard'})`
4. Check if content script responds
5. Inspect page HTML to verify selectors

---

## Development Workflow

### 1. Start API Server
```bash
cd api-server
pnpm install
pnpm dev
```
Expected output: `Server running on port 3001`

### 2. Build Chrome Extension
```bash
cd chrome-extension
npm install
npm run build
```
Output: Files in `dist/` folder

### 3. Load Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `chrome-extension/dist` folder

### 4. Test Flow
1. Navigate to job posting (e.g., LinkedIn)
2. Click extension icon
3. Click "Extract Job Description"
4. Verify data appears
5. Click "Send to AI"
6. Check API server logs
7. Verify resume generated

---

## Debugging Tools

### Chrome Extension
```javascript
// In extension popup console
chrome.storage.local.get(null, console.log); // View all storage

// In page console (where content script runs)
chrome.runtime.id; // Verify extension loaded
```

### API Server
```bash
# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/templates

# Check logs
# Server logs appear in terminal where you ran `pnpm dev`
```

### Network Inspection
```
Chrome DevTools → Network tab
- Filter: Fetch/XHR
- Look for POST to localhost:3001/api/*
- Check request payload and response
```

---

## Technology Stack

### Chrome Extension
- **Language:** TypeScript 5.4.5
- **Build:** tsc (TypeScript compiler)
- **APIs:** Chrome Extensions Manifest V3
- **Storage:** chrome.storage.local

### API Server
- **Runtime:** Node.js
- **Framework:** Express.js 4.19.2
- **Language:** TypeScript
- **Build:** tsup 8.0.2

### AI Engine
- **Language:** TypeScript
- **LLM Client:** OpenAI SDK 4.52.0
- **Provider:** DeepInfra (OpenAI-compatible)
- **Model:** google/gemini-2.5-flash

### Workspace
- **Package Manager:** pnpm 8.15.6
- **Monorepo:** pnpm workspaces
- **Packages:** 14 internal packages

---

## Next Steps for Debugging

1. **Check all services are running:**
   - API server: `curl http://localhost:3001/health`
   - Chrome extension loaded in browser

2. **Enable verbose logging:**
   - See updated files with `console.log` statements
   - Check browser console and terminal logs

3. **Test each component separately:**
   - Test API endpoints with curl
   - Test extension extraction on job site
   - Test LLM API with direct call

4. **Review error logs:**
   - Chrome extension errors: `chrome://extensions/` → Errors button
   - API server errors: Terminal output
   - Browser console: F12 → Console tab

---

## Getting Help

When reporting errors, include:
1. **Which component:** Extension, API, or AI Engine?
2. **Error message:** Full error text
3. **Steps to reproduce:** What were you doing?
4. **Logs:** Console output, terminal logs
5. **Environment:** Browser version, Node version, OS

Example:
```
Component: Chrome Extension
Error: "Cannot read properties of undefined (reading 'create')"
Steps: Loaded extension, opened LinkedIn, clicked icon
Logs: [attach screenshot from chrome://extensions/ errors]
Environment: Chrome 118, Windows 11
```
