/**
 * Extract a single image from an MNIST IDX image ArrayBuffer.
 * @param {ArrayBuffer} buffer - The ArrayBuffer of the IDX image file.
 * @param {number} index - The image index to extract (0-based).
 * @returns {number[]} - Array of 784 pixel values (0-255).
 */
export function extractMnistImage(buffer, index) {
    const view = new DataView(buffer);
    const magic = view.getUint32(0, false);
    if (magic !== 2051) throw new Error('Not a valid MNIST image file');
    const numImages = view.getUint32(4, false);
    const numRows = view.getUint32(8, false);
    const numCols = view.getUint32(12, false);
    if (index < 0 || index >= numImages) throw new Error('Index out of range');
    const imageSize = numRows * numCols;
    const start = 16 + index * imageSize;
    const data = new Uint8Array(buffer, start, imageSize);
    return Array.from(data);
}

/**
 * Extract a single label from an MNIST IDX label ArrayBuffer.
 * @param {ArrayBuffer} buffer - The ArrayBuffer of the IDX label file.
 * @param {number} index - The label index to extract (0-based).
 * @returns {number} - The label (0-9).
 */
export function extractMnistLabel(buffer, index) {
    const view = new DataView(buffer);
    const magic = view.getUint32(0, false);
    if (magic !== 2049) throw new Error('Not a valid MNIST label file');
    const numLabels = view.getUint32(4, false);
    if (index < 0 || index >= numLabels) throw new Error('Index out of range');
    const data = new Uint8Array(buffer, 8, numLabels);
    return data[index];
}

/**
 * Returns the number of images in an MNIST IDX image ArrayBuffer.
 * @param {ArrayBuffer} buffer - The ArrayBuffer of the IDX image file.
 * @returns {number} - The number of images.
 */
export function getNumMnistImages(buffer) {
    const view = new DataView(buffer);
    const magic = view.getUint32(0, false);
    if (magic !== 2051) throw new Error('Not a valid MNIST image file');
    return view.getUint32(4, false);
}

