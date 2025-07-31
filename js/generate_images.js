import { weights1, weights2, mnistTrainSize, mnistTrainImagesBuffer } from "./init.js";
import { extractMnistImage } from "./mnist.js";

export function generateImage(selections, weight = -1, abs = true) {
    const values = Array.from({ length: 784 }, (_, i) => 
        selections.reduce((sum, num) => 
            sum + getFeatureValue(i, num, weight, abs), 0));
    const max = Math.max(...values);
    const min = Math.min(...values);
    return {
        image: values,
        max: max,
        min: min,
    }
}

function getFeatureValue(i, num, weight, abs) {
    let value = weights1[i][num];
    if (weight != -1) {
        value *= abs ? Math.abs(weights2[num][weight]) : weights2[num][weight];
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

export function computeAggregateInstance(maxSims) {
    const length = maxSims[0].image.length;
    const aggregated = new Array(length).fill(0);
    let totalWeight = 0;

    for (const sim of maxSims) {
        totalWeight += sim.similarity;
        for (let i = 0; i < length; i++) {
            aggregated[i] += sim.image[i] * sim.similarity;
        }
    }

    // Optionally normalize by total weight
    if (totalWeight !== 0) {
        for (let i = 0; i < length; i++) {
            aggregated[i] /= totalWeight;
        }
    }

    return aggregated;
}