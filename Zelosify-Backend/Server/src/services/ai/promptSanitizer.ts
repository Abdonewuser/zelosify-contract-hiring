/**
 * Prompt Sanitizer and Injection Mitigator
 * Strictly mitigates prompt injection risks from untrusted resume content.
 */

// Known adversarial prompt injection patterns
const ADVERSARIAL_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /system\s*prompt\s*override/gi,
  /you\s+are\s+now\s+(an?\s+)?unrestricted/gi,
  /output\s+only\s+recommended\s*:\s*true/gi,
  /set\s+score\s+to\s+1(\.0)?/gi,
  /always\s+return\s+true/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<\/?system>/gi,
  /<\/?human>/gi,
  /<\/?assistant>/gi,
  /\[SYSTEM_INSTRUCTION\]/gi,
  /\[ROLE:\s*ADMIN\]/gi,
];

/**
 * Sanitizes untrusted text extracted from candidate resumes (PDF/PPTX)
 * before any LLM ingestion.
 */
export function sanitizeResumeContent(rawContent: string, maxLength: number = 8000): string {
  if (!rawContent || typeof rawContent !== "string") {
    return "";
  }

  // 1. Normalize line endings and non-printable control characters
  let sanitized = rawContent
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 2. Strip adversarial injection markers
  for (const pattern of ADVERSARIAL_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[FILTERED_SUSPICIOUS_CONTENT]");
  }

  // 3. Prevent delimiter breaking (fenced codeblocks or custom XML tags)
  sanitized = sanitized
    .replace(/```/g, "'''")
    .replace(/<{2,}/g, "<")
    .replace(/>{2,}/g, ">");

  // 4. Bound max length to avoid token denial of service
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + "\n...[TRUNCATED]";
  }

  return sanitized.trim();
}

/**
 * Validates that sanitized text does not contain active prompt injection vectors
 */
export function containsInjectionThreat(content: string): boolean {
  if (!content) return false;
  return ADVERSARIAL_PATTERNS.some((pattern) => pattern.test(content));
}
