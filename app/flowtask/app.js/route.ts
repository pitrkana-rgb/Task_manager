import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function GET() {
  const js = await readFile(join(process.cwd(), 'js', 'app.js'), 'utf8')
  return new Response(js, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store'
    }
  })
}

