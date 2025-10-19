import { readFile } from "fs/promises";
import { join, extname, basename } from "path";
import { glob } from "glob";

export interface CVTemplate {
  name: string;
  description: string;
  markdown: string;
  css: string;
  styles: Record<string, any>;
  metadata?: {
    industry?: string[];
    level?: string[];
    type?: string;
  };
}

export interface FormattingRequirement {
  name: string;
  rules: FormattingRule[];
  description?: string;
}

export interface FormattingRule {
  id: string;
  description: string;
  severity: "error" | "warning" | "info";
  check: string; // XPath, selector, or description for LLM to check
  autofix?: boolean;
}

export interface ResourceConfig {
  templatesPath: string;
  requirementsPath: string;
  promptsPath: string;
}

export class ResourceLoader {
  private config: ResourceConfig;
  private templates: Map<string, CVTemplate> = new Map();
  private requirements: Map<string, FormattingRequirement> = new Map();
  private prompts: Map<string, string> = new Map();

  constructor(config: ResourceConfig) {
    this.config = config;
  }

  /**
   * Load all resources from configured paths
   */
  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadTemplates(),
      this.loadRequirements(),
      this.loadPrompts(),
    ]);
  }

  /**
   * Load CV templates from the templates directory
   */
  async loadTemplates(): Promise<void> {
    try {
      const pattern = join(this.config.templatesPath, "**/*.json");
      const files = await glob(pattern);

      for (const file of files) {
        const content = await readFile(file, "utf-8");
        const template = JSON.parse(content) as CVTemplate;
        const name = basename(file, ".json");
        template.name = template.name || name;
        this.templates.set(name, template);
      }

      console.log(`Loaded ${this.templates.size} CV templates`);
    } catch (error) {
      console.error("Error loading templates:", error);
      throw error;
    }
  }

  /**
   * Load formatting requirements
   */
  async loadRequirements(): Promise<void> {
    try {
      const pattern = join(this.config.requirementsPath, "**/*.json");
      const files = await glob(pattern);

      for (const file of files) {
        const content = await readFile(file, "utf-8");
        const requirement = JSON.parse(content) as FormattingRequirement;
        const name = basename(file, ".json");
        requirement.name = requirement.name || name;
        this.requirements.set(name, requirement);
      }

      console.log(`Loaded ${this.requirements.size} formatting requirement sets`);
    } catch (error) {
      console.error("Error loading requirements:", error);
      throw error;
    }
  }

  /**
   * Load prompt templates for LLM interactions
   */
  async loadPrompts(): Promise<void> {
    try {
      const pattern = join(this.config.promptsPath, "**/*.{txt,md}");
      const files = await glob(pattern);

      for (const file of files) {
        const content = await readFile(file, "utf-8");
        const name = basename(file, extname(file));
        this.prompts.set(name, content);
      }

      console.log(`Loaded ${this.prompts.size} prompt templates`);
    } catch (error) {
      console.error("Error loading prompts:", error);
      throw error;
    }
  }

  /**
   * Get a specific template by name
   */
  getTemplate(name: string): CVTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): CVTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates filtered by metadata
   */
  getTemplatesByFilter(filter: {
    industry?: string;
    level?: string;
    type?: string;
  }): CVTemplate[] {
    return this.getAllTemplates().filter((template) => {
      if (!template.metadata) return false;

      if (filter.industry && !template.metadata.industry?.includes(filter.industry)) {
        return false;
      }
      if (filter.level && !template.metadata.level?.includes(filter.level)) {
        return false;
      }
      if (filter.type && template.metadata.type !== filter.type) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get formatting requirements by name
   */
  getRequirements(name: string): FormattingRequirement | undefined {
    return this.requirements.get(name);
  }

  /**
   * Get all formatting requirements
   */
  getAllRequirements(): FormattingRequirement[] {
    return Array.from(this.requirements.values());
  }

  /**
   * Get a prompt template by name
   */
  getPrompt(name: string, variables?: Record<string, string>): string | undefined {
    let prompt = this.prompts.get(name);

    if (prompt && variables) {
      // Replace variables in the prompt
      for (const [key, value] of Object.entries(variables)) {
        prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }
    }

    return prompt;
  }

  /**
   * Get all available prompt names
   */
  getAvailablePrompts(): string[] {
    return Array.from(this.prompts.keys());
  }

  /**
   * Reload all resources
   */
  async reload(): Promise<void> {
    this.templates.clear();
    this.requirements.clear();
    this.prompts.clear();
    await this.loadAll();
  }
}

/**
 * Create a resource loader with default paths
 */
export function createResourceLoader(basePath: string = process.cwd()): ResourceLoader {
  const config: ResourceConfig = {
    templatesPath: join(basePath, "resources", "templates"),
    requirementsPath: join(basePath, "resources", "requirements"),
    promptsPath: join(basePath, "resources", "prompts"),
  };

  return new ResourceLoader(config);
}
