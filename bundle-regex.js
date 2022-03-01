// Run in Node instance
const fs = require('fs')
const path = require('path')
const normalizedPath = path.join(__dirname, "data");

const json = {}
fs.readdirSync(normalizedPath).forEach(function(file) {
  if (file.includes('.regex.txt')) {
    console.log(`Reading ${file} for rendering...`)
    const filepath = path.join(normalizedPath, file)
    const filecontents = fs.readFileSync(filepath, 'utf8')
    json[file] = filecontents
  }
});
fs.writeFileSync('bundle.json', JSON.stringify(json))
