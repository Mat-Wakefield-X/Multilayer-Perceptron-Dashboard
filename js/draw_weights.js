function getColour(value) {
    // Clamp value to [-1, 1]
    value = Math.max(-1, Math.min(1, value));
    // Map value from [-1, 1] to [0, colourBar.length - 1]
    const n = colourBar.length;
    const scaled = ((value + 1) / 2) * (n - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx;

    // If exactly at a color stop, return it
    if (frac === 0 || idx === n - 1) {
        return colourBar[idx];
    }

    // Interpolate between colourBar[idx] and colourBar[idx + 1]
    // Only works for hex or rgb(a) colors, not named colors.
    // For named colors, just pick the lower index.
    return colourBar[idx];
}



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

