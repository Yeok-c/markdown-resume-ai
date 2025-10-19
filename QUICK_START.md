# Resume AI - Quick Start Guide

## What Was Built

A complete AI-powered resume generation system following your architecture diagram with 8 major components:

### ✅ Components Implemented

1. **Chrome Extension** (`chrome-extension/`)
   - Extracts job descriptions from LinkedIn, Indeed, Glassdoor
   - Popup interface for quick extraction
   - Background service worker
   - Content scripts for enhanced extraction
   - Settings page for API configuration

2. **Resource Loader** (`packages/ai-engine/src/resource-loader.ts`)
   - Loads CV templates from JSON
   - Loads formatting requirements
   - Loads LLM prompt templates
   - Supports filtering and search
   - Hot reloading capability

3. **LLM Service** (`packages/ai-engine/src/llm-service.ts`)
   - OpenAI integration (GPT-4, GPT-3.5)
   - Resume generation
   - Resume optimization
   - JD validation
   - Job info extraction

4. **Compiler** (existing `site/src/utils/markdown.ts`)
   - Already integrated with the system
   - Converts Markdown to HTML
   - Supports LaTeX math (KaTeX)
   - Front-matter processing
   - Cross-references

5. **Formatting Verifier** (`packages/ai-engine/src/formatting-verifier.ts`)
   - 12+ validation rules
   - Score calculation
   - Issue detection
   - Auto-fix suggestions
   - Extensible rule system

6. **JD Validator** (integrated in LLM Service)
   - Match score calculation
   - Gap analysis
   - Keyword matching
   - Improvement suggestions

7. **Pipeline** (`packages/ai-engine/src/pipeline.ts`)
   - Orchestrates entire process
   - Iterative optimization (3 iterations default)
   - Combined scoring
   - Best result selection

8. **API Server** (`api-server/`)
   - Express.js REST API
   - 9 endpoints
   - CORS enabled
   - Error handling
   - Environment configuration

### 📁 File Structure Created

```
markdown-resume-ai/
├── chrome-extension/           # NEW: Chrome extension
│   ├── manifest.json
│   ├── popup.ts & popup.html
│   ├── background.ts
│   ├── content.ts
│   ├── options.ts & options.html
│   ├── package.json
│   └── tsconfig.json
├── packages/
│   └── ai-engine/             # NEW: Core AI engine
│       ├── src/
│       │   ├── resource-loader.ts
│       │   ├── llm-service.ts
│       │   ├── formatting-verifier.ts
│       │   ├── pipeline.ts
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       └── README.md
├── api-server/                # NEW: REST API
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── resources/                 # NEW: Templates & configs
│   ├── templates/
│   │   ├── default.json
│   │   └── tech-focused.json
│   ├── requirements/
│   │   ├── standard.json
│   │   └── ats-optimized.json
│   └── prompts/
│       ├── generate-resume.txt
│       ├── optimize-resume.txt
│       ├── extract-job-info.txt
│       └── validate-against-jd.txt
└── PROJECT_README.md          # NEW: Full documentation
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd markdown-resume-ai
pnpm install
```

### 2. Configure API Keys

```bash
cd api-server
cp .env.example .env
```

Edit `.env`:
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
PORT=3001
```

### 3. Build Packages

```bash
# From project root
pnpm build:pkg
```

### 4. Start API Server

```bash
cd api-server
pnpm dev
```

Server runs on http://localhost:3001

### 5. Start Frontend (Optional)

```bash
# From project root
pnpm dev
```

Frontend runs on http://localhost:3000

### 6. Install Chrome Extension

```bash
cd chrome-extension
npm install
npm run build
```

Then:
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `chrome-extension/dist` folder

## 📝 Usage Examples

### Example 1: Generate Resume via API

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "description": "We are seeking a talented Senior Software Engineer..."
    },
    "userProfile": {
      "name": "John Doe",
      "email": "john@example.com",
      "experience": [
        {
          "title": "Software Engineer",
          "company": "StartUp Inc",
          "duration": "2020 - 2023",
          "achievements": [
            "Built scalable microservices handling 1M+ requests/day",
            "Led team of 5 developers",
            "Reduced deployment time by 60%"
          ]
        }
      ],
      "education": [
        {
          "degree": "BS Computer Science",
          "institution": "MIT",
          "year": "2020"
        }
      ],
      "skills": ["Python", "JavaScript", "React", "Node.js", "AWS"]
    }
  }'
```

