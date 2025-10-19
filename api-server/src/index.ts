import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { createResumeAI } from "@markdown-resume/ai-engine";
import type {
  JobDescription,
  UserProfile,
  GenerationOptions,
} from "@markdown-resume/ai-engine";

// Load environment variables
dotenv.config();

const LOG_PREFIX = '[API Server]';

const app = express();
const PORT = process.env.PORT || 3001;

console.log(`${LOG_PREFIX} Starting server...`);
console.log(`${LOG_PREFIX} Environment:`, {
  hasDeepInfraKey: !!process.env.DEEPINFRA_API_KEY,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  llmModel: process.env.LLM_MODEL,
  port: PORT,
  resourcesPath: process.env.RESOURCES_PATH || './resources'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10mb" }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${LOG_PREFIX} ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Initialize Resume AI (lazy initialization)
let resumeAI: Awaited<ReturnType<typeof createResumeAI>> | null = null;

async function getResumeAI() {
  if (!resumeAI) {
    console.log(`${LOG_PREFIX} Initializing Resume AI...`);
    
    // Support DeepInfra or OpenAI
    const llmApiKey = process.env.DEEPINFRA_API_KEY || process.env.OPENAI_API_KEY;
    const llmBaseURL = process.env.DEEPINFRA_API_KEY 
      ? "https://api.deepinfra.com/v1/openai"
      : undefined;
    const llmModel = process.env.LLM_MODEL || 
      (process.env.DEEPINFRA_API_KEY ? "meta-llama/Meta-Llama-3.1-70B-Instruct" : "gpt-4-turbo-preview");

    if (!llmApiKey) {
      console.error(`${LOG_PREFIX} No API key found!`);
      throw new Error("DEEPINFRA_API_KEY or OPENAI_API_KEY must be set in environment variables");
    }

    console.log(`${LOG_PREFIX} Configuration:`, {
      provider: process.env.DEEPINFRA_API_KEY ? "DeepInfra" : "OpenAI",
      model: llmModel,
      baseURL: llmBaseURL,
      resourcesPath: process.env.RESOURCES_PATH || "./resources"
    });

    try {
      resumeAI = await createResumeAI({
        llmApiKey,
        llmModel,
        llmBaseURL,
        resourcesPath: process.env.RESOURCES_PATH || "./resources",
      });

      const provider = process.env.DEEPINFRA_API_KEY ? "DeepInfra" : "OpenAI";
      console.log(`${LOG_PREFIX} ✅ Resume AI initialized successfully with ${provider} (${llmModel})`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Failed to initialize Resume AI:`, error);
      throw error;
    }
  }

  return resumeAI;
}

// Error handling middleware
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check
app.get("/health", (req: Request, res: Response) => {
  console.log(`${LOG_PREFIX} Health check requested`);
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// POST /api/job-description
// Receive job description from Chrome extension
app.post(
  "/api/job-description",
  asyncHandler(async (req: Request, res: Response) => {
    console.log(`${LOG_PREFIX} Job description received from extension`);
    const jobData = req.body;
    console.log(`${LOG_PREFIX} Job data:`, {
      hasTitle: !!jobData.title,
      hasCompany: !!jobData.company,
      hasDescription: !!jobData.description,
      descriptionLength: jobData.description?.length || 0
    });

    if (!jobData.description) {
      console.warn(`${LOG_PREFIX} Missing job description in request`);
      return res.status(400).json({
        error: "Job description is required",
      });
    }

    // Store the job description (in a real app, you'd use a database)
    const jobId = Date.now().toString();
    console.log(`${LOG_PREFIX} Job saved with ID: ${jobId}`);

    res.json({
      success: true,
      jobId,
      message: "Job description received",
      resumeUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/generate/${jobId}`,
    });
  })
);

// POST /api/generate
// Generate a new resume from job description and user profile
app.post(
  "/api/generate",
  asyncHandler(async (req: Request, res: Response) => {
    console.log(`${LOG_PREFIX} Generate resume requested`);
    const ai = await getResumeAI();

    const {
      jobDescription,
      userProfile,
      options,
    }: {
      jobDescription: JobDescription;
      userProfile: UserProfile;
      options?: GenerationOptions;
    } = req.body;

    if (!jobDescription?.description) {
      return res.status(400).json({
        error: "Job description is required",
      });
    }

    if (!userProfile?.name || !userProfile?.email) {
      return res.status(400).json({
        error: "User profile with name and email is required",
      });
    }

    console.log(`Generating resume for ${userProfile.name}...`);

    const result = await ai.pipeline.generate(jobDescription, userProfile, options);

    res.json({
      success: result.success,
      markdown: result.markdown,
      html: result.html,
      validation: result.validation,
      jdMatch: result.jdMatch,
      iterations: result.iterations,
      metadata: result.metadata,
    });
  })
);

// POST /api/optimize
// Optimize an existing resume for a job description
app.post(
  "/api/optimize",
  asyncHandler(async (req: Request, res: Response) => {
    const ai = await getResumeAI();

    const {
      markdown,
      jobDescription,
      options,
    }: {
      markdown: string;
      jobDescription: JobDescription;
      options?: GenerationOptions;
    } = req.body;

    if (!markdown) {
      return res.status(400).json({
        error: "Existing resume markdown is required",
      });
    }

    if (!jobDescription?.description) {
      return res.status(400).json({
        error: "Job description is required",
      });
    }

    console.log("Optimizing resume...");

    const result = await ai.pipeline.optimize(markdown, jobDescription, options);

    res.json({
      success: result.success,
      markdown: result.markdown,
      html: result.html,
      validation: result.validation,
      jdMatch: result.jdMatch,
      iterations: result.iterations,
      metadata: result.metadata,
    });
  })
);

// POST /api/validate
// Validate a resume against job description
app.post(
  "/api/validate",
  asyncHandler(async (req: Request, res: Response) => {
    const ai = await getResumeAI();

    const {
      markdown,
      jobDescription,
    }: {
      markdown: string;
      jobDescription: JobDescription;
    } = req.body;

    if (!markdown) {
      return res.status(400).json({
        error: "Resume markdown is required",
      });
    }

    if (!jobDescription?.description) {
      return res.status(400).json({
        error: "Job description is required",
      });
    }

    console.log("Validating resume...");

    const result = await ai.pipeline.validate(markdown, jobDescription);

    res.json({
      validation: result.validation,
      jdMatch: result.jdMatch,
    });
  })
);

// POST /api/extract-job-info
// Extract structured information from job description
app.post(
  "/api/extract-job-info",
  asyncHandler(async (req: Request, res: Response) => {
    const ai = await getResumeAI();

    const { jobDescription }: { jobDescription: string } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        error: "Job description is required",
      });
    }

    console.log("Extracting job information...");

    const jobInfo = await ai.llmService.extractJobInfo(jobDescription);

    res.json(jobInfo);
  })
);

