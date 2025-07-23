import { nodeSelections, activationsAccessor, weights2, normsToggleAccessor, normsMaxAccessor, normsMinAccessor, decodingsAccessor, loadInstance, getInstance, updatePredictions, getModelPredictions, model } from "./init.js";
import { generateAggregateImage, drawInputImage, drawInstancesGroup } from "./draw_weights.js";
import { generateImage, getMaxSimilarity } from "./generate_images.js";
import { runMNISTInference } from "./run_model.js";

/*
-------------------------------------------------------------------------------
    FEATURE INSPECTIONS
-------------------------------------------------------------------------------
*/

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
            const data = generateImage(nodeSelections)
            generateAggregateImage(5, document.querySelector('#manual-svg'), 'manual-aggregate', data); // Regenerate aggregate image
        });
    });
}

function highlightImage(img) {
    if(img.classList.contains('selected')) {
        img.style.border = '2px solid red'; // Highlight selected image
    } else {
        img.style.border = '2px solid white'; // Reset border for unselected images
    }
}

document.querySelector('.modern-btn').addEventListener('click', resetSelections);

function resetSelections() {
    nodeSelections.length = 0; // Clear the array
    generateAggregateImage(5, document.querySelector('#manual-svg'), 'manual-aggregate'); // Regenerate aggregate image
    const highlighted = document.querySelectorAll('.selected');
    highlighted.forEach(img => {
        img.classList.remove('selected'); // Remove the class
        highlightImage(img); // Reset border for highlighted images
    });
}

/*
-------------------------------------------------------------------------------
    DECODING
-------------------------------------------------------------------------------
*/

document.querySelector('#norms-toggle').addEventListener('change', function (e) {
    normsToggleAccessor(e.target.checked); // Update norms accessor based on toggle state
    drawDecodings();
    drawInputSaliency();
});

document.querySelector('#max-sim-toggle').addEventListener('change', function (e) {
    showHideMaxSim();
    if(e.target.checked) handleToggleChange(false);
});

document.querySelector('#info-toggle').addEventListener('change', showHideInformation);

document.querySelector('#input-number').addEventListener('change', runPrediction);
document.querySelectorAll('.top-down-toggle').forEach(toggle => {
    toggle.addEventListener('change', handleToggleChange); 
});

