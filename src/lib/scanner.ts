import fs from 'node:fs/promises'
import path from 'node:path'
import type { Dirent } from 'node:fs'

const DEFAULT_IGNORE_FOLDERS = [
  'node_modules', '.yarn', '.git', '.svn', 'dist', 'build', '.next', '.cache', '.idea', '.vscode'
]

const DEFAULT_IGNORE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.pdf', '.zip', '.tar', '.gz',
  '.exe', '.dll', '.so', '.dylib', '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.mp3', '.mov', '.class', '.jar', '.lock', '.yml'
]

const DEFAULT_IGNORE_FILES = [
  '.gitignore', '.gitattributes', '.DS_Store', '.npmignore', '.editorconfig', 'LICENSE'
]

const DEFAULT_IGNORE_START = [
  '.pnp', '.env'
]

export interface ScanOptions {
  ignoreFolders?: string[]
  ignoreExtensions?: string[]
  ignoreStart?: string[]
  ignoreFiles?: string[]
}

function normalizeExt(ext: string): string {
  if (!ext) return ext
  if (ext.startsWith('*.')) ext = ext.slice(1)
  if (!ext.startsWith('.')) ext = '.' + ext
  return ext.toLowerCase()
}

export async function scanRepository(rootDir: string, options: ScanOptions = {}): Promise<string[]> {
  const ignoreFolders = new Set([...DEFAULT_IGNORE_FOLDERS, ...(options.ignoreFolders || [])])
  const ignoreExtensions = new Set([
    ...DEFAULT_IGNORE_EXTENSIONS,
    ...(options.ignoreExtensions || []).map((element) => normalizeExt(element))
  ])
  const ignoreFiles = new Set([...DEFAULT_IGNORE_FILES, ...(options.ignoreFiles || [])])
  const ignoreStart = [...DEFAULT_IGNORE_START, ...(options.ignoreStart || [])]

  const results: string[] = []

  async function walk(dir: string): Promise<void> {
    let entries: Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch { return }

    for (const entry of entries) {
      if (ignoreStart.some(prefix => entry.name.startsWith(prefix))) continue
      if (entry.isDirectory()) {
        if (ignoreFolders.has(entry.name)) continue
        await walk(path.join(dir, entry.name))
      } else if (entry.isFile()) {
        if (ignoreFiles.has(entry.name)) continue
        const ext = path.extname(entry.name).toLowerCase()
        if (ignoreExtensions.has(ext)) continue
        results.push(path.join(dir, entry.name))
      }
    }
  }

  await walk(rootDir)
  return results.toSorted((a, b) => a.localeCompare(b))
}
