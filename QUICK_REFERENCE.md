# Resume AI - Quick Reference Card

## 🏗️ Architecture Overview

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  Chrome Ext     │──────▶│   API Server    │──────▶│   AI Engine      │
│  (TypeScript)   │ HTTP  │   (Express)     │ Calls │   (OpenAI SDK)   │
│                 │       │                 │       │                  │
│ • background.ts │       │ • 9 REST APIs   │       │ • LLM Service    │
│ • content.ts    │       │ • DeepInfra/    │       │ • Pipeline       │
│ • popup.ts      │       │   OpenAI        │       │ • Verifier       │
└─────────────────┘       └─────────────────┘       └──────────────────┘
        │                          │                          │
        ▼                          ▼                          ▼
   Job Sites              Chrome Storage              DeepInfra API
```

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies (run once)
pnpm install

# 2. Build AI engine
cd packages/ai-engine && pnpm build && cd ../..

# 3. Build Chrome extension
cd chrome-extension && npm run build && cd ..

# 4. Start API server
cd api-server && pnpm dev
```

---

## 🔧 Key Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `api-server/.env` | API keys, config | Change LLM provider/model |
| `chrome-extension/manifest.json` | Extension config | Add permissions |
| `chrome-extension/content.ts` | Job board selectors | Site structure changed |
| `api-server/src/index.ts` | API endpoints | Add new endpoints |
| `packages/ai-engine/src/llm-service.ts` | LLM integration | Change AI logic |

---

## 📝 Environment Variables

### `api-server/.env`
```env
# Required: One of these
DEEPINFRA_API_KEY=your-key-here
# OR
OPENAI_API_KEY=your-key-here

# Model to use
LLM_MODEL=google/gemini-2.5-flash

# Server configuration
PORT=3001
RESOURCES_PATH=../resources
```

---

## 🔍 Where to Find Logs

### Chrome Extension Logs

| Component | Where | What to Look For |
|-----------|-------|------------------|
| **Background** | `chrome://extensions/` → Resume AI → "service worker" | `[Resume AI Background]` logs |
| **Popup** | Right-click popup → Inspect → Console | `[Resume AI Popup]` logs |
| **Content Script** | Job page → F12 → Console | `[Resume AI Content]` logs |

### API Server Logs

| Location | What |
|----------|------|
| Terminal (where `pnpm dev` runs) | `[API Server]` logs with all requests |

---

## ⚠️ Common Errors Quick Fix

| Error | Quick Fix |
|-------|-----------|
| "Cannot read properties of undefined (reading 'create')" | Add `"contextMenus"` to manifest.json permissions |
| "Failed to fetch" | Start API server: `cd api-server && pnpm dev` |
| "No API key found" | Create `api-server/.env` with `DEEPINFRA_API_KEY=xxx` |
| "Service worker registration failed" | Check manifest.json syntax, reload extension |
| Extraction returns blank data | Check job board selectors in `content.ts` |
| Port 3001 already in use | Change `PORT=3002` in `.env` or kill process |

---

## 🧪 Quick Health Checks

```bash
# 1. Check API server is running
curl http://localhost:3001/health
# Expected: {"status":"ok",...}

# 2. Test job description endpoint
curl -X POST http://localhost:3001/api/job-description \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test job"}'
# Expected: {"success":true,"jobId":"..."}

# 3. Check extension storage
# In extension popup console:
chrome.storage.local.get(null, console.log)

# 4. Check extension is loaded
# In any tab console:
chrome.runtime.id
# Should return extension ID (not undefined)
```

---

## 📦 Build Commands

```bash
# Build everything
pnpm install && \
cd packages/ai-engine && pnpm build && cd ../.. && \
cd chrome-extension && npm run build && cd ..

# Build just extension (fast)
cd chrome-extension && npm run build

# Build just AI engine
cd packages/ai-engine && pnpm build

# Clean and rebuild
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install
```

---

## 🌐 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/job-description` | POST | Receive job data from extension |
| `/api/generate` | POST | Generate full resume |
| `/api/optimize` | POST | Optimize existing resume |
| `/api/validate` | POST | Validate resume against JD |
| `/api/extract-job-info` | POST | Extract structured job info |
| `/api/format-check` | POST | Check resume formatting |
| `/api/templates` | GET | List available templates |
| `/api/requirements` | GET | List requirement sets |

---

