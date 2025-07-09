import { nodeSelections, mnistTestLabelsBuffer } from "./init.js";
import { generateAggregateImage, drawInputImage } from "./draw_weights.js";
import { extractMnistLabel } from "./mnist.js";
import { runMNISTInference } from "./run_model.js";

export function tooltipEventListener(elements) {
    console.log('Applying event listeners to encoding images');
    elements.forEach(img => {
        img.addEventListener('mouseenter', function (e) {
            showEncodingTooltip(e, extractFeatureNumber(img), img);
        });

        img.addEventListener('touchstart', function (e) {
            // For touch devices, show tooltip on touch
            showEncodingTooltip(e, extractFeatureNumber(img), img);
        });

        img.addEventListener('mousemove', function (e) {
            // Move tooltip with mouse
            showEncodingTooltip(e, null, img);
        });

        img.addEventListener('mouseleave', function () {
            const tooltip = document.getElementById('encoding-tooltip');
            tooltip.style.display = 'none';
        });
    });
}

function extractFeatureNumber(img) {
    // Extract feature number from src
    const match = img.id.match(/feature_(\d+)/);
    const num = match ? match[1] : '?';
    // Prepare feature object for tooltip
    const feature = {
        name: `Feature encoding #${num}`,
        number: parseInt(num, 10) || 0 // Ensure it's a number
    };
    return feature;
};

function showEncodingTooltip(event, feature, img) {
    const scale = 4; // Scale factor for tooltip image size
    const tooltip = document.getElementById('encoding-tooltip');
    // If feature is provided, set content; otherwise, just reposition
    if (feature) {
        tooltip.innerHTML = `
            <div style="font-weight:bold; margin-bottom:6px;">${feature.name}</div>
            <img src="${img.src}" style="width:${img.width * scale}px;height:${img.height * scale}px;display:block;margin:auto;" />
        `;
    }
    tooltip.style.display = 'block';

    // Position tooltip near mouse, but keep on screen
    const tooltipRect = tooltip.getBoundingClientRect();
    let x = event.clientX + 16;
    let y = event.clientY + 16;
    if (x + tooltipRect.width > window.innerWidth) {
        x = window.innerWidth - tooltipRect.width - 8;
    }
    if (y + tooltipRect.height > window.innerHeight) {
        y = window.innerHeight - tooltipRect.height - 8;
    }
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function highlightImage(img) {
    if(img.classList.contains('selected')) {
        img.style.border = '2px solid red'; // Highlight selected image
    } else {
        img.style.border = '2px solid white'; // Reset border for unselected images
    }
}

export function encodeClickEventListener(elements) {
    elements.forEach(img => {
        const num = extractFeatureNumber(img).number;
        img.addEventListener('click', function (e) {
            if(!nodeSelections.includes(num)) {
                nodeSelections.push(num);
                img.classList.add('selected'); // Add a class for styling
            } else {
                const filtered = nodeSelections.filter(item => item !== num);
                nodeSelections.length = 0; // Clear the array
                nodeSelections.push(...filtered);
                img.classList.remove('selected'); // Remove the class
            }
            highlightImage(img); // Update image border based on selection
            generateAggregateImage(5, document.querySelector('#manual-svg'), 'manual-aggregate'); // Regenerate aggregate image
        });
    });
}

function resetSelections() {
    nodeSelections.length = 0; // Clear the array
    generateAggregateImage(5, document.querySelector('#manual-svg'), 'manual-aggregate'); // Regenerate aggregate image
    const highlighted = document.querySelectorAll('.selected');
    highlighted.forEach(img => {
        img.classList.remove('selected'); // Remove the class
        highlightImage(img); // Reset border for highlighted images
    });
}

document.querySelector('.modern-btn').addEventListener('click', resetSelections);

document.querySelector('#input-number').addEventListener('change', function (e) {
    let index = parseInt(e.target.value, 10);
    if (isNaN(index) || index < 1 || index > 10000) {
        index = Math.max(1, Math.min(10000, parseInt(e.target.value, 10) || 1));
        document.getElementById('input-number').value = index;
    }
    index -= 1; // Convert to 0-based index
    const svg = document.querySelector('#input-svg');
    svg.innerHTML = ''; // Clear previous content
    drawInputImage(index, svg); // Regenerate input image
    const label = extractMnistLabel(mnistTestLabelsBuffer, index);
    document.getElementById('input-number-label').innerText = label; // Update label display
    runMNISTInference(index).then(({ prediction, activations }) => { 
        console.log(`Predicted digit for image ${index + 1}:`, prediction);
        console.log(`Activations for image ${index + 1}:`, activations);
        return { prediction, activations }; 
    });
});