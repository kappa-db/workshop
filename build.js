#!/usr/bin/env node

const fs = require('fs')
const marked = require('marked')
const path = require('path')
const rimraf = require('rimraf')
const hljs = require('highlight.js')
const base = path.join(__dirname, 'problems')

rimraf.sync(path.join(__dirname, 'build'))

marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-'
})

try {
  fs.mkdirSync(path.join(__dirname, 'build'))
} catch (err) {
  // do nothing
}

const css = fs.readFileSync('./node_modules/highlight.js/styles/github-dark.css', 'utf8')
const style = `<style>
  body {
    padding: 40px;
  }
  .markdown-body {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    color: #333;
    font-family: "Helvetica Neue", Helvetica, "Segoe UI", Arial, freesans, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    word-wrap: break-word;
    padding: 5rem 2rem 8rem 2rem;
    width: 60rem;
    margin-left: auto;
    margin-right: auto;
  }
  ${css}
</style>`


fs.readdirSync(base).forEach(name => {
  const input = path.join(base, name)
  const output = path.join(__dirname, 'build', name.replace('.md', '.html'))

  const html = marked.parse(fs.readFileSync(input, 'utf-8'))
  const file = `<html>
    <head>
      <title>Problem ${name.replace('.md', '')}</title>
      ${style}
    </head>
    <body class="markdown-body">
      ${html}
    </body>
  </html>`

  fs.writeFileSync(output, file)
})
