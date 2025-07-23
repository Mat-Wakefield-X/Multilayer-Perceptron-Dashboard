import { nodeSelections, activationsAccessor, weights2, normsToggleAccessor, normsMaxAccessor, normsMinAccessor, decodingsAccessor, loadInstance, getInstance, updatePredictions, getModelPredictions, model, modulationsAccessor } from "./init.js";
import { generateAggregateImage, drawInputImage, drawInstancesGroup } from "./draw_weights.js";
import { generateImage, getMaxSimilarity as findMaxSimilarity, computeAggregateInstance } from "./generate_images.js";
import { runMNISTInference } from "./run_model.js";

/*
-------------------------------------------------------------------------------
    FEATURE INSPECTIONS
-------------------------------------------------------------------------------
*/

document.querySelector('#reset-manual').addEventListener('click', resetSelections);

document.querySelector('#weighting-toggle').addEventListener('change', function() {
    applyEncodingFeatureStyles();
    showHideHighlightingTypeSwitch();
});

document.querySelector("#modulation-toggle").addEventListener('change', applyEncodingFeatureStyles);

export function tooltipEventListener(elements) {
    console.log('Applying event listeners to encoding images');
    elements.forEach(wrapper => {
        const img = wrapper.querySelector("img");
        const num = extractFeatureNumber(img);

        img.addEventListener('mouseenter', function (e) {
            showEncodingTooltip(e, num, img, wrapper);
        });

        img.addEventListener('touchstart', function (e) {
            // For touch devices, show tooltip on touch
            showEncodingTooltip(e, num, img, wrapper);
        });

        img.addEventListener('mousemove', function (e) {
            // Move tooltip with mouse
            showEncodingTooltip(e, null, img, wrapper);
        });

        img.addEventListener('mouseleave', function () {
            const tooltip = document.getElementById('encoding-tooltip');
            tooltip.style.display = 'none';
        });
    });
}

