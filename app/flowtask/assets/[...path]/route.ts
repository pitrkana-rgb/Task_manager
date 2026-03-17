import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

function contentTypeFromExt(ext: string) {
  const e = ext.toLowerCase()
  if (e === '.png') return 'image/png'
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg'
  if (e === '.webp') return 'image/webp'
  if (e === '.gif') return 'image/gif'
  if (e === '.svg') return 'image/svg+xml'
  if (e === '.ico') return 'image/x-icon'
  return 'application/octet-stream'
}

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const rel = path.join('/')
  const abs = join(process.cwd(), 'assets', rel)
  const buf = await readFile(abs)
  const ext = abs.slice(abs.lastIndexOf('.'))
  return new Response(buf, {
    headers: {
      'content-type': contentTypeFromExt(ext),
      'cache-control': 'public, max-age=31536000, immutable'
    }
  })
}

