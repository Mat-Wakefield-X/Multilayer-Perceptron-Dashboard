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

  // Run inference
  const outputTensor = model.predict(inputTensor);

  // Get activation values as array
  const activations = outputTensor.dataSync();  // Returns Float32Array

  // Find the predicted digit (index of max activation)
  const prediction = activations.indexOf(Math.max(...activations));

  // Clean up tensors
  tf.dispose([inputTensor, outputTensor]);

  return {
    prediction,
    activations: Array.from(activations)
  };
}