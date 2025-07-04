import { displayEncodingSVGs } from './draw_weights.js';

console.log('Loading TensorFlow.js library...');

const model = await tf.loadLayersModel('data/model_weights/model.json');
export const weights1 = await model.layers[0].getWeights()[0].array();
export const weights2 = await model.layers[1].getWeights()[0].array();

export const colourBar = [
  [255, 0, 0],    // Red
  [0, 0, 255],      // Blue
  [0, 0, 0],      // Black
  [255, 255, 255], // White
  [255, 255, 0], // Yellow
];

console.log('Model loaded successfully:', model);
console.log('Weights of layer 1:', weights1);
console.log('Weights of layer 2:', weights2);
console.log('Colour bar:', colourBar);

await displayEncodingSVGs().then(svgs => {
  document.getElementById('encoding_features').appendChild(svgs);
  new Promise(resolve => setTimeout(resolve, 2000)).then(() => {
      document.getElementById('feature-spinner').setAttribute('style', 'display: none;');
      svgs.setAttribute('style', 'display: block;');
  });
  console.log('Encoding SVGs displayed successfully');
});
