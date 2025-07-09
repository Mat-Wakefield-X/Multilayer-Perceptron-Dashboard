import {  model, mnistTestImagesBuffer, mnistTestLabelsBuffer } from "./init.js";
import {  extractMnistImage, extractMnistLabel } from "./mnist.js";

/**
 * Processes a single MNIST test image through the model
 * @param {number} index - Index of the test image to process
 * @returns {Promise<{prediction: number, activations: number[]}>} - Predicted digit and activations
 */
export async function runMNISTInference(index) {
  // Extract normalized image data (784 element array)
  const imageArray = extractMnistImage(mnistTestImagesBuffer, index);

  // Reshape image to match model input (usually [1, 784] for MLP)
  const inputTensor = tf.tensor(imageArray, [1, 784]);

  let currentOutput = inputTensor;
  const activations = [];

  model.layers.forEach(layer => {
    currentOutput = layer.apply(currentOutput);
    activations.push(currentOutput.dataSync()); // Get activations for each layer
  });

  // Find the predicted digit (index of max activation)
  const prediction = activations[1].indexOf(Math.max(...activations));

  // Clean up tensors
  tf.dispose(inputTensor);

  return {
    prediction,
    activations: Array.from(activations)
  };
}