document.querySelectorAll('.output-value').forEach(input => {
    input.addEventListener("input", function (e) {
        let cleaned = this.value
        .replace(/[^0-9.]/g, '')              // Remove non-numeric and non-dot characters
        .replace(/^(\.)/, '')                 // Prevent starting with a dot
        .replace(/(\..*)\./g, '$1');          // Allow only one dot

        this.value = cleaned;
    });
    input.addEventListener('blur', function() {
        handleOutpuValueChange(this);
    })
    input.addEventListener('keydown', function(e) {
        if(e.key === "Enter") handleOutpuValueChange(this);
    })
});
document.querySelector("#reset-output").addEventListener("click", function () {
    updatePredictions(null, -1);
    updatePredictionDisplay(input.label);
    handleToggleChange();
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleToggleChange(generate=true) {
    await sleep(300); // allow animation to kick in
    if(generate) {
        generateTopDown();

        await sleep(0);
        drawDecodings();

        await sleep(0);
        drawInputSaliency();
    }

    const maxSim = document.querySelector('#max-sim-toggle').checked;
    if(maxSim) await drawMaxSimilarity();
}

function handleOutpuValueChange(input) {
    // Parse and format if cleaned string is a valid number
    const parsed = parseFloat(input.value);
    if (!isNaN(parsed)) {
        input.value = parsed.toFixed(4);
    }
    const match = input.id.match(/output-(\d+)/);
    const index = match ? parseInt(match[1], 10) : null;
    updatePredictions(null, index, parsed);
    handleToggleChange();
}

function runPrediction(e) {
    let index = parseInt(e.target.value, 10);
    if (isNaN(index) || index < 1 || index > 10000) {
        index = Math.max(1, Math.min(10000, parseInt(e.target.value, 10) || 1));
        document.getElementById('input-number').value = index;
    }
    index -= 1; // Convert to 0-based index
    loadInstance(index);
    const input = getInstance();

    const svg = document.querySelector('#input-svg');
    drawInputImage(input, 2, svg); // Regenerate input image

    document.getElementById('input-number-label').innerText = input.label; // Update label display

    runMNISTInference(index).then(({ prediction, activations }) => { 
        activationsAccessor(activations); // Store activations globally
        updatePredictions(prediction, -1);
        updatePredictionDisplay(input.label);
        shiftToggles(activations[1]); // Update toggle states based on activations
        handleToggleChange();
    });
}

function updatePredictionDisplay(label) {
    const prediction = getModelPredictions().prediction;
    const activations = activationsAccessor();
    const predictionLabel = `${prediction} ${(prediction === label) ? '✅' : '❌'}`;
    document.querySelector('#output-prediction-label').innerText = predictionLabel; // Update prediction display
    for (const [i, value] of activations[1].entries()) {
        const cell = document.querySelector(`#output-${i}`);
        cell.value = value.toFixed(4); 
        const container = document.querySelector(`#output-${i}-cell`);
        container.style.backgroundColor = greenOpacityGradient(value); // Set background color based on value
    }
}

function shiftToggles(activations) {
    const toggles = document.querySelectorAll('.top-down-toggle');
    toggles.forEach((toggle, i) => {
        const value = activations[i];
        toggle.checked = value >= 0.0001; // Check if activation is above threshold
    });
}

function greenOpacityGradient(value) {
    // Clamp value between 0 and 1
    value = Math.max(0, Math.min(1, value));
    value = (value >= 0.0001) ? (value * 0.5) + 0.5 : 0; // Scale to 0.5 to 1 range for opacity
    // Return rgba for green with linear opacity
    return `rgba(85, 170, 85, ${value})`;
}

function generateTopDown() {
    // Determine modulated activations for the first layer.
    const modulations = getModulations();
    const modulated = activationsAccessor()[0].map((val, idx) => val * modulations[idx]);

    // Generate aggregate images based on positive, negative, and all selections.
    const positiveSelections = getSelections(modulated, true);
    const positiveData = generateImage(positiveSelections, modulated);

    const negativeSelections = getSelections(modulated, false);
    const negativeData = generateImage(negativeSelections, modulated);

    const allSelections = getSelections(modulated, null);
    const allData = generateImage(allSelections, modulated, false);

    const decodings = [positiveData, negativeData, allData];

    setGlobalNorms(decodings);
    decodingsAccessor(decodings);
}

function getModulations() {
    const checkedStates = Array.from(document.querySelectorAll('.top-down-toggle')).map(toggle => toggle.checked);
    // Determine modulation values for encoding features based on selected outputs.
    const modelActivations = getModelPredictions().activations;
    return checkedStates.map((checked, i) => {
        const select = checked ? 1 : 0;
        const y = modelActivations[i];
        // const y = 1;
        return weights2.map((feature) => feature[i] * select * y);
    }).reduce((acc, arr) => acc.map((val, idx) => val + arr[idx]));
}

function getSelections(modulated, positive){
    let condition = null;
    switch (positive){
        case true:
            condition = (value) => value > 0;
            break;
        case false:
            condition = (value) => value < 0;
            break;
        default:
            condition = (value) => value !== 0;
    }
    return modulated
        .map((value, idx) => condition(value) ? idx : -1)
        .filter(idx => idx !== -1);
}

function setGlobalNorms(images) {
    const globalNorms = normsToggleAccessor();
    const max = Math.max(...images.map(img => img.max));
    const min = Math.min(...images.map(img => img.min));
    normsMaxAccessor(max);
    normsMinAccessor(min);
}

function drawDecodings() {
    const useGlobalNorms = normsToggleAccessor();
    const decodings = decodingsAccessor();
    // Update aggregate images in the UI.
    generateAggregateImage(5, document.querySelector('#decoded-positive-svg'), 'positive-aggregate', decodings[0], useGlobalNorms);
    generateAggregateImage(5, document.querySelector('#decoded-negative-svg'), 'negative-aggregate', decodings[1], useGlobalNorms);
    generateAggregateImage(5, document.querySelector('#decoded-hyperplane-svg'), 'hyperplane-aggregate', decodings[2], useGlobalNorms);
}

function drawInputSaliency() {
    const useGlobalNorms = normsToggleAccessor();
    const input = getInstance().image;
    const decodings = decodingsAccessor();
    const saliencies = decodings.map(decoding => ({
        image: input.map((val, idx) => val * decoding.image[idx]),
        min: decoding.min,
        max: decoding.max
    }));
    generateAggregateImage(5, document.querySelector('#saliency-positive-svg'), 'positive-saliency', saliencies[0], useGlobalNorms);
    generateAggregateImage(5, document.querySelector('#saliency-negative-svg'), 'negative-saliency', saliencies[1], useGlobalNorms);
    generateAggregateImage(5, document.querySelector('#saliency-hyperplane-svg'), 'hyperplane-saliency', saliencies[2], useGlobalNorms);
}

async function drawMaxSimilarity() {
    // Select and clear svgs
    const svgs = document.querySelectorAll('[id^="max-"][id$="-svg"]');
    svgs.forEach(svg => {
        svg.innerHTML = '';
        svg.style.display = 'none';
    });
    
    // Show loading spinners
    document.querySelectorAll(".spinner.max-sim").forEach(spinner => {
        spinner.style.display = "block";
    });

    await new Promise(resolve => setTimeout(() => {
        const decodings = decodingsAccessor();

        const positive = getMaxSimilarity(decodings[0], 6);
        const negative = getMaxSimilarity(decodings[1], 6);
        const hyperplane = getMaxSimilarity(decodings[2], 6);

        drawInstancesGroup(positive, 2, svgs[0]);
        drawInstancesGroup(negative, 2, svgs[1]);
        drawInstancesGroup(hyperplane, 2, svgs[2]);

        // Hide loading spinners
        document.querySelectorAll(".spinner.max-sim").forEach(spinner => {
            spinner.style.display = "none";
        });

        svgs.forEach(svg => {
            svg.style.display = 'block';
        });

        resolve();
    }, 0));
}

export function showHideInformation() {
    const info = document.querySelector('#info-toggle').checked;
    const informationElements = document.querySelectorAll('.information');
    informationElements.forEach(element => element.style.display = info ? "block" : "none");
}

export function showHideMaxSim(){
    const maxSim = document.querySelector('#max-sim-toggle').checked;
    document.querySelector('#max-sim-message').style.display = maxSim ? 'none' : 'block';
    document.querySelectorAll('[id^="max-"][id$="-svg"]')
        .forEach(svg => {
            svg.style.display = 'none';
        });
    document.querySelectorAll('.spinner.max-sim')
        .forEach(spinner => {
            spinner.style.display = maxSim ? 'block' : "none";
        });
}