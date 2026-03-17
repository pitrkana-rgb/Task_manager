import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const uid = url.searchParams.get('uid') ?? ''
  const email = url.searchParams.get('email') ?? ''
  const name = url.searchParams.get('name') ?? ''

  const root = process.cwd()
  const htmlPath = join(root, 'index.html')
  let html = await readFile(htmlPath, 'utf8')

  html = html
    .replace('href="css/styles.css"', 'href="/flowtask/styles.css"')
    .replace('src="js/app.js"', 'src="/flowtask/app.js"')

  const inject = `<script>window.__SUPA_USER=${JSON.stringify({
    id: uid,
    email,
    name
  })};</script>`

  html = html.replace('</head>', `${inject}</head>`)

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    }
  })
}

