import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'

// Release 标题固定为 “短 hash (日期)”，正文就是这次提交的完整 commit message。
// 日期按 Asia/Shanghai 取，和作者所在时区一致。
const short = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim()
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())
const body = execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' })
  .replace(/\r\n/g, '\n')
  .trim()
const title = `${short} (${date})`

mkdirSync('release-meta', { recursive: true })
writeFileSync(
  'release-meta/meta.json',
  JSON.stringify({ short, date, title, body }, null, 2) + '\n'
)
writeFileSync('release-meta/body.md', `${body}\n`)

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `short=${short}\ntitle=${title}\ndate=${date}\n`)
}

// 构建脚本需要在 Actions 日志里回显标题。
// eslint-disable-next-line no-console
console.log(title)
