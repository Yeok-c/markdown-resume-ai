# Resume AI - Full Project Documentation

An AI-powered resume generation and optimization system that helps create tailored, ATS-friendly resumes based on job descriptions.

## Architecture

The system follows the architecture diagram with these main components:

### 1. Chrome Extension (`chrome-extension/`)
- Extracts job descriptions from job boards (LinkedIn, Indeed, Glassdoor, etc.)
- Sends extracted data to the API server
- Provides quick access to resume generation

### 2. Resource Loader (`packages/ai-engine/src/resource-loader.ts`)
- Loads CV templates from JSON files
- Loads formatting requirements
- Loads LLM prompt templates
- Provides filtering and search capabilities

### 3. LLM Service (`packages/ai-engine/src/llm-service.ts`)
- Integrates with OpenAI API for intelligent content generation
- Generates resume content
- Optimizes existing resumes
- Validates against job descriptions
- Extracts structured job information

### 4. Compiler (`site/src/utils/markdown.ts`)
- Converts Markdown to HTML
- Supports KaTeX for math expressions
- Handles cross-references
- Processes front-matter
- Applies custom styling

### 5. Formatting Verifier (`packages/ai-engine/src/formatting-verifier.ts`)
- Validates against formatting requirements
- Checks for common resume mistakes
- Provides actionable suggestions
- Supports auto-fix for some issues

### 6. JD Validator (integrated in LLM Service)
- Compares resume against job description
- Calculates match score
- Identifies gaps and opportunities
- Provides specific improvement suggestions

### 7. Pipeline (`packages/ai-engine/src/pipeline.ts`)
- Orchestrates the entire process
- Iterative optimization loop
- Combines formatting and JD validation
- Returns best result

### 8. API Server (`api-server/`)
- REST API endpoints
- Handles Chrome extension requests
- Manages generation and optimization
- Provides template and requirement access

## Project Structure

```
markdown-resume-ai/
├── chrome-extension/      # Chrome extension for JD extraction
│   ├── manifest.json
│   ├── popup.ts
│   ├── background.ts
│   ├── content.ts
│   └── options.ts
├── packages/
│   ├── ai-engine/         # Core AI engine
│   │   ├── src/
│   │   │   ├── resource-loader.ts
│   │   │   ├── llm-service.ts
│   │   │   ├── formatting-verifier.ts
│   │   │   ├── pipeline.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── [other packages]   # Existing markdown processing packages
│   └── ...
├── api-server/            # REST API server
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── resources/             # Templates and configurations
│   ├── templates/         # CV templates
│   │   ├── default.json
│   │   └── tech-focused.json
│   ├── requirements/      # Formatting requirements
│   │   ├── standard.json
│   │   └── ats-optimized.json
│   └── prompts/           # LLM prompts
│       ├── generate-resume.txt
│       ├── optimize-resume.txt
│       ├── extract-job-info.txt
│       └── validate-against-jd.txt
├── site/                  # Existing Nuxt.js frontend
│   └── src/
│       └── utils/
│           └── markdown.ts  # Core compiler
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm 8+
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd markdown-resume-ai
pnpm install
```

2. **Set up API server:**
```bash
cd api-server
cp .env.example .env
# Edit .env with your API keys
```

3. **Build packages:**
```bash
pnpm build:pkg
```

4. **Start the API server:**
```bash
cd api-server
pnpm dev
```

5. **Start the frontend:**
```bash
pnpm dev
```

6. **Install Chrome extension:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension` directory
   - Build TypeScript files first if needed

### Building Chrome Extension

```bash
cd chrome-extension
pnpm install
pnpm build
```

## Usage

### 1. Using Chrome Extension

1. Navigate to a job posting on LinkedIn, Indeed, Glassdoor, etc.
2. Click the Resume AI extension icon
3. Click "Extract Job Description"
4. Review the extracted information
5. Click "Send to Resume AI" to generate a tailored resume

### 2. Using API Directly

**Generate a resume:**
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": {
      "title": "Senior Software Engineer",
      "description": "Full job description here..."
    },
    "userProfile": {
      "name": "John Doe",
      "email": "john@example.com",
      "experience": [...],
      "education": [...],
      "skills": [...]
    },
    "options": {
      "iterations": 3,
      "targetScore": 85
    }
  }'
```

**Optimize existing resume:**
```bash
curl -X POST http://localhost:3001/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Your existing resume markdown...",
    "jobDescription": {
      "description": "Job description here..."
    }
  }'
```

### 3. Using as a Library

```typescript
import { createResumeAI } from "@markdown-resume/ai-engine";

const resumeAI = await createResumeAI({
  llmProvider: "openai",
  llmApiKey: process.env.OPENAI_API_KEY!,
  resourcesPath: "./resources",
});

const result = await resumeAI.pipeline.generate(
  jobDescription,
  userProfile,
  { iterations: 3, targetScore: 85 }
);

console.log(result.markdown);
console.log(`Score: ${result.validation.score}`);
```

## Configuration

### LLM Providers
**OpenAI Configuration:**
```env
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4-turbo-preview  # or gpt-4, gpt-3.5-turbo
```

### Templates

Create custom templates in `resources/templates/`:
```json
{
  "name": "custom-template",
  "description": "Your custom template",
  "metadata": {
    "industry": ["finance"],
    "level": ["senior"],
    "type": "executive"
  },
  "markdown": "Your template content...",
  "css": "Custom styles...",
  "styles": { ... }
}
```

### Formatting Requirements

Create custom requirements in `resources/requirements/`:
```json
{
  "name": "custom-requirements",
  "description": "Custom formatting rules",
  "rules": [
    {
      "id": "custom-rule",
      "description": "Your rule description",
      "severity": "warning",
      "check": "rule-check-type",
      "autofix": false
    }
  ]
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/job-description` | POST | Receive JD from extension |
| `/api/generate` | POST | Generate new resume |
| `/api/optimize` | POST | Optimize existing resume |
| `/api/validate` | POST | Validate resume against JD |
| `/api/extract-job-info` | POST | Extract structured job info |
| `/api/templates` | GET | List available templates |
| `/api/templates/:name` | GET | Get specific template |
| `/api/requirements` | GET | List formatting requirements |

## Development

### Running Tests
```bash
pnpm test
```

### Linting
```bash
pnpm lint
```

### Building
```bash
# Build all packages
pnpm build:pkg

# Build API server
cd api-server && pnpm build

# Build frontend
pnpm build
```

## Features

✅ **Chrome Extension** - Extract JD from any job board  
✅ **Resource Loader** - Manage templates and requirements  
✅ **LLM Integration** - OpenAI GPT-4 and GPT-3.5 support  
✅ **Smart Compiler** - Markdown to HTML with LaTeX support  
✅ **Formatting Verifier** - 12+ validation rules  
✅ **JD Validation** - Match scoring and gap analysis  
✅ **Iterative Optimization** - Automatic improvement loop  
✅ **REST API** - Full API for integration  

## Roadmap

- [ ] Add more LLM providers (Azure OpenAI, Google Gemini)
- [ ] Implement caching for LLM responses
- [ ] Add user authentication
- [ ] Create a database for storing resumes and JDs
- [ ] Build a web UI for direct use
- [ ] Add more templates and requirements
- [ ] Implement A/B testing for different approaches
- [ ] Add analytics and tracking
- [ ] Create mobile app
- [ ] Add multilingual support

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

Based on [Renovamen/oh-my-cv](https://github.com/Renovamen/oh-my-cv)

## Support

For issues, questions, or contributions, please open an issue on GitHub.
