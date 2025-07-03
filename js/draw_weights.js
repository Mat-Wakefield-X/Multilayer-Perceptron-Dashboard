import { weights1, weights2, colourBar } from './init.js';


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

    if (frac === 0 || idx === n - 1) {
        return colourBar[idx];
    }

    // Interpolate between colourBar[idx] and colourBar[idx + 1]
    const c1 = colourBar[idx];
    const c2 = colourBar[idx + 1];
    const rgb = [
        Math.round(lerp(c1[0], c2[0], frac)),
        Math.round(lerp(c1[1], c2[1], frac)),
        Math.round(lerp(c1[2], c2[2], frac))
    ];
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}


function createWeightsImageGroup(id, size) {
    // Create the group element
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "weights_image");
    group.setAttribute("id", `node-${id}`); // Set the ID for the group

    // Calculate border size
    const gridSize = 28 * size;
    const borderSize = gridSize + 2;

    // Create the border rectangle
    const borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    borderRect.setAttribute("class", "weights_image_border");
    borderRect.setAttribute("x", 0);
    borderRect.setAttribute("y", 0);
    borderRect.setAttribute("width", borderSize);
    borderRect.setAttribute("height", borderSize);
    borderRect.setAttribute("fill", "none");
    borderRect.setAttribute("stroke", "black");
    borderRect.setAttribute("stroke-width", "1");
    group.appendChild(borderRect);

    // Create the 28x28 grid of cells
    for (let row = 0; row < 28; row++) {
        for (let col = 0; col < 28; col++) {
            const cell = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            cell.setAttribute("class", "cell");
            cell.setAttribute("x", 1 + col * size);
            cell.setAttribute("y", 1 + row * size);
            cell.setAttribute("width", size);
            cell.setAttribute("height", size);
            cell.setAttribute("fill", "black");
            cell.setAttribute("stroke", "none");
            group.appendChild(cell);
        }
    }

    return group;
}

function generateWeightsImage(id, size) {
    const group = createWeightsImageGroup(id, size);
    const cells = group.querySelectorAll('.cell');
    for (let i = 0; i < 784; i++) {
        const value = weights1[i][id];
        const colour = getColour(value);
        cells[i].setAttribute('fill', colour);
    }
    return group;
}

function generateEncodingImages() {
    const svg = document.getElementById('features_svg');
    const size = 2;
    const imageSize = 28 * size + 2; // 58
    const columns = 20;
    for (let i = 0; i < 800; i++) {
        const group = generateWeightsImage(i, size);
        const col = i % columns;
        const row = Math.floor(i / columns);
        group.setAttribute('transform', `translate(${col * imageSize}, ${row * imageSize})`);
        svg.appendChild(group);
    }
}

// const svg = document.querySelector('#inspect svg');
// const image1 = generateWeightsImage(0, 5);
// const image2 = generateWeightsImage(1, 5);
// const image3 = generateWeightsImage(3, 5);

// image2.setAttribute('transform', 'translate(142, 0)'); // Move the second image to the right
// image3.setAttribute('transform', 'translate(284, 0)'); // Move the third image down
// svg.appendChild(image1);
// svg.appendChild(image2);
// svg.appendChild(image3);