// GET /api/templates
// List available CV templates
app.get(
  "/api/templates",
  asyncHandler(async (req: Request, res: Response) => {
    const ai = await getResumeAI();
    const templates = ai.resourceLoader.getAllTemplates();

    res.json({
      templates: templates.map((t) => ({
        name: t.name,
        description: t.description,
        metadata: t.metadata,
      })),
    });
  })
);

// GET /api/templates/:name
// Get a specific template
app.get(
  "/api/templates/:name",
  asyncHandler(async (req: Request, res: Response) => {
    const ai = await getResumeAI();
    const template = ai.resourceLoader.getTemplate(req.params.name);

    if (!template) {
      return res.status(404).json({
        error: "Template not found",
      });
    }

    res.json(template);
  })
);

// GET /api/requirements
// List available formatting requirements
app.get(
  "/api/requirements",
  asyncHandler(async (req: Request, res: Response) => {
    const ai = await getResumeAI();
    const requirements = ai.resourceLoader.getAllRequirements();

    res.json({
      requirements: requirements.map((r) => ({
        name: r.name,
        description: r.description,
        ruleCount: r.rules.length,
      })),
    });
  })
);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  res.status(500).json({
    error: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Resume AI API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  const provider = process.env.DEEPINFRA_API_KEY ? "DeepInfra" : "OpenAI";
  const model = process.env.LLM_MODEL || (process.env.DEEPINFRA_API_KEY ? "meta-llama/Meta-Llama-3.1-70B-Instruct" : "gpt-4-turbo-preview");
  console.log(`LLM Provider: ${provider} (${model})`);
});

export default app;
