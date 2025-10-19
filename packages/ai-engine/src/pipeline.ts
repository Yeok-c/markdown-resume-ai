import type { LLMService } from "./llm-service";
import type { FormattingVerifier } from "./formatting-verifier";
import type { ResourceLoader } from "./resource-loader";

// Simple markdown to HTML converter (can be replaced with site's renderMarkdown when available)
function renderMarkdown(markdown: string): string {
  // Basic conversion - in production, use the site's full markdown renderer
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

export interface PipelineConfig {
  llmService: LLMService;
  verifier: FormattingVerifier;
  resourceLoader: ResourceLoader;
}

export interface JobDescription {
  title: string;
  company?: string;
  description: string;
  requirements: string;
  url?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  summary?: string;
}

export interface GenerationOptions {
  templateName?: string;
  requirementsName?: string;
  iterations?: number;
  targetScore?: number;
}

export interface PipelineResult {
  success: boolean;
  markdown: string;
  html: string;
  validation: {
    score: number;
    issues: any[];
    summary: string;
  };
  jdMatch: {
    score: number;
    matches: string[];
    gaps: string[];
    suggestions: string[];
  };
  iterations: number;
  metadata: {
    template: string;
    requirements: string;
    timestamp: string;
  };
}

export class ResumeGenerationPipeline {
  private config: PipelineConfig;

  constructor(config: PipelineConfig) {
    this.config = config;
  }

  /**
   * Main pipeline: Generate optimized resume from JD and user profile
   */
  async generate(
    jobDescription: JobDescription,
    userProfile: UserProfile,
    options: GenerationOptions = {}
  ): Promise<PipelineResult> {
    const {
      templateName = "default",
      requirementsName = "standard",
      iterations = 3,
      targetScore = 80,
    } = options;

    console.log("Starting resume generation pipeline...");

    // Step 1: Load resources
    const template = this.config.resourceLoader.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Step 2: Extract job information using LLM
    console.log("Extracting job information...");
    const jobInfo = await this.config.llmService.extractJobInfo(
      jobDescription.description
    );

    // Step 3: Generate initial CV content
    console.log("Generating initial CV content...");
    let markdown = await this.config.llmService.generateCVContent({
      jobDescription: jobDescription.description,
      userProfile: this.formatUserProfile(userProfile),
      template: template.markdown,
      instructions: `Focus on these key requirements: ${jobInfo.requiredSkills.join(", ")}`,
    });

    // Step 4: Iterative optimization loop
    let bestMarkdown = markdown;
    let bestScore = 0;
    let currentIteration = 0;

    for (let i = 0; i < iterations; i++) {
      currentIteration = i + 1;
      console.log(`Optimization iteration ${currentIteration}/${iterations}...`);

      // Compile to HTML
      const html = renderMarkdown(markdown);

      // Verify formatting
      const validation = await this.config.verifier.verify(html, markdown);

      // Validate against JD
      const jdMatch = await this.config.llmService.validateAgainstJD({
        cv: markdown,
        jobDescription: jobDescription.description,
      });

      // Calculate combined score
      const combinedScore = (validation.score + jdMatch.score) / 2;

      console.log(
        `Iteration ${currentIteration}: Formatting=${validation.score}, JD Match=${jdMatch.score}, Combined=${combinedScore}`
      );

      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestMarkdown = markdown;
      }

      // If we've reached the target, stop early
      if (combinedScore >= targetScore) {
        console.log(`Target score reached at iteration ${currentIteration}`);
        break;
      }

      // If not the last iteration, optimize further
      if (i < iterations - 1) {
        const focusAreas = [
          ...validation.issues.map((issue) => issue.message),
          ...jdMatch.suggestions,
        ];

        markdown = await this.config.llmService.optimizeCVForJob({
          currentCV: markdown,
          jobDescription: jobDescription.description,
          focusAreas: focusAreas.slice(0, 5), // Top 5 issues
        });
      }
    }

    // Final compilation and validation
    const finalHtml = renderMarkdown(bestMarkdown);
    const finalValidation = await this.config.verifier.verify(finalHtml, bestMarkdown);
    const finalJDMatch = await this.config.llmService.validateAgainstJD({
      cv: bestMarkdown,
      jobDescription: jobDescription.description,
    });

    console.log("Pipeline completed successfully!");

    return {
      success: true,
      markdown: bestMarkdown,
      html: finalHtml,
      validation: {
        score: finalValidation.score,
        issues: finalValidation.issues,
        summary: finalValidation.summary,
      },
      jdMatch: finalJDMatch,
      iterations: currentIteration,
      metadata: {
        template: templateName,
        requirements: requirementsName,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Optimize an existing resume for a job
   */
  async optimize(
    existingMarkdown: string,
    jobDescription: JobDescription,
    options: GenerationOptions = {}
  ): Promise<PipelineResult> {
    const {
      requirementsName = "standard",
      iterations = 2,
      targetScore = 85,
    } = options;

    console.log("Starting resume optimization pipeline...");

    let markdown = existingMarkdown;
    let bestMarkdown = markdown;
    let bestScore = 0;
    let currentIteration = 0;

    for (let i = 0; i < iterations; i++) {
      currentIteration = i + 1;
      console.log(`Optimization iteration ${currentIteration}/${iterations}...`);

      const html = renderMarkdown(markdown);
      const validation = await this.config.verifier.verify(html, markdown);
      const jdMatch = await this.config.llmService.validateAgainstJD({
        cv: markdown,
        jobDescription: jobDescription.description,
      });

      const combinedScore = (validation.score + jdMatch.score) / 2;

      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestMarkdown = markdown;
      }

      if (combinedScore >= targetScore) {
        break;
      }

      if (i < iterations - 1) {
        markdown = await this.config.llmService.optimizeCVForJob({
          currentCV: markdown,
          jobDescription: jobDescription.description,
          focusAreas: jdMatch.suggestions.slice(0, 5),
        });
      }
    }

    const finalHtml = renderMarkdown(bestMarkdown);
    const finalValidation = await this.config.verifier.verify(finalHtml, bestMarkdown);
    const finalJDMatch = await this.config.llmService.validateAgainstJD({
      cv: bestMarkdown,
      jobDescription: jobDescription.description,
    });

    return {
      success: true,
      markdown: bestMarkdown,
      html: finalHtml,
      validation: {
        score: finalValidation.score,
        issues: finalValidation.issues,
        summary: finalValidation.summary,
      },
      jdMatch: finalJDMatch,
      iterations: currentIteration,
      metadata: {
        template: "existing",
        requirements: requirementsName,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Just validate an existing resume against JD
   */
  async validate(
    markdown: string,
    jobDescription: JobDescription
  ): Promise<{
    validation: any;
    jdMatch: any;
  }> {
    const html = renderMarkdown(markdown);
    const validation = await this.config.verifier.verify(html, markdown);
    const jdMatch = await this.config.llmService.validateAgainstJD({
      cv: markdown,
      jobDescription: jobDescription.description,
    });

    return {
      validation,
      jdMatch,
    };
  }

  private formatUserProfile(profile: UserProfile): string {
    let formatted = `# ${profile.name}\n\n`;

    formatted += `**Contact:** ${profile.email}`;
    if (profile.phone) formatted += ` | ${profile.phone}`;
    formatted += "\n\n";

    if (profile.summary) {
      formatted += `## Summary\n\n${profile.summary}\n\n`;
    }

    formatted += `## Experience\n\n`;
    for (const exp of profile.experience) {
      formatted += `### ${exp.title} at ${exp.company}\n`;
      formatted += `*${exp.duration}*\n\n`;
      for (const achievement of exp.achievements) {
        formatted += `- ${achievement}\n`;
      }
      formatted += "\n";
    }

    formatted += `## Education\n\n`;
    for (const edu of profile.education) {
      formatted += `**${edu.degree}** - ${edu.institution} (${edu.year})\n\n`;
    }

    formatted += `## Skills\n\n`;
    formatted += profile.skills.join(" • ");
    formatted += "\n";

    return formatted;
  }
}

/**
 * Create a resume generation pipeline
 */
export function createPipeline(config: PipelineConfig): ResumeGenerationPipeline {
  return new ResumeGenerationPipeline(config);
}
