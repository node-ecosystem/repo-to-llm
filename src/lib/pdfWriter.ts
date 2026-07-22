const PAGE_WIDTH = 612   // Letter size, points
const PAGE_HEIGHT = 792
const MARGIN = 40
const FONT_SIZE = 9
const LINE_HEIGHT = FONT_SIZE * 1.25
const CHAR_WIDTH = FONT_SIZE * 0.6 // approx width for Courier monospace

export interface FileData {
  header: string
  content: string
}

export function generatePDF(filesData: FileData[]): Buffer {
  const maxCharsPerLine = Math.floor((PAGE_WIDTH - MARGIN * 2) / CHAR_WIDTH)
  const maxLinesPerPage = Math.floor((PAGE_HEIGHT - MARGIN * 2) / LINE_HEIGHT)

  const allLines: string[] = []
  for (const file of filesData) {
    allLines.push(`→ ${file.header}`, '')
    for (const rl of file.content.split('\n')) {
      const sanitized = sanitize(rl)
      if (sanitized.length === 0) {
        allLines.push('')
        continue
      }
      for (let i = 0; i < sanitized.length; i += maxCharsPerLine)
        allLines.push(sanitized.slice(i, i + maxCharsPerLine))
    }
    allLines.push('', '')
  }

  if (allLines.length === 0) allLines.push('(no content found)')

  const pages: string[][] = []
  for (let i = 0; i < allLines.length; i += maxLinesPerPage)
    pages.push(allLines.slice(i, i + maxLinesPerPage))
  return buildPdfBuffer(pages)
}

function sanitize(line: string): string {
  return line
    .replaceAll('\t', ' ')
    .split('')
    .filter(ch => {
      const code = ch.codePointAt(0)!
      return code >= 32 && code <= 126 // printable ASCII only
    })
    .join('')
}

function escapePdfText(str: string): string {
  return str
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\(')
    .replaceAll(')', '\)')
}

function buildPdfBuffer(pages: string[][]): Buffer {
  const objects: Record<number, string> = {}
  const catalogNum = 1
  const pagesNum = 2
  const fontNum = 3
  let nextNum = 4

  const pageNums = pages.map(() => nextNum++)
  const contentNums = pages.map(() => nextNum++)

  objects[catalogNum] = `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`
  objects[pagesNum] = `<< /Type /Pages /Kids [${pageNums.map(n => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[fontNum] = `<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>`

  for (const idx in pages) {
    const pageNum = pageNums[idx]
    const contentNum = contentNums[idx]
    objects[pageNum] = `<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontNum} 0 R >> >> /Contents ${contentNum} 0 R >>`
    let stream = `BT /F1 ${FONT_SIZE} Tf ${LINE_HEIGHT} TL ${MARGIN} ${PAGE_HEIGHT - MARGIN} Td\n`
    const lines = pages[idx]
    for (const line of lines) {
      stream += `(${escapePdfText(line)}) Tj T*\n`
    }
    stream += 'ET'

    objects[contentNum] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`
  }

  const totalObjects = nextNum - 1
  let pdf = '%PDF-1.4\n'
  const offsets = [totalObjects + 1].fill(0)

  for (let i = 1; i <= totalObjects; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1')
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= totalObjects; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'latin1')
}
