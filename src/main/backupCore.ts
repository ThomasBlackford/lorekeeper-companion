import {
  closeSync, copyFileSync, existsSync, fstatSync, mkdirSync, openSync, readSync, writeSync
} from 'fs'
import { basename, join } from 'path'

// A LoreKeeper backup is ONE file holding the database snapshot plus every
// image the data points at, so restoring on a new PC doesn't leave broken
// map/portrait paths behind.
//
//   "LKBACKUP1\n"            10 bytes   magic
//   uint32 LE                 4 bytes   manifest length
//   manifest JSON                       { app, v, createdAt, dbSize, files:[{orig,name,size}] }
//   database bytes
//   file bytes, in manifest order
//
// Deliberately dependency-free (no zip library) and pure fs — no Electron — so
// the same code is unit-testable from plain Node.

const MAGIC = 'LKBACKUP1\n'
const CHUNK = 4 * 1024 * 1024

export interface BackupFileEntry {
  orig: string // the path as stored in the database
  name: string
  size: number
}

export interface BackupManifest {
  app: 'lorekeeper-dm' | 'lorekeeper-companion'
  v: 1
  createdAt: string
  dbSize: number
  files: BackupFileEntry[]
}

function copyRange(srcFd: number, dstFd: number, length: number): void {
  const buf = Buffer.allocUnsafe(Math.min(CHUNK, Math.max(1, length)))
  let left = length
  while (left > 0) {
    const n = readSync(srcFd, buf, 0, Math.min(buf.length, left), null)
    if (n <= 0) throw new Error('Unexpected end of file while copying')
    let off = 0
    while (off < n) off += writeSync(dstFd, buf, off, n - off)
    left -= n
  }
}

export function writeBackup(
  dest: string,
  dbSnapshotPath: string,
  mediaPaths: string[],
  app: BackupManifest['app']
): BackupManifest {
  // Only embed files that actually exist; de-duplicate by path.
  const files: BackupFileEntry[] = []
  const seen = new Set<string>()
  for (const p of mediaPaths) {
    if (!p || seen.has(p)) continue
    seen.add(p)
    try {
      if (!existsSync(p)) continue
      const fd = openSync(p, 'r')
      const size = fstatSync(fd).size
      closeSync(fd)
      files.push({ orig: p, name: basename(p), size })
    } catch { /* unreadable → skipped */ }
  }

  const dbFd = openSync(dbSnapshotPath, 'r')
  const dbSize = fstatSync(dbFd).size
  const manifest: BackupManifest = { app, v: 1, createdAt: new Date().toISOString(), dbSize, files }
  const manifestBuf = Buffer.from(JSON.stringify(manifest), 'utf8')

  const out = openSync(dest, 'w')
  try {
    writeSync(out, Buffer.from(MAGIC, 'utf8'))
    const len = Buffer.alloc(4)
    len.writeUInt32LE(manifestBuf.length, 0)
    writeSync(out, len)
    writeSync(out, manifestBuf)
    copyRange(dbFd, out, dbSize)
    for (const f of files) {
      const fd = openSync(f.orig, 'r')
      try {
        copyRange(fd, out, f.size)
      } finally {
        closeSync(fd)
      }
    }
  } finally {
    closeSync(dbFd)
    closeSync(out)
  }
  return manifest
}

export interface ExtractResult {
  manifest: BackupManifest
  // original path → where it now lives on this machine
  pathMap: Record<string, string>
}

// Unpacks a backup: writes the database snapshot to `dbOut` and every image
// into `mediaDir` (renamed so nothing collides), returning the path mapping so
// the caller can repoint the restored database at the new locations.
export function extractBackup(src: string, dbOut: string, mediaDir: string): ExtractResult {
  const fd = openSync(src, 'r')
  try {
    const magic = Buffer.alloc(MAGIC.length)
    if (readSync(fd, magic, 0, magic.length, 0) !== magic.length || magic.toString('utf8') !== MAGIC) {
      throw new Error("That file isn't a LoreKeeper backup.")
    }
    const lenBuf = Buffer.alloc(4)
    readSync(fd, lenBuf, 0, 4, MAGIC.length)
    const manifestLen = lenBuf.readUInt32LE(0)
    if (manifestLen <= 0 || manifestLen > 64 * 1024 * 1024) throw new Error('The backup header is damaged.')
    const manifestBuf = Buffer.alloc(manifestLen)
    readSync(fd, manifestBuf, 0, manifestLen, MAGIC.length + 4)
    const manifest = JSON.parse(manifestBuf.toString('utf8')) as BackupManifest
    if (manifest.v !== 1 || !Array.isArray(manifest.files)) throw new Error('Unsupported backup version.')

    const total = fstatSync(fd).size
    const expected = MAGIC.length + 4 + manifestLen + manifest.dbSize + manifest.files.reduce((n, f) => n + f.size, 0)
    if (total < expected) throw new Error('The backup file is incomplete (cut off while saving or copying).')

    // readSync with a position doesn't move the cursor, so seek by re-reading
    // sequentially from `pos` using positional reads.
    let pos = MAGIC.length + 4 + manifestLen
    const copyFromPos = (dstPath: string, length: number): void => {
      const dst = openSync(dstPath, 'w')
      try {
        const buf = Buffer.allocUnsafe(Math.min(CHUNK, Math.max(1, length)))
        let left = length
        while (left > 0) {
          const n = readSync(fd, buf, 0, Math.min(buf.length, left), pos)
          if (n <= 0) throw new Error('Unexpected end of backup')
          let off = 0
          while (off < n) off += writeSync(dst, buf, off, n - off)
          pos += n
          left -= n
        }
      } finally {
        closeSync(dst)
      }
    }

    copyFromPos(dbOut, manifest.dbSize)

    mkdirSync(mediaDir, { recursive: true })
    const pathMap: Record<string, string> = {}
    const stamp = Date.now()
    manifest.files.forEach((f, i) => {
      // Never trust a name from the file: keep only a basename.
      const safe = basename(f.name).replace(/[^\w.\- ]/g, '_') || 'file'
      const target = join(mediaDir, `restored-${stamp}-${i}-${safe}`)
      copyFromPos(target, f.size)
      pathMap[f.orig] = target
    })
    return { manifest, pathMap }
  } finally {
    closeSync(fd)
  }
}

// Plain file copy used for the rolling automatic backups.
export function copyDb(from: string, to: string): void {
  copyFileSync(from, to)
}
