/**
 * @fileoverview Description of this file.
 */

const fs = require('fs');
const path = require('path')
const normalizedPath = path.join(__dirname, "data");

let html = `<html>
  <head>
    <meta charset="UTF-8">
    <style>
      table, td {
        border: solid 1px #555;
      }
    </style>
  </head>
  <body>
  This is an auto-generated page for the Text Art converter.
  On the left side of the page is an example of a particular art.
  On the right side is an auto-generated caption for that art.
  <table>`

const exampleMap = {}

const regex = (example) => {
  if (example.regexMatch === 'ALL_TEXT') {
    const rx = new RegExp('[A-Za-z0-9#@][A-Za-z0-9#@\':/.-_\s]*[A-Za-z0-9#@!]?', 'g')
    const allText = example.example.match(rx).join(' ')
    return example.regexReplace.replace('$1', allText)
  } else {
    const rx = new RegExp(example.regexMatch, 'mi')
    return example.example.replace(rx, example.regexReplace)
  }
}

fs.readdirSync(normalizedPath).forEach(function(file) {
  const classificationKey = file.split('.')[0]
  const filepath = path.join(normalizedPath, file)
  const filecontents = fs.readFileSync(filepath, 'utf8')
  if (!exampleMap[classificationKey]) {
    exampleMap[classificationKey] = {
      example: '',
      regexMatch: '',
      regexReplace: ''
    }
  }
  if (file.includes('.training.json')) {
    exampleMap[classificationKey].example = JSON.parse(filecontents)[0].text
  }
  if (file.includes('.regex.txt') && !file.includes('emoji-art')) {
    const [match, sub] = filecontents.split('\n')
    exampleMap[classificationKey].regexMatch = match
    exampleMap[classificationKey].regexReplace = sub
  }
});

for (const [key, entry] of Object.entries(exampleMap)) {
  html += `<tr><td>${entry.example.replace(/\n/g, '<br>')}</td>
    <td><b>${key}</b><br>${regex(entry)}</td></tr>`
}

html += `</table></body></html>`

fs.writeFileSync('index.html', html)
