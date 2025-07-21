import { weights1, weights2, colourBar, nodeSelections, mnistTestImagesBuffer } from './init.js';
import { extractMnistImage, extractMnistLabel } from './mnist.js';


function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getColour(value) {
    // Clamp value to [-1, 1]
    value = Math.max(-1, Math.min(1, value));
    const n = colourBar.length;
    const scaled = ((value + 1) / 2) * (n - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx;

    // Interpolate between colourBar[idx] and colourBar[idx + 1]
    const c1 = colourBar[idx];
    let c2 = colourBar[idx + 1];
    if (!c2) { 
        c2 = colourBar[idx - 1];
    }
    const rgb = [
        Math.round(lerp(c1[0], c2[0], frac)),
        Math.round(lerp(c1[1], c2[1], frac)),
        Math.round(lerp(c1[2], c2[2], frac))
    ];
    return rgbToHex(rgb);
}

// Helper to convert [r,g,b] to hex string
function rgbToHex(rgb) {
    return (
        "#" +
        rgb
            .map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            })
            .join("")
    );
}


function createWeightsImageGroup(id, size) {
    // Create the group element
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "weights_image");
    group.setAttribute("id", id); // Set the ID for the group
    group.setAttribute("stroke", "none");

    // Calculate border size
    const gridSize = 28 * size;

    // Create the 28x28 grid of cells
    for (let row = 0; row < 28; row++) {
        for (let col = 0; col < 28; col++) {
            const cell = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            cell.setAttribute("x", col * size);
            cell.setAttribute("y", row * size);
            cell.setAttribute("width", size);
            cell.setAttribute("height", size);
            group.appendChild(cell);
        }
    }

    return group;
}

function generateWeightsImage(id, size) {
    const group = createWeightsImageGroup(`node-${id}`, size);
    const cells = group.querySelectorAll('rect');
    for (let i = 0; i < 784; i++) {
        const value = weights1[i][id];
        const colour = getColour(value);
        cells[i].setAttribute('fill', colour);
    }
    return group;
}

export function generateAggregateImage(size, svg, id, selections = nodeSelections, activations = null, abs = true) {
    svg.innerHTML = ''; // Clear previous content
    const selectionSize = selections.length;
    if(selectionSize !== 0) {
        const group = createWeightsImageGroup(id, size);
        const cells = group.querySelectorAll('rect');
        const values = Array.from({ length: 784 }, (_, i) => 
            selections.reduce((sum, num) => 
                sum + getFeatureValue(i, num, activations, abs), 0));
        const max = Math.max(...values);
        const min = Math.min(...values);
        // Normalize values to range [-1, 1]
        const normalized = values.map(v => {
            if (max === min) return 0; // Avoid division by zero
            return ((v - min) / (max - min)) * 2 - 1;
        });
        for (let i = 0; i < 784; i++) {
            const value = normalized[i];
            const colour = getColour(value);
            cells[i].setAttribute('fill', colour);
        }
        svg.appendChild(group); // Append the new group
    }
}

function getFeatureValue(i, num, activations, abs) {
    let value = weights1[i][num];
    if (activations) {
        value *= abs ? Math.abs(activations[num]) : activations[num];
    }
    return value;
}

export function drawInputImage(index, svg) {
    svg.innerHTML = ''; // Clear previous content
    const size = 2;
    const imageSize = 28 * size;
    const group = createWeightsImageGroup(`input-${index}`, size);
    group.setAttribute("id", "input_image");

    // Extract the MNIST image data
    const mnistImage = extractMnistImage(mnistTestImagesBuffer, index);
    const cells = group.querySelectorAll('rect');
    
    for (let i = 0; i < 784; i++) {
        const value = mnistImage[i] / 2.0; // Normalize to [0, 1]
        const colour = getColour(value); // Convert to [-1, 1] range
        cells[i].setAttribute('fill', colour);
    }

    svg.appendChild(group); // Append the new group
}

export async function saveEncodingImages() {
    const size = 2;
    const imageSize = 28 * size;
    const columns = 20;
    const zip = new JSZip(); // Use global JSZip

    for (let i = 0; i < 800; i++) {
        const group = generateWeightsImage(i, size);

        // Create a standalone SVG element for each image
        const svgElem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElem.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svgElem.setAttribute("width", imageSize);
        svgElem.setAttribute("height", imageSize);
        svgElem.setAttribute("viewBox", `0 0 ${imageSize} ${imageSize}`);
        svgElem.appendChild(group);

        // Serialize SVG
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElem);

        // Add to zip
        zip.file(`feature_${i}.svg`, svgString);
    }

    // Generate zip and trigger download
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = "encoding_images.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export async function displayEncodingSVGs() {
    const count = 800;
    const groupContainer = document.createElement('div');
    groupContainer.setAttribute('style', 'display: none;')
    for (let i = 0; i < count; i++) {
        const img = document.createElement('img');
        img.src = `images/encodings/feature_${i}.svg`;
        img.id = `feature_${i}`;
        img.style.display = 'inline-block';
        img.style.border = '2px solid white';
        img.width = 56;
        img.height = 56;
        img.alt = `Network Feature Encoding #${i}`;
        groupContainer.appendChild(img);
    }
    return groupContainer;
}

