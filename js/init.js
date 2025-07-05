import { displayEncodingSVGs } from './draw_weights.js';
import { tooltipEventListener, encodeClickEventListener } from './interactions.js';
import { extractMnistLabel, getNumMnistImages } from './mnist.js';

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

export let nodeSelections = [];
export let mnistData = null;

// --- MNIST IDX file loading from /data ---
export const mnistTestImagesBuffer = await fetchArrayBufferLocal('data/t10k-images.idx3-ubyte').then((data) => {
  document.getElementById('input-spinner').setAttribute('style', 'display: none;');
  document.getElementById('input-data').setAttribute('style', 'display: block;');
  const numImages = getNumMnistImages(data);
  document.getElementById('input-number').setAttribute('max', numImages);
  console.log('MNIST test images buffer loaded:', numImages);
  return data;
});
export const mnistTestLabelsBuffer = await fetchArrayBufferLocal('data/t10k-labels.idx1-ubyte');

document.querySelector("#input-number").dispatchEvent(new Event('change')); // Trigger change event to initialize input image

console.log('Model loaded successfully:', model);
console.log('Weights of layer 1:', weights1);
console.log('Weights of layer 2:', weights2);
console.log('Colour bar:', colourBar);

async function fetchArrayBufferLocal(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return await response.arrayBuffer();
}

await displayEncodingSVGs().then(svgs => {
  document.getElementById('encoding_features').appendChild(svgs);
  new Promise(resolve => setTimeout(resolve, 2000)).then(() => {
      document.getElementById('feature-spinner').setAttribute('style', 'display: none;');
      svgs.setAttribute('style', 'display: block;');
  });
  const imgs = svgs.querySelectorAll('img');
  tooltipEventListener(imgs);
  encodeClickEventListener(imgs);
  console.log('Encoding SVGs displayed successfully');
});

