import type { FormattingRequirement, FormattingRule } from "./resource-loader";

export interface ValidationIssue {
  ruleId: string;
  severity: "error" | "warning" | "info";
  message: string;
  location?: {
    line?: number;
    column?: number;
    selector?: string;
  };
  autofix?: boolean;
  suggestedFix?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100
  summary: string;
}

export class FormattingVerifier {
  private requirements: FormattingRequirement;

  constructor(requirements: FormattingRequirement) {
    this.requirements = requirements;
  }

  /**
   * Verify compiled HTML against formatting requirements
   */
  async verify(html: string, markdown: string): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    for (const rule of this.requirements.rules) {
      const ruleIssues = await this.checkRule(rule, html, markdown);
      issues.push(...ruleIssues);
    }

    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    // Calculate score (errors -20 points, warnings -5 points)
    const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

    return {
      valid: errorCount === 0,
      issues,
      score,
      summary: this.generateSummary(issues),
    };
  }

  private async checkRule(
    rule: FormattingRule,
    html: string,
    markdown: string
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Basic checks based on rule description
    switch (rule.id) {
      case "max-length":
        issues.push(...this.checkMaxLength(rule, markdown));
        break;
      case "required-sections":
        issues.push(...this.checkRequiredSections(rule, markdown));
        break;
      case "bullet-points":
        issues.push(...this.checkBulletPoints(rule, markdown));
        break;
      case "action-verbs":
        issues.push(...this.checkActionVerbs(rule, markdown));
        break;
      case "quantifiable-achievements":
        issues.push(...this.checkQuantifiableAchievements(rule, markdown));
        break;
      case "contact-info":
        issues.push(...this.checkContactInfo(rule, markdown));
        break;
      case "date-format":
        issues.push(...this.checkDateFormat(rule, markdown));
        break;
      case "no-personal-pronouns":
        issues.push(...this.checkPersonalPronouns(rule, markdown));
        break;
      case "consistent-tense":
        issues.push(...this.checkConsistentTense(rule, markdown));
        break;
      case "line-length":
        issues.push(...this.checkLineLength(rule, markdown));
        break;
      default:
        // For custom rules, we'd need to use the LLM or custom validation logic
        break;
    }

    return issues;
  }

  private checkMaxLength(rule: FormattingRule, markdown: string): ValidationIssue[] {
    const lines = markdown.split("\n").filter((line) => line.trim().length > 0);
    const pageCount = Math.ceil(lines.length / 50); // Rough estimate

    if (pageCount > 2) {
      return [
        {
          ruleId: rule.id,
          severity: rule.severity,
          message: `Resume is too long (approximately ${pageCount} pages). Keep it to 1-2 pages.`,
          autofix: false,
        },
      ];
    }

    return [];
  }

  private checkRequiredSections(rule: FormattingRule, markdown: string): ValidationIssue[] {
    const requiredSections = [
      "experience",
      "education",
      "skills",
      "summary",
      "objective",
    ];
    const issues: ValidationIssue[] = [];

    for (const section of requiredSections) {
      const regex = new RegExp(`##\\s+${section}`, "i");
      if (!regex.test(markdown)) {
        // Check if at least one section exists
        const hasSummary = /##\s+(summary|objective)/i.test(markdown);
        if (section === "summary" || section === "objective") {
          if (!hasSummary) {
            issues.push({
              ruleId: rule.id,
              severity: "warning",
              message: "Missing summary or objective section",
              autofix: false,
            });
          }
        } else if (section === "experience" || section === "education") {
          if (!regex.test(markdown)) {
            issues.push({
              ruleId: rule.id,
              severity: rule.severity,
              message: `Missing ${section} section`,
              autofix: false,
            });
          }
        }
      }
    }

    return issues;
  }

  private checkBulletPoints(rule: FormattingRule, markdown: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = markdown.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("-") || line.startsWith("*")) {
        // Check if bullet point is too long
        if (line.length > 150) {
          issues.push({
            ruleId: rule.id,
            severity: "warning",
            message: `Bullet point too long at line ${i + 1}. Keep it under 150 characters.`,
            location: { line: i + 1 },
            autofix: false,
          });
        }

        // Check if it starts with an action verb
        const content = line.substring(1).trim();
        if (!/^[A-Z]/.test(content)) {
          issues.push({
            ruleId: rule.id,
            severity: "info",
            message: `Bullet point at line ${i + 1} should start with a capital letter.`,
            location: { line: i + 1 },
            autofix: true,
          });
        }
      }
    }

    return issues;
  }

  private checkActionVerbs(rule: FormattingRule, markdown: string): ValidationIssue[] {
    const actionVerbs = [
      "achieved",
      "improved",
      "developed",
      "created",
      "managed",
      "led",
      "designed",
      "implemented",
      "optimized",
      "increased",
      "reduced",
      "streamlined",
    ];

    const bulletPoints = markdown.match(/^[-*]\s+(.+)$/gm) || [];
    const issues: ValidationIssue[] = [];

    let actionVerbCount = 0;
    for (const bullet of bulletPoints) {
      const hasActionVerb = actionVerbs.some((verb) =>
        bullet.toLowerCase().includes(verb)
      );
      if (hasActionVerb) actionVerbCount++;
    }

    if (bulletPoints.length > 0 && actionVerbCount / bulletPoints.length < 0.5) {
      issues.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: "Use more action verbs in bullet points to show impact",
        autofix: false,
      });
    }

    return issues;
  }

  private checkQuantifiableAchievements(
    rule: FormattingRule,
    markdown: string
  ): ValidationIssue[] {
    const bulletPoints = markdown.match(/^[-*]\s+(.+)$/gm) || [];
    const issues: ValidationIssue[] = [];

    let quantifiedCount = 0;
    for (const bullet of bulletPoints) {
      // Check for numbers, percentages, or dollar amounts
      if (/\d+%|\$\d+|\d+\+|\d+x|by \d+/.test(bullet)) {
        quantifiedCount++;
      }
    }

    if (bulletPoints.length > 0 && quantifiedCount / bulletPoints.length < 0.3) {
      issues.push({
        ruleId: rule.id,
        severity: rule.severity,
        message:
          "Add more quantifiable achievements (numbers, percentages, metrics)",
        autofix: false,
      });
    }

    return issues;
  }

  private checkContactInfo(rule: FormattingRule, markdown: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const hasEmail = /@\w+\.\w+/.test(markdown);
    const hasPhone = /\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,9}/.test(markdown);

    if (!hasEmail) {
      issues.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: "Missing email address in contact information",
        autofix: false,
      });
    }

    if (!hasPhone) {
      issues.push({
        ruleId: rule.id,
        severity: "warning",
        message: "Missing phone number in contact information",
        autofix: false,
      });
    }

    return [];
  }

  private checkDateFormat(rule: FormattingRule, markdown: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = markdown.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for inconsistent date formats
      const hasMonthYear = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/.test(
        line
      );
      const hasYearOnly = /\b\d{4}\s*[-–]\s*\d{4}\b/.test(line);

      if (line.includes("20") && !hasMonthYear && !hasYearOnly) {
        // Potential date format issue
        const potentialDate = line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
        if (potentialDate) {
          issues.push({
            ruleId: rule.id,
            severity: "info",
            message: `Use consistent date format (e.g., "Jan 2024" or "2024") at line ${
              i + 1
            }`,
            location: { line: i + 1 },
            autofix: false,
          });
        }
      }
    }

    return issues;
  }

  private checkPersonalPronouns(rule: FormattingRule, markdown: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const pronouns = /\b(I|me|my|we|us|our)\b/gi;
    const matches = markdown.match(pronouns);

    if (matches && matches.length > 2) {
      issues.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: `Avoid personal pronouns (found ${matches.length} instances)`,
        autofix: false,
      });
    }

    return issues;
  }

  private checkConsistentTense(rule: FormattingRule, markdown: string): ValidationIssue[] {
    // This would require more sophisticated NLP analysis
    // For now, just check for common patterns
    const issues: ValidationIssue[] = [];

    const presentTenseVerbs = markdown.match(/\b(manage|lead|develop|create)s?\b/gi);
    const pastTenseVerbs = markdown.match(/\b(managed|led|developed|created)\b/gi);

    if (presentTenseVerbs && pastTenseVerbs) {
      const ratio =
        presentTenseVerbs.length / (presentTenseVerbs.length + pastTenseVerbs.length);
      if (ratio > 0.3 && ratio < 0.7) {
        issues.push({
          ruleId: rule.id,
          severity: "warning",
          message:
            "Inconsistent verb tense. Use past tense for previous roles, present for current role.",
          autofix: false,
        });
      }
    }

    return issues;
  }

  private checkLineLength(rule: FormattingRule, markdown: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = markdown.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 120 && !line.startsWith("#") && !line.startsWith("http")) {
        issues.push({
          ruleId: rule.id,
          severity: "info",
          message: `Line ${i + 1} is too long (${line.length} characters). Consider breaking it up.`,
          location: { line: i + 1 },
          autofix: false,
        });
      }
    }

    return issues;
  }

  private generateSummary(issues: ValidationIssue[]): string {
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const infoCount = issues.filter((i) => i.severity === "info").length;

    if (errorCount === 0 && warningCount === 0 && infoCount === 0) {
      return "All formatting checks passed!";
    }

    const parts: string[] = [];
    if (errorCount > 0) parts.push(`${errorCount} error(s)`);
    if (warningCount > 0) parts.push(`${warningCount} warning(s)`);
    if (infoCount > 0) parts.push(`${infoCount} suggestion(s)`);

    return `Found ${parts.join(", ")}`;
  }

  /**
   * Get all rules
   */
  getRules(): FormattingRule[] {
    return this.requirements.rules;
  }

  /**
   * Get rule by ID
   */
  getRule(id: string): FormattingRule | undefined {
    return this.requirements.rules.find((r) => r.id === id);
  }
}