### Example 2: Using Chrome Extension

1. Go to https://linkedin.com/jobs/...
2. Click Resume AI extension icon
3. Click "Extract Job Description"
4. Review extracted data
5. Click "Send to Resume AI"
6. Opens frontend with pre-filled JD

### Example 3: Using as Library

```typescript
import { createResumeAI } from "@markdown-resume/ai-engine";

// Initialize
const resumeAI = await createResumeAI({
  llmProvider: "openai",
  llmApiKey: process.env.OPENAI_API_KEY!,
  resourcesPath: "./resources",
});

// Generate resume
const result = await resumeAI.pipeline.generate(
  jobDescription,
  userProfile,
  {
    iterations: 3,
    targetScore: 85,
    templateName: "tech-focused",
  }
);

console.log("Markdown:", result.markdown);
console.log("Validation Score:", result.validation.score);
console.log("JD Match Score:", result.jdMatch.score);
console.log("Issues:", result.validation.issues);
console.log("Suggestions:", result.jdMatch.suggestions);
```

## 🔧 Configuration

### LLM Providers

**OpenAI (GPT-4):**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4-turbo-preview
```
**OpenAI Configuration:**
```env
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4-turbo-preview  # or gpt-4, gpt-3.5-turbo
```

### Templates

Two built-in templates:
- `default` - General professional resume
- `tech-focused` - Technical/software engineering

Add custom templates in `resources/templates/`

### Requirements

Two built-in requirement sets:
- `standard` - Professional standards
- `ats-optimized` - ATS-friendly rules

Add custom requirements in `resources/requirements/`

## 🎯 Key Features

✅ **Automated JD Extraction** - Chrome extension for any job board  
✅ **AI-Powered Generation** - Creates tailored resumes  
✅ **Iterative Optimization** - Improves through multiple passes  
✅ **Formatting Validation** - 12+ professional rules  
✅ **JD Matching** - Scores and suggests improvements  
✅ **Template System** - Customizable templates  
✅ **Multi-LLM Support** - OpenAI and Anthropic  
✅ **REST API** - Easy integration  
✅ **TypeScript** - Type-safe throughout  

## 📊 System Flow

```
1. Chrome Extension → Extract JD from website
2. Resource Loader → Load templates & requirements
3. LLM Service → Extract job info & generate CV
4. Compiler → Convert Markdown to HTML
5. Formatting Verifier → Check against rules
6. JD Validator → Score against job description
7. Pipeline → Iterate and optimize (3x)
8. API → Return best result
```

## 🐛 Troubleshooting

**Issue: TypeScript errors**
- Run `pnpm install` in each directory
- Ensure all packages are built: `pnpm build:pkg`

**Issue: API server won't start**
- Check `.env` file has valid API key
- Ensure port 3001 is available
- Check resources folder exists

**Issue: Chrome extension errors**
- Build TypeScript: `cd chrome-extension && npm run build`
- Check manifest.json is in dist folder
- Reload extension in Chrome

**Issue: LLM API errors**
- Verify API key is correct
- Check rate limits
- Ensure internet connection

## 📚 Next Steps

1. **Test the system:**
   - Start API server
   - Try the example API calls
   - Install Chrome extension
   - Generate a test resume

2. **Customize:**
   - Add your own templates
   - Create custom requirements
   - Modify prompts
   - Adjust scoring

3. **Integrate:**
   - Connect to your frontend
   - Add database storage
   - Implement user auth
   - Add analytics

4. **Deploy:**
   - Deploy API to cloud
   - Publish Chrome extension
   - Host frontend
   - Set up monitoring

## 📖 Documentation

- **Full Documentation**: `PROJECT_README.md`
- **AI Engine**: `packages/ai-engine/README.md`
- **API Server**: `api-server/README.md`
- **Original Project**: `README.md`

## 🤝 Support

For questions or issues, please refer to the documentation or create an issue on GitHub.

---

**Built with TypeScript** 🚀  
**Powered by OpenAI** 🤖  
**ATS-Friendly** ✅
