import { weights1 } from "./init.js";

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