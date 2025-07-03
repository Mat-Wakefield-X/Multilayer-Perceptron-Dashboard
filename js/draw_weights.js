function createWeightsImageGroup(id, size) {
    // Create the group element
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "weights_image");
    group.setAttribute("id", `node${id}`); // Set the ID for the group

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

const svg = document.getElementById('inspect').querySelector('svg')
svg.appendChild(createWeightsImageGroup(0, 2));
svg.setAttribute("width", 28 * 2 + 2);
svg.setAttribute("height", 28 * 2 + 2);