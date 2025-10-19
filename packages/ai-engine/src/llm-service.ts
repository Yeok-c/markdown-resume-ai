import OpenAI from "openai";

export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string; // Support custom endpoints like DeepInfra
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class LLMService {
  private config: LLMConfig;
  private openai: OpenAI;

  constructor(config: LLMConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL, // Use custom base URL if provided
    });
  }

  /**
   * Send a chat completion request to the LLM
   */
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const temperature = this.config.temperature ?? 0.7;
    const maxTokens = this.config.maxTokens ?? 2000;
    const model = this.config.model || "gpt-4-turbo-preview";

    const response = await this.openai.chat.completions.create({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error("No response from OpenAI");
    }

    return {
      content: choice.message.content || "",
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      model: response.model,
    };
  }

  /**
   * Generate CV content based on job description and template
   */
  async generateCVContent(params: {
    jobDescription: string;
    userProfile: string;
    template: string;
    instructions?: string;
  }): Promise<string> {
    const systemPrompt = `You are an expert CV/resume writer. Your task is to create a tailored resume that matches the job description while highlighting the candidate's relevant experience and skills.

Guidelines:
1. Use the provided template structure
2. Emphasize achievements with quantifiable results
3. Use action verbs and industry-specific keywords
4. Match the tone and style to the job description
5. Keep it concise and ATS-friendly
6. Format in Markdown as per the template`;

    const userPrompt = `Create a resume based on the following:

JOB DESCRIPTION:
${params.jobDescription}

USER PROFILE:
${params.userProfile}

TEMPLATE:
${params.template}

${params.instructions ? `ADDITIONAL INSTRUCTIONS:\n${params.instructions}` : ""}

Generate a complete resume in Markdown format that best matches this job opportunity.`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return response.content;
  }

  /**
   * Optimize existing CV content for a specific job
   */
  async optimizeCVForJob(params: {
    currentCV: string;
    jobDescription: string;
    focusAreas?: string[];
  }): Promise<string> {
    const systemPrompt = `You are an expert CV optimization specialist. Your task is to improve an existing CV to better match a job description while maintaining authenticity and accuracy.`;

    const focusAreasText = params.focusAreas?.length
      ? `\n\nFOCUS AREAS:\n${params.focusAreas.join("\n")}`
      : "";

    const userPrompt = `Optimize this CV for the following job:

JOB DESCRIPTION:
${params.jobDescription}

CURRENT CV:
${params.currentCV}${focusAreasText}

Provide an optimized version that:
1. Better highlights relevant experience
2. Uses keywords from the job description
3. Emphasizes matching skills and achievements
4. Maintains the original structure and formatting
5. Keeps all information truthful

Return the complete optimized CV in Markdown format.`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return response.content;
  }

  /**
   * Validate CV content against job description
   */
  async validateAgainstJD(params: {
    cv: string;
    jobDescription: string;
  }): Promise<{
    score: number;
    matches: string[];
    gaps: string[];
    suggestions: string[];
  }> {
    const systemPrompt = `You are a CV analysis expert. Analyze how well a CV matches a job description and provide structured feedback.`;

    const userPrompt = `Analyze this CV against the job description:

JOB DESCRIPTION:
${params.jobDescription}

CV:
${params.cv}

Provide analysis in JSON format:
{
  "score": <0-100>,
  "matches": ["list of strong matches"],
  "gaps": ["list of missing elements"],
  "suggestions": ["list of improvement suggestions"]
}`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error("Failed to parse validation response");
    }
  }

  /**
   * Extract structured information from job description
   */
  async extractJobInfo(jobDescription: string): Promise<{
    title: string;
    company?: string;
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    qualifications: string[];
    keywords: string[];
  }> {
    const systemPrompt = `You are an expert at analyzing job descriptions and extracting structured information.`;

    const userPrompt = `Extract key information from this job description:

${jobDescription}

Provide the analysis in JSON format:
{
  "title": "job title",
  "company": "company name if mentioned",
  "requiredSkills": ["list of required skills"],
  "preferredSkills": ["list of preferred/nice-to-have skills"],
  "responsibilities": ["list of key responsibilities"],
  "qualifications": ["list of required qualifications"],
  "keywords": ["important keywords for ATS"]
}`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error("Failed to parse job info extraction response");
    }
  }
}

/**
 * Create an LLM service instance
 */
export function createLLMService(config: LLMConfig): LLMService {
  return new LLMService(config);
}