/**
 * Create a formatting verifier with default requirements
 */
export function createDefaultVerifier(): FormattingVerifier {
  const defaultRequirements: FormattingRequirement = {
    name: "standard",
    description: "Standard professional resume formatting requirements",
    rules: [
      {
        id: "max-length",
        description: "Resume should be 1-2 pages maximum",
        severity: "warning",
        check: "page-count",
        autofix: false,
      },
      {
        id: "required-sections",
        description: "Must include key sections (experience, education, skills)",
        severity: "error",
        check: "section-headers",
        autofix: false,
      },
      {
        id: "bullet-points",
        description: "Use bullet points for experience items",
        severity: "warning",
        check: "list-items",
        autofix: false,
      },
      {
        id: "action-verbs",
        description: "Start bullet points with action verbs",
        severity: "info",
        check: "verb-usage",
        autofix: false,
      },
      {
        id: "quantifiable-achievements",
        description: "Include quantifiable achievements with numbers",
        severity: "info",
        check: "metrics",
        autofix: false,
      },
      {
        id: "contact-info",
        description: "Include complete contact information",
        severity: "error",
        check: "contact-fields",
        autofix: false,
      },
      {
        id: "date-format",
        description: "Use consistent date format",
        severity: "info",
        check: "date-consistency",
        autofix: true,
      },
      {
        id: "no-personal-pronouns",
        description: "Avoid using personal pronouns (I, me, my)",
        severity: "warning",
        check: "pronoun-usage",
        autofix: false,
      },
      {
        id: "consistent-tense",
        description: "Use consistent verb tense (past for previous roles)",
        severity: "warning",
        check: "verb-tense",
        autofix: false,
      },
      {
        id: "line-length",
        description: "Keep lines reasonably short for readability",
        severity: "info",
        check: "line-width",
        autofix: false,
      },
    ],
  };

  return new FormattingVerifier(defaultRequirements);
}
