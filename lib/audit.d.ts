export interface AuditFinding {
  rule: string
  level: 'error' | 'warn'
  path: string
  message: string
}

export interface AuditResult {
  pages: number
  findings: AuditFinding[]
  errors: number
  warnings: number
}

export function audit(root: string, options: unknown): Promise<AuditResult>
export function inspect(html: string): Record<string, unknown>
export function report(result: AuditResult, logger: { info(message: string): void; warn(message: string): void; error(message: string): void }, limit?: number): void
