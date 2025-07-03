console.log('Loading TensorFlow.js library...');

const model = await tf.loadLayersModel('data/model_weights/model.json');
const weights1 = await model.layers[0].getWeights()[0].array();
const weights2 = await model.layers[1].getWeights()[0].array();

const colourBar = ["blue", "black", "white"]

console.log('Model loaded successfully:', model);
console.log('Weights of layer 1:', weights1);
console.log('Weights of layer 2:', weights2);