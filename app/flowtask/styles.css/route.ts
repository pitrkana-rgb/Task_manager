import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function GET() {
  const css = await readFile(join(process.cwd(), 'css', 'styles.css'), 'utf8')
  return new Response(css, {
    headers: {
      'content-type': 'text/css; charset=utf-8',
      'cache-control': 'no-store'
    }
  })
}