## 🎯 Supported Job Boards

| Site | Domain Pattern | Status |
|------|----------------|--------|
| LinkedIn | `linkedin.com` | ✅ Supported |
| Indeed | `indeed.com` | ✅ Supported |
| Glassdoor | `glassdoor.com` | ✅ Supported |
| Others | - | ⚠️ Generic extraction (may be inaccurate) |

---

## 🔑 Chrome Extension Permissions

Required permissions in `manifest.json`:

```json
"permissions": [
  "activeTab",      // Read current tab content
  "storage",        // Store extracted data
  "scripting",      // Inject content scripts
  "contextMenus"    // Right-click menu
]
```

---

## 📊 Data Flow

1. **User opens job posting** → Content script detects job board
2. **User clicks extension icon** → Popup opens
3. **User clicks "Extract"** → Popup injects script, extracts DOM data
4. **Data saved** → Chrome storage (`chrome.storage.local`)
5. **User clicks "Send to AI"** → Popup sends POST to API server
6. **API receives data** → Initializes AI engine if needed
7. **AI generates resume** → Calls DeepInfra/OpenAI API
8. **Resume returned** → Sent back to extension

---

## 🛠️ Development Workflow

```bash
# Terminal 1: API Server (keep running)
cd api-server
pnpm dev

# Terminal 2: Make changes
# Edit files...

# Rebuild extension after changes
cd chrome-extension
npm run build

# Reload extension in Chrome
# 1. Go to chrome://extensions/
# 2. Click reload button on Resume AI extension

# Test on job site
# Navigate to LinkedIn/Indeed/Glassdoor job posting
```

---

## 📚 Documentation Files

| File | Contents |
|------|----------|
| `README.md` | Project overview |
| `ARCHITECTURE.md` | **Detailed system architecture** ⭐ |
| `DEBUGGING_GUIDE.md` | **Step-by-step debugging** ⭐ |
| `QUICK_START.md` | Quick setup instructions |
| `DEEPINFRA_SETUP.md` | DeepInfra integration guide |
| `ANTHROPIC_REMOVAL_SUMMARY.md` | Anthropic removal changes |

**Read ARCHITECTURE.md and DEBUGGING_GUIDE.md first!**

---

## 💡 Pro Tips

1. **Always check logs first** - They show exactly what's happening
2. **Test components separately** - Isolate where the issue is
3. **Use curl to test API** - Bypass extension to test backend
4. **Check browser console** - F12 on job page and popup
5. **Reload extension after changes** - Chrome doesn't auto-reload
6. **Verify .env file** - Most issues are missing API keys
7. **Check service worker** - Should show "active" status

---

## 🆘 Getting Help

**Before asking:**
1. Read `ARCHITECTURE.md` for system overview
2. Follow `DEBUGGING_GUIDE.md` for troubleshooting
3. Collect diagnostic info:
   - Error messages (full text)
   - Console logs (all three: background, popup, content)
   - API server terminal output
   - Steps to reproduce

**Share:**
- Which component is failing
- What you expected vs what happened
- Relevant log snippets
- Environment (OS, Node version, Chrome version)

---

## 📖 Learning Path

1. ✅ **Read this file** - Quick overview
2. ✅ **Read ARCHITECTURE.md** - Understand how it works
3. ✅ **Follow QUICK_START.md** - Get it running
4. ✅ **Try it out** - Extract a real job posting
5. ✅ **Read DEBUGGING_GUIDE.md** - When things go wrong
6. ✅ **Explore code** - Understand implementation

---

## 🎓 Key Concepts

### Chrome Extension Parts

- **manifest.json**: Configuration (what extension can do)
- **background.ts**: Service worker (runs in background, handles events)
- **content.ts**: Runs on web pages (reads job board HTML)
- **popup.ts**: UI logic (what happens when you click buttons)

### API Server Parts

- **Express middleware**: helmet, cors, compression, json parsing
- **Lazy initialization**: AI engine only created when first used
- **Error handling**: try-catch with detailed logging

### AI Engine Parts

- **LLMService**: Wrapper for OpenAI SDK (works with DeepInfra)
- **Pipeline**: Orchestrates resume generation steps
- **FormattingVerifier**: Checks resume follows rules
- **ResourceLoader**: Loads templates, prompts, requirements

---

**🚀 You're ready to debug! Start with ARCHITECTURE.md for the big picture.**
