# Resume AI - Test Examples

Quick test examples to verify your installation.

## 1. Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T...",
  "version": "1.0.0"
}
```

## 2. Extract Job Information

```bash
curl -X POST http://localhost:3001/api/extract-job-info \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "We are seeking a Senior Software Engineer with 5+ years of experience in Python, JavaScript, and cloud technologies. You will lead a team of developers building scalable web applications. Requirements include: BS in Computer Science, experience with AWS, Docker, and microservices architecture."
  }'
```

Expected response:
```json
{
  "title": "Senior Software Engineer",
  "company": null,
  "requiredSkills": ["Python", "JavaScript", "Cloud Technologies", ...],
  "preferredSkills": [...],
  "responsibilities": ["Lead team of developers", ...],
  "qualifications": ["BS in Computer Science", ...],
  "keywords": ["Python", "JavaScript", "AWS", ...]
}
```

## 3. Generate Resume

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "description": "We are seeking a Senior Software Engineer with 5+ years of experience in Python, JavaScript, and cloud technologies. The ideal candidate will lead a team building scalable web applications using modern frameworks and cloud infrastructure."
    },
    "userProfile": {
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "phone": "+1-555-0123",
      "experience": [
        {
          "title": "Software Engineer",
          "company": "StartUp Inc",
          "duration": "2019 - Present",
          "achievements": [
            "Led development of microservices architecture serving 1M+ users",
            "Reduced deployment time by 60% through CI/CD automation",
            "Mentored team of 4 junior developers",
            "Implemented monitoring system reducing downtime by 80%"
          ]
        },
        {
          "title": "Junior Developer",
          "company": "Web Agency",
          "duration": "2017 - 2019",
          "achievements": [
            "Built 15+ client websites using React and Node.js",
            "Improved page load times by 40% through optimization",
            "Collaborated with design team on UX improvements"
          ]
        }
      ],
      "education": [
        {
          "degree": "BS Computer Science",
          "institution": "State University",
          "year": "2017"
        }
      ],
      "skills": [
        "Python",
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "AWS",
        "Docker",
        "Kubernetes",
        "PostgreSQL",
        "MongoDB",
        "Git",
        "CI/CD"
      ],
      "summary": "Experienced software engineer with a passion for building scalable systems and leading high-performing teams."
    },
    "options": {
      "iterations": 2,
      "targetScore": 80,
      "templateName": "default"
    }
  }'
```

Expected response (truncated):
```json
{
  "success": true,
  "markdown": "# Jane Smith\n\njane.smith@example.com | +1-555-0123\n\n## Professional Summary\n\n...",
  "html": "<h1>Jane Smith</h1>...",
  "validation": {
    "score": 85,
    "issues": [],
    "summary": "All formatting checks passed!"
  },
  "jdMatch": {
    "score": 88,
    "matches": ["Strong Python experience", "Leadership skills demonstrated", ...],
    "gaps": [],
    "suggestions": ["Consider adding AWS certifications", ...]
  },
  "iterations": 2,
  "metadata": {
    "template": "default",
    "requirements": "standard",
    "timestamp": "2025-10-18T..."
  }
}
```

## 4. Optimize Existing Resume

```bash
curl -X POST http://localhost:3001/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Jane Smith\n\njane.smith@example.com\n\n## Experience\n\n### Software Engineer at StartUp Inc\n*2019 - Present*\n\n- Worked on various projects\n- Used different technologies\n- Collaborated with team\n\n## Education\n\nBS Computer Science, State University, 2017\n\n## Skills\n\nPython, JavaScript, React, Node.js",
    "jobDescription": {
      "title": "Senior Software Engineer",
      "description": "Looking for a senior engineer with proven track record of building scalable systems, leading teams, and working with cloud technologies. Must have 5+ years experience with Python, JavaScript, and AWS."
    },
    "options": {
      "iterations": 2,
      "targetScore": 85
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "markdown": "# Jane Smith\n\njane.smith@example.com\n\n## Professional Summary\n\nSenior Software Engineer with 5+ years...",
  "validation": {...},
  "jdMatch": {...},
  "iterations": 2
}
```

