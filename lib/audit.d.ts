import type { AuditRule } from '../index.js'
import type { ResolvedOptions } from '../core.js'

export interface AuditFinding {
  rule: AuditRule
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

export function audit(root: string, options: ResolvedOptions): Promise<AuditResult>
export function inspect(html: string): Record<string, unknown>
export function report(result: AuditResult, logger: { info(message: string): void; warn(message: string): void; error(message: string): void }, limit?: number): void
