# Resume AI API Server

REST API server for the Resume AI system.

## Features

- Generate resumes from job descriptions and user profiles
- Optimize existing resumes for specific jobs
- Validate resumes against job descriptions
- Extract structured information from job descriptions
- Manage CV templates and formatting requirements

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure your environment variables:
   - Set your OpenAI API key
   - Configure other settings as needed

4. Start the server:
```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Job Description from Chrome Extension
```
POST /api/job-description
Body: {
  title: string,
  company?: string,
  description: string,
  requirements: string,
  url?: string
}
```

### Generate Resume
```
POST /api/generate
Body: {
  jobDescription: JobDescription,
  userProfile: UserProfile,
  options?: GenerationOptions
}
```

### Optimize Resume
```
POST /api/optimize
Body: {
  markdown: string,
  jobDescription: JobDescription,
  options?: GenerationOptions
}
```

### Validate Resume
```
POST /api/validate
Body: {
  markdown: string,
  jobDescription: JobDescription
}
```

### Extract Job Info
```
POST /api/extract-job-info
Body: {
  jobDescription: string
}
```

### List Templates
```
GET /api/templates
```

### Get Template
```
GET /api/templates/:name
```

### List Requirements
```
GET /api/requirements
```

## Example Usage

```bash
# Generate a resume
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "description": "We are looking for...",
      "requirements": "5+ years experience..."
    },
    "userProfile": {
      "name": "John Doe",
      "email": "john@example.com",
      "experience": [...],
      "education": [...],
      "skills": [...]
    }
  }'
```
