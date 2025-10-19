// Main exports for the AI Engine package

export {
  ResourceLoader,
  createResourceLoader,
  type CVTemplate,
  type FormattingRequirement,
  type FormattingRule,
  type ResourceConfig,
} from "./resource-loader";

export {
  LLMService,
  createLLMService,
  type LLMConfig,
  type LLMMessage,
  type LLMResponse,
} from "./llm-service";

export {
  FormattingVerifier,
  createDefaultVerifier,
  type ValidationIssue,
  type ValidationResult,
} from "./formatting-verifier";

export {
  ResumeGenerationPipeline,
  createPipeline,
  type PipelineConfig,
  type JobDescription,
  type UserProfile,
  type GenerationOptions,
  type PipelineResult,
} from "./pipeline";

// Convenience function to create a complete AI engine instance
export async function createResumeAI(config: {
  llmApiKey: string;
  llmModel?: string;
  llmBaseURL?: string;
  resourcesPath?: string;
}) {
  const { createLLMService } = await import("./llm-service");
  const { createResourceLoader } = await import("./resource-loader");
  const { createDefaultVerifier } = await import("./formatting-verifier");
  const { createPipeline } = await import("./pipeline");

  // Initialize LLM service
  const llmService = createLLMService({
    apiKey: config.llmApiKey,
    model: config.llmModel,
    baseURL: config.llmBaseURL,
    temperature: 0.7,
    maxTokens: 2000,
  });

  // Initialize resource loader
  const resourceLoader = createResourceLoader(config.resourcesPath);
  await resourceLoader.loadAll();

  // Initialize formatter verifier
  const verifier = createDefaultVerifier();

  // Create pipeline
  const pipeline = createPipeline({
    llmService,
    verifier,
    resourceLoader,
  });

  return {
    pipeline,
    llmService,
    resourceLoader,
    verifier,
  };
}
