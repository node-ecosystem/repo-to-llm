import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { scanRepository } from './lib/scanner.ts'
import { processContent } from './lib/processor.ts'
import { generatePDF } from './lib/pdfWriter.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const MAX_FILE_SIZE = 2 * 1024 * 1024 // skip files bigger than 2MB

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      const html = await fs.readFile(path.join(__dirname, 'public', 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
      return
    }

    if (req.method === 'POST' && req.url === '/generate') {
      let body = ''
      for await (const chunk of req) body += chunk
      const params = new URLSearchParams(body)
      const repoPath = params.get('repoPath')?.trim()
      if (!repoPath || !existsSync(repoPath)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Invalid or missing repository path')
        return
      }

      const ignoreExtensions = (params.get('ignoreExtensions') || '').split(',').map(s => s.trim()).filter(Boolean)
      const ignoreFolders = (params.get('ignoreFolders') || '').split(',').map(s => s.trim()).filter(Boolean)
      const ignoreStart = (params.get('ignoreStart') || '').split(',').map(s => s.trim()).filter(Boolean)
      const files = await scanRepository(repoPath, { ignoreExtensions, ignoreFolders, ignoreStart })

      const filesData: Array<{ header: string; content: string }> = []
      const removeComments = params.get('removeComments') === 'on'
      const normalizeWhitespace = params.get('normalizeWhitespace') === 'on'
      for (const filePath of files) {
        try {
          const stat = await fs.stat(filePath)
          if (stat.size > MAX_FILE_SIZE) continue // skip huge files

          const raw = await fs.readFile(filePath, 'utf8')
          const relative = path.relative(repoPath, filePath)
          const processed = processContent(raw, {
            removeComments,
            normalizeWhitespace,
            ext: path.extname(filePath).toLowerCase()
          })
          filesData.push({ header: relative, content: processed })
        } catch { /* binary or unreadable file, skip silently */ }
      }

      const pdfBuffer = generatePDF(filesData)

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="repository.pdf"'
      })
      res.end(pdfBuffer)
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  } catch (error: unknown) {
    console.error(error)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.end('Server error: ' + errorMessage)
  }
})

server.listen(PORT, () => {
  console.log(`GUI ready → http://localhost:${PORT}`)
})