## 5. Validate Resume

```bash
curl -X POST http://localhost:3001/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Jane Smith\n\njane.smith@example.com | +1-555-0123\n\n## Professional Summary\n\nExperienced software engineer...",
    "jobDescription": {
      "description": "Senior Software Engineer with Python and AWS experience..."
    }
  }'
```

Expected response:
```json
{
  "validation": {
    "valid": true,
    "score": 90,
    "issues": [],
    "summary": "All formatting checks passed!"
  },
  "jdMatch": {
    "score": 85,
    "matches": ["Strong technical skills", ...],
    "gaps": ["Could emphasize cloud experience more"],
    "suggestions": ["Add AWS certifications", ...]
  }
}
```

## 6. List Templates

```bash
curl http://localhost:3001/api/templates
```

Expected response:
```json
{
  "templates": [
    {
      "name": "default",
      "description": "Professional ATS-friendly resume template",
      "metadata": {
        "industry": ["software", "technology", "engineering"],
        "level": ["entry", "mid", "senior"],
        "type": "professional"
      }
    },
    {
      "name": "tech-focused",
      "description": "Technical resume optimized for software engineering roles",
      "metadata": {
        "industry": ["software", "technology"],
        "level": ["mid", "senior", "lead"],
        "type": "technical"
      }
    }
  ]
}
```

## 7. List Requirements

```bash
curl http://localhost:3001/api/requirements
```

Expected response:
```json
{
  "requirements": [
    {
      "name": "standard",
      "description": "Standard professional resume formatting requirements",
      "ruleCount": 12
    },
    {
      "name": "ats-optimized",
      "description": "ATS (Applicant Tracking System) optimized formatting requirements",
      "ruleCount": 8
    }
  ]
}
```

## Testing with PowerShell (Windows)

If `curl` doesn't work on Windows, use PowerShell:

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:3001/health

# Generate resume
$body = @{
    jobDescription = @{
        title = "Senior Software Engineer"
        description = "Job description here..."
    }
    userProfile = @{
        name = "Jane Smith"
        email = "jane@example.com"
        experience = @()
        education = @()
        skills = @()
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:3001/api/generate `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

## Testing with JavaScript/Node.js

```javascript
// test.js
async function testAPI() {
  const response = await fetch('http://localhost:3001/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescription: {
        title: 'Senior Software Engineer',
        description: 'Full job description...'
      },
      userProfile: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        experience: [...],
        education: [...],
        skills: [...]
      }
    })
  });

  const result = await response.json();
  console.log('Generated Resume:', result.markdown);
  console.log('Validation Score:', result.validation.score);
  console.log('JD Match Score:', result.jdMatch.score);
}

testAPI();
```

## Quick Test Script

Save as `test-api.sh`:

```bash
#!/bin/bash

echo "Testing Resume AI API..."
echo ""

# 1. Health check
echo "1. Health Check"
curl -s http://localhost:3001/health | jq
echo ""

# 2. List templates
echo "2. List Templates"
curl -s http://localhost:3001/api/templates | jq
echo ""

# 3. Extract job info (simple test)
echo "3. Extract Job Info"
curl -s -X POST http://localhost:3001/api/extract-job-info \
  -H "Content-Type: application/json" \
  -d '{"jobDescription":"Senior Software Engineer with Python and AWS experience"}' | jq
echo ""

echo "All tests complete!"
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

## Troubleshooting

**API not responding?**
- Check if server is running: `ps aux | grep node`
- Check port 3001: `lsof -i :3001` (Mac/Linux) or `netstat -ano | findstr :3001` (Windows)
- Check logs in terminal where server is running

**Error: LLM API key missing?**
- Verify `.env` file exists in `api-server/`
- Ensure `OPENAI_API_KEY` is set
- Restart server after changing `.env`

**Timeout errors?**
- LLM requests can take 10-30 seconds
- Increase timeout if needed
- Check your LLM API rate limits

**Empty responses?**
- Check server logs for errors
- Verify resources folder exists and contains templates
- Ensure all dependencies are installed
