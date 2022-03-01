import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-node'
import * as use from '@tensorflow-models/universal-sentence-encoder'

import fs from 'fs'
import path from 'path'
// Import all training files into one large dataset
const trainingSet = []
const classificationKeyArray = []
const normalizedPath = path.join(__dirname, "..", "data");

fs.readdirSync(normalizedPath).forEach(function(file) {
  if (file.includes('.training.json')) {
    console.log(`Reading ${file} for training...`)
    const fileData = require("../data/" + file);
    const classificationKey = file.split('.')[0]
    classificationKeyArray.push(classificationKey)
    fileData.forEach(datum => {
      // Add imported data to our training set
      datum.intent = classificationKey
      trainingSet.push({...datum})
      // Add a second universal tag
      // datum.intent = 'emoji-art'
      // trainingSet.push({...datum})
    })
  }
});

const generate2d = (trainingSet, classificationKeyArray) => {
  return trainingSet.map(datum => {
    const arr = []
    classificationKeyArray.forEach(classificationKey => {
      arr.push(datum.intent === classificationKey ? 1 : 0)
    })
    // Add 'emoji-art'
    arr.push(datum.intent !== 'none' ? 1 : 0)
    return arr
  })
}

const outputData = tf.tensor2d(generate2d(trainingSet, classificationKeyArray))

const encodeData = (data) => {
  const text = data.map(datum => datum.text.toLowerCase())
  return use.load()
    .then(model => {
      return model.embed(text)
        .then(embeddings => {
          return embeddings
        })
    })
    .catch(err => console.error('Fit Error:', err))
}

const model = tf.sequential()
const units = classificationKeyArray.length + 1
// Add layers to model
model.add(tf.layers.dense({
  inputShape: [512],
  activation: 'sigmoid',
  units
}))

model.add(tf.layers.dense({
  inputShape: [units],
  activation: 'sigmoid',
  units
}))

model.add(tf.layers.dense({
  inputShape: [units],
  activation: 'sigmoid',
  units
}))

// Compile the model
model.compile({
  loss: 'meanSquaredError',
  optimizer: tf.train.adam(0.06), // This is a standard compile config
})

function runTrainer() {
  Promise.all([
    encodeData(trainingSet),
    encodeData(require('./data/_testing.json'))
  ]).then(data => {
    const {
      0: training_data,
      1: testing_data,
    } = data

    model.fit(training_data, outputData, { epochs: 200 })
      .then(history => {
        model.predict(testing_data).print()
        model.save('file://' + path.join(__dirname, "..", "emoji-model"))
          .then(() => {
            console.log('saved model')
            process.exit()
          })
      })
  }).catch(err => console.error('Training err:', err))
}

// Call trainer
runTrainer()
