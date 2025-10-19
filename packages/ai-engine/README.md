# AI Engine

AI-powered resume generation and optimization engine for markdown-resume-ai.

## Features

- **Resource Loader**: Load CV templates, formatting requirements, and prompt templates
- **LLM Service**: Interface with OpenAI GPT models
- **Formatting Verifier**: Validate resumes against formatting requirements
- **Generation Pipeline**: Orchestrate the entire CV generation and optimization process

## Usage

```typescript
import { createResumeAI } from "@markdown-resume/ai-engine";

// Initialize the AI engine
const resumeAI = await createResumeAI({
  llmProvider: "openai",
  llmApiKey: process.env.OPENAI_API_KEY!,
  llmModel: "gpt-4-turbo-preview",
  resourcesPath: "./resources",
});

// Generate a resume
const result = await resumeAI.pipeline.generate(
  {
    title: "Senior Software Engineer",
    company: "Tech Corp",
    description: "Job description here...",
    requirements: "Requirements here...",
  },
  {
    name: "John Doe",
    email: "john@example.com",
    experience: [
      {
        title: "Software Engineer",
        company: "Previous Company",
        duration: "2020 - 2023",
        achievements: [
          "Built scalable systems",
          "Led team of 5 developers",
        ],
      },
    ],
    education: [
      {
        degree: "BS Computer Science",
        institution: "University",
        year: "2020",
      },
    ],
    skills: ["JavaScript", "TypeScript", "React", "Node.js"],
  },
  {
    iterations: 3,
    targetScore: 85,
  }
);

console.log(result.markdown);
console.log(`Score: ${result.validation.score}`);
```

## API

### ResourceLoader

Loads CV templates, formatting requirements, and prompt templates from the file system.

### LLMService

Provides methods for:
- Generating CV content
- Optimizing existing CVs
- Validating against job descriptions
- Extracting job information

### FormattingVerifier

Checks compiled CVs against formatting rules:
- Length requirements
- Required sections
- Bullet point formatting
- Action verb usage
- Quantifiable achievements
- And more...

### ResumeGenerationPipeline

Orchestrates the complete process:
1. Load resources
2. Extract job information
3. Generate CV content
4. Compile to HTML
5. Verify formatting
6. Validate against JD
7. Iterate and optimize
8. Return best result
