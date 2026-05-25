import DOMPurify from 'dompurify'
import { Marked } from 'marked'

export type MarkdownIssueSeverity = 'error' | 'warning'

export interface MarkdownIssue {
  line?: number
  severity: MarkdownIssueSeverity
  /** i18n key under fragments.compose */
  messageKey: string
}

const md = new Marked({ gfm: true, breaks: true })

const FENCE_LINE_RE = /^(```+|~~~+)/
const IMAGE_LINE_UNCLOSED_RE = /!\[[^\]]*\]\([^)]*$/
const IMAGE_MALFORMED_RE = /!\[[^\]]*\](?!\()/
const LINK_LINE_UNCLOSED_RE = /\[[^\]]*\]\([^)]*$/

export function validateMarkdown(source: string): MarkdownIssue[] {
  const issues: MarkdownIssue[] = []
  const text = source.trim()
  if (!text) return issues

  const lines = source.split('\n')
  let fenceCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (FENCE_LINE_RE.test(trimmed)) {
      fenceCount++
    }

    if (IMAGE_LINE_UNCLOSED_RE.test(line)) {
      issues.push({ line: i + 1, severity: 'error', messageKey: 'markdownIssueImageUnclosed' })
    } else if (IMAGE_MALFORMED_RE.test(line)) {
      issues.push({ line: i + 1, severity: 'error', messageKey: 'markdownIssueImageMalformed' })
    }

    const withoutImages = line.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    if (LINK_LINE_UNCLOSED_RE.test(withoutImages)) {
      issues.push({ line: i + 1, severity: 'error', messageKey: 'markdownIssueLinkUnclosed' })
    }

    if (!FENCE_LINE_RE.test(trimmed)) {
      const ticks = (line.match(/`/g) || []).length
      if (ticks % 2 !== 0) {
        issues.push({ line: i + 1, severity: 'warning', messageKey: 'markdownIssueInlineCode' })
      }
    }
  }

  if (fenceCount % 2 !== 0) {
    issues.push({ severity: 'error', messageKey: 'markdownIssueFenceUnclosed' })
  }

  return issues
}

export function renderMarkdownHtml(source: string): string {
  const raw = source.trim()
  if (!raw) return ''
  try {
    const parsed = md.parse(raw, { async: false }) as string
    return DOMPurify.sanitize(parsed)
  } catch {
    return ''
  }
}

export function hasMarkdownErrors(issues: MarkdownIssue[]): boolean {
  return issues.some((item) => item.severity === 'error')
}

/** 列表卡片摘要：取首段 Markdown 源（与后端 import 逻辑近似） */
export function extractSummaryMarkdown(source: string): string {
  const lines = source.split('\n')
  const block: string[] = []
  let started = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (started) break
      continue
    }
    if (!started && (trimmed.startsWith('#') || trimmed.startsWith('!['))) continue
    block.push(line)
    started = true
  }

  return block.join('\n').trim()
}

/** @deprecated 仅用于纯文本场景 */
export function extractPlainSummary(source: string, maxLen = 280): string {
  const mdChunk = extractSummaryMarkdown(source)
  if (!mdChunk) return ''
  const plain = mdChunk
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .trim()
  return plain.slice(0, maxLen)
}

export interface MarkdownPreviewResult {
  html: string
  summaryHtml: string
  issues: MarkdownIssue[]
  hasErrors: boolean
}

export function buildMarkdownPreview(source: string): MarkdownPreviewResult {
  const issues = validateMarkdown(source)
  const html = renderMarkdownHtml(source)
  const summaryHtml = renderMarkdownHtml(extractSummaryMarkdown(source))
  return {
    html,
    summaryHtml,
    issues,
    hasErrors: hasMarkdownErrors(issues),
  }
}