export function encodeClickEventListener(elements) {
    elements.forEach(wrapper => {
        const img = wrapper.querySelector("img");
        const num = extractFeatureNumber(img).number;
        img.addEventListener('click', function () {
            selectEncodingFeature(wrapper, img, num);
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

function showEncodingTooltip(event, feature, img, wrapper) {
    const visible = img.classList.contains('visible');
    const selected = wrapper.classList.contains('selected');
    if(visible || selected) {
        const scale = 4; // Scale factor for tooltip image size
        const tooltip = document.getElementById('encoding-tooltip');
        // If feature is provided, set content; otherwise, just reposition
        if (feature) {
            const activation = activationsAccessor()[0][feature.number].toFixed(4);
            const modulation = modulationsAccessor()[feature.number].toFixed(4);
            tooltip.innerHTML = `
                <div style="font-weight:bold; margin-bottom:6px;">${feature.name}</div>
                <img src="${img.src}" style="width:${img.width * scale}px;height:${img.height * scale}px;display:block;margin:auto;" />
                <div style="margin-top: 6px;"><strong>Activation:</strong> ${activation} <strong>Modulation:</strong> ${modulation}</div>
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
}

function selectEncodingFeature(wrapper, img, num) {
    const weightings = document.querySelector("#weighting-toggle").checked;
    const visible = !weightings || (weightings && img.classList.contains('visible'));
    const selected = wrapper.classList.contains('selected');
    if(visible || selected) {
        if(!nodeSelections.includes(num)) {
        nodeSelections.push(num);
        wrapper.classList.add('selected'); 
        } else {
            const filtered = nodeSelections.filter(item => item !== num);
            nodeSelections.length = 0; // Clear the array
            nodeSelections.push(...filtered);
            wrapper.classList.remove('selected');
        }
        highlightImage(wrapper); // Update image border based on selection
        const data = generateImage(nodeSelections);
        generateAggregateImage(5, document.querySelector('#manual-svg'), 'manual-aggregate', data); // Regenerate aggregate image
        drawManualSaliency(data);
    }
}

function drawManualSaliency(data) {
    const saliency = {
        image: computeInputSaliency(data),
        min: data.min,
        max: data.max
    }
    generateAggregateImage(5, document.querySelector('#manual-saliency-svg'), 'manual-saliency', saliency);
}


function highlightImage(img) {
    if(img.classList.contains('selected')) {
        img.style.border = '2px solid blue'; // Highlight selected image
    } else {
        img.style.border = '2px solid transparent'; // Reset border for unselected images
    }
}

function resetSelections() {
    nodeSelections.length = 0; // Clear the array
    generateAggregateImage(5, document.querySelector('#manual-saliency-svg'), 'manual-saliency');
    generateAggregateImage(5, document.querySelector('#manual-svg'), 'manual-aggregate'); // Regenerate aggregate image
    const highlighted = document.querySelectorAll('.selected');
    highlighted.forEach(img => {
        img.classList.remove('selected'); // Remove the class
        highlightImage(img); // Reset border for highlighted images
    });
}

export function applyEncodingFeatureStyles(){
    const wrappers = document.querySelectorAll('#encoding_features .wrapper');
    const style = document.querySelector("#weighting-toggle").checked;
    const modulation = document.querySelector('#modulation-toggle').checked;

    const activations = modulation ? modulationsAccessor() : activationsAccessor()[0];
    if(activations != null)
    {
        const maxActivation = Math.max(...activations);
        wrappers.forEach((wrapper, i) => {
            const img = wrapper.querySelector("img");
            const tint = wrapper.querySelector(".tinted");
            if (style) {
                const value = activations[i];
                const normalised = Math.abs(value) / maxActivation;
                const scaled = 0.05 + (normalised * 0.95);
                const opacity = Math.min(scaled, 1).toFixed(3);
                img.style.opacity = (value == 0) ? 0 : opacity;
                const positive = value > 0;
                const colour = `rgba(${positive ? 0 : 125}, ${positive ? 125 : 0}, 0, ${opacity})`;
                tint.style.backgroundColor = (value == 0 || !modulation) ? null : colour;
                if(value == 0) {
                    img.classList.remove('visible');
                } else {
                    img.classList.add('visible');
                }
            } else {
                img.style.opacity = "1";
                tint.style.backgroundColor = null;
                img.classList.add('visible');
            }
        });
    }
}

export function showHideHighlightingTypeSwitch(){
    const highlighting = document.querySelector("#weighting-toggle").checked;
    document.querySelector('#type-switch').style.display = highlighting ? null : 'none';
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
            .replace(/[^\d.-]/g, '')                   // Remove everything except digits, dot, and minus
            .replace(/(?!^)-/g, '')                    // Remove all minus signs except the first
            .replace(/^(-?\.)/, '$1')                  // Prevent starting with just a dot after optional minus
            .replace(/(\..*)\./g, '$1');               // Allow only one dot

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
        applyEncodingFeatureStyles();
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
    const modulations = computeModulations();
    modulationsAccessor(modulations);
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

function computeModulations() {
    const checkedStates = Array.from(document.querySelectorAll('.top-down-toggle')).map(toggle => toggle.checked);
    // Determine modulation values for encoding features based on selected outputs.
    const outputActivations = getModelPredictions().activations;
    const modulations = checkedStates.map((checked, i) => {
        const select = checked ? 1 : 0;
        const y = outputActivations[i];
        // const y = 1;
        return weights2.map((weight) => weight[i] * select * y);
        }).reduce((acc, arr) => acc.map((val, idx) => val + arr[idx]));
    const featureActivations = activationsAccessor()[0];
    return modulations.map((mod, i) => mod * featureActivations[i]);
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
    const decodings = decodingsAccessor();
    const saliencies = decodings.map(decoding => ({
        image: computeInputSaliency(decoding),
        min: decoding.min,
        max: decoding.max
    }));
    generateAggregateImage(5, document.querySelector('#saliency-positive-svg'), 'positive-saliency', saliencies[0], useGlobalNorms);
    generateAggregateImage(5, document.querySelector('#saliency-negative-svg'), 'negative-saliency', saliencies[1], useGlobalNorms);
    generateAggregateImage(5, document.querySelector('#saliency-hyperplane-svg'), 'hyperplane-saliency', saliencies[2], useGlobalNorms);
}

function computeInputSaliency(comparison) {
    const input = getInstance().image;
    return input.map((val, idx) => val * comparison.image[idx])
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

        const positive = findMaxSimilarity(decodings[0], 6);
        const negative = findMaxSimilarity(decodings[1], 6);
        const hyperplane = findMaxSimilarity(decodings[2], 6);

        drawInstancesGroup(positive, 2, svgs[0]);
        drawInstancesGroup(negative, 2, svgs[1]);
        drawInstancesGroup(hyperplane, 2, svgs[2]);

        const positiveAggregate = computeAggregateInstance(positive);
        const negativeAggregate = computeAggregateInstance(negative);
        const hyperplaneAggregate = computeAggregateInstance(hyperplane);

        drawInputImage(positiveAggregate, 4, svgs[3]);
        drawInputImage(negativeAggregate, 4, svgs[4]);
        drawInputImage(hyperplaneAggregate, 4, svgs[5]);

        // Hide loading spinners
        document.querySelectorAll(".spinner.max-sim").forEach(spinner => {
            spinner.style.display = "none";
        });

        svgs.forEach(svg => {
            svg.style.display = 'block';
        });

        resolve();
    }, 1));
}

export function showHideInformation() {
    const info = document.querySelector('#info-toggle').checked;
    const informationElements = document.querySelectorAll('.information');
    informationElements.forEach(element => element.style.display = info ? "block" : "none");
}

export function showHideMaxSim(){
    const maxSim = document.querySelector('#max-sim-toggle').checked;
    document.querySelectorAll('.max-sim-message').forEach(message => {
        message.style.display = maxSim ? 'none' : 'block';
    });
    document.querySelectorAll('[id^="max-"][id$="-svg"]')
        .forEach(svg => {
            svg.style.display = 'none';
        });
    document.querySelectorAll('.spinner.max-sim')
        .forEach(spinner => {
            spinner.style.display = maxSim ? 'block' : "none";
        });
}