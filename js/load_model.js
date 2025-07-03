console.log('Loading TensorFlow.js library...');

const model = await tf.loadLayersModel('data/model_weights/model.json');

console.log('Model loaded successfully:', model);