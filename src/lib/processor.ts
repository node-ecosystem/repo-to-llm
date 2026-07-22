export interface ProcessOptions {
  removeComments?: boolean
  normalizeWhitespace?: boolean
  ext?: string
}

export function processContent(text: string, options: ProcessOptions = {}): string {
  let result = text

  if (options.removeComments) {
    result = stripComments(result, options.ext)
  }

  if (options.normalizeWhitespace) {
    result = result.replaceAll(/[ \t\f\v]+/g, ' ')   // collapse spaces/tabs
    result = result.replaceAll(/\s+/g, ' ')           // collapse ALL whitespace (incl. newlines) to one space
    result = result.trim()
  }

  return result
}

// Best-effort, language-agnostic comment stripper.
// Handles // and /* */ (C-like languages) and # (Python/Shell/YAML/Ruby),
// while trying not to strip inside string literals.
function stripComments(code: string, ext?: string): string {
  const hashCommentExts = ['.py', '.rb', '.sh', '.yml', '.yaml', '.pl', '.r']
  const useHash = ext ? hashCommentExts.includes(ext) : false

  let output = ''
  let i = 0
  const n = code.length
  let inString: string | null = null

  while (i < n) {
    const c = code[i]
    const next = code[i + 1]

    if (inString) {
      output += c
      if (c === '\\' && inString !== '`') {
        output += next ?? ''
        i += 2
        continue
      }
      if (c === inString) inString = null
      i++
      continue
    }

    if (c === '"' || c === "'" || c === '`') {
      inString = c
      output += c
      i++
      continue
    }

    if (c === '/' && next === '/') {
      while (i < n && code[i] !== '\n') i++
      continue
    }

    if (c === '/' && next === '*') {
      i += 2
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      continue
    }

    if (useHash && c === '#') {
      while (i < n && code[i] !== '\n') i++
      continue
    }

    output += c
    i++
  }

  return output
}
