import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-node'
import * as use from '@tensorflow-models/universal-sentence-encoder'

import fs from 'fs'
import path from 'path'
import readline from 'readline'

const classificationKeyArray = []
const regexMatch = []
const regexReplace = []
const normalizedPath = path.join(__dirname, "..", "data");

fs.readdirSync(normalizedPath).forEach(function(file) {
  if (file.includes('.training.json')) {
    const classificationKey = file.split('.')[0]
    classificationKeyArray.push(classificationKey)
  }
  if (file.includes('.regex.txt') && !file.includes('emoji-art')) {
    console.log(`Reading ${file} for substitution...`)
    const filepath = path.join(normalizedPath, file)
    const filecontents = fs.readFileSync(filepath, 'utf8')
    const [match, sub] = filecontents.split('\n')
    regexMatch.push(match)
    regexReplace.push(sub)
  }
});
classificationKeyArray.push('emoji-art')
const [emojiM, emojiS] = fs
  .readFileSync(path.join(normalizedPath, 'emoji-art.regex.txt'), 'utf8')
  .split('\n')
regexMatch.push(emojiM)
regexReplace.push(emojiS)

let model
(async () => {
  model = await tf.loadLayersModel('file://' + path.join(__dirname, "..", "emoji-model", "model.json"))
})()
console.log('Model loaded')

const tag = ([tensor]) => {
  let classifiedIndex = -1
  let classifiedPercent = 0
  tensor.forEach((percent, index) => {
    console.log(classificationKeyArray[index], tensor[index])
    if (index === classificationKeyArray.length - 1) return
    if (percent > classifiedPercent) {
      classifiedIndex = index
      classifiedPercent = percent
    }
  })
  if (classifiedPercent < 0.3 && tensor[tensor.length - 1] > classifiedPercent) {
    return tensor.length - 1 // Unknown emoji art 
  } else if (classifiedPercent < 0.3) {
    return -1
  }
  if (classifiedIndex === -1) {
    // We have no idea
    return classificationKeyArray.length - 1
  }
  return classifiedIndex
}

const regex = (msg, index) => {
  console.log(index, regexMatch[index])
  if (regexMatch[index] === 'ALL_TEXT') {
    const rx = new RegExp('[A-Za-z0-9#@][A-Za-z0-9#@\':/.-_\s]*[A-Za-z0-9#@!]?', 'g')
    const allText = msg.match(rx).join(' ')
    return regexReplace[index].replace('$1', allText)
  } else {
    const rx = new RegExp(regexMatch[index], 'mi')
    return msg.replace(rx, regexReplace[index])
  }
}

console.log('Copy and paste a tweet into me, then press CTRL+C')
const input = [];
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.prompt();
rl.on('line', function (cmd) {
  input.push(cmd);
});
rl.on('close', function (cmd) {
  const tweet = input.join('\n')
  // Handle the inference
  use.load()
    .then(useModel => {
      return useModel.embed(tweet)
        .then(embeddings => {
          model.predict(embeddings).array()
            .then(tensor => {
              const index = tag(tensor)
              console.log('\n')
              console.log(index)
              console.log(classificationKeyArray[index] || 'none')
              const altText = regex(tweet, index)
              console.log('\n')
              console.log(altText)
              process.exit(0)
            })
          rl.close()
        })
    })
});

// const stdio = require('stdio')
// stdio.question('Copy and paste a tweet into me', (err, tweet) => {
  
// })