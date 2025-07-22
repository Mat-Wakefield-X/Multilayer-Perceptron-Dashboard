import { weights1, mnistTrainSize, mnistTrainImagesBuffer } from "./init.js";
import { extractMnistImage } from "./mnist.js";

export function generateImage(selections, activations = null, abs = true) {
    const values = Array.from({ length: 784 }, (_, i) => 
        selections.reduce((sum, num) => 
            sum + getFeatureValue(i, num, activations, abs), 0));
    const max = Math.max(...values);
    const min = Math.min(...values);
    return {
        image: values,
        max: max,
        min: min,
    }
}

function getFeatureValue(i, num, activations, abs) {
    let value = weights1[i][num];
    if (activations) {
        value *= abs ? Math.abs(activations[num]) : activations[num];
    }
    return value;
}

export function getMaxSimilarity(decoding, k) {
    const size = mnistTrainSize;
    const similarities = [];
    for (let idx = 0; idx < size; idx++) {
        const mnistImage = extractMnistImage(mnistTrainImagesBuffer, idx);
        // Compute dot product similarity
        const dotProduct = decoding.image.reduce((sum, val, i) => sum + val * mnistImage[i], 0);
        similarities.push({ index: idx, similarity: dotProduct });
    }
    // Sort by similarity descending and take top k
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topK = similarities.slice(0, k).map(item => ({
        index: item.index,
        image: extractMnistImage(mnistTrainImagesBuffer, item.index),
        similarity: item.similarity
    }));
    return topK;
}