import { displayEncodingSVGs } from './draw_weights.js';
import { tooltipEventListener, encodeClickEventListener, showHideMaxSim, showHideInformation } from './interactions.js';
import { extractMnistLabel, extractMnistImage, getNumMnistImages } from './mnist.js';

console.log('Loading TensorFlow.js library...');

export const model = await tf.loadLayersModel('data/model_weights/model.json');
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
export let modelActivations = null;
const globalNorms = {
  set: document.querySelector("#norms-toggle").checked,
  min: -1,
  max: 1
}; // Default to global norms
const input = {
  index: null,
  label: null,
  image: null
}
const decodes = [];

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

export const mnistTrainImagesBuffer = await fetchArrayBufferLocal('data/train-images.idx3-ubyte');
export const mnistTrainLabelsBuffer = await fetchArrayBufferLocal('data/train-labels.idx1-ubyte');
export const mnistTrainSize = getNumMnistImages(mnistTrainImagesBuffer);

showHideMaxSim();
showHideInformation();
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

export function loadInstance(index) {
  input.index = index;
  input.label = extractMnistLabel(mnistTestLabelsBuffer, index);
  input.image = extractMnistImage(mnistTestImagesBuffer, index);
}

export function getInstance() {
  return input;
}

export function activationsAccessor(activations) {
  if (activations !== undefined) {
    modelActivations = activations;
  } else {
    return modelActivations;
  }
}

export function normsToggleAccessor(norms) {
  if (norms !== undefined) {
    globalNorms.set = norms;
  } else {
    return globalNorms.set;
  }
}

export function normsMaxAccessor(max){
  if(max !== undefined) {
    globalNorms.max = max;
  } else {
    return globalNorms.max;
  }
}

export function normsMinAccessor(min){
  if(min !== undefined) {
    globalNorms.min = min;
  } else {
    return globalNorms.min;
  }
}

export function decodingsAccessor(decodings){
  if(decodings !== undefined) {
    decodes.length = 0;
    decodes.push(...decodings);
  } else {
    return decodes;
  }